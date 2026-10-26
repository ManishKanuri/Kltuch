"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  isAuthRetryableFetchError,
  type PostgrestError,
  type RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import type { Coach, CoachAttendance, Role, School, Session, TimetableSlot } from "./types";
import { OPEN_ACCESS } from "./access";
import { addDays, isoWeekday } from "./dates";
import { PROGRAMME, planSession } from "./programme";
import type { ModuleKey } from "./nav";
import { createClient } from "./supabase/client";
import type { Database } from "./supabase/database.types";
import { mapCoach, mapCoachAttendance, mapSchool, mapSession, mapSlot } from "./supabase/mappers";

// ---- lightweight id generator for optimistic-update temp IDs ----
// (overwritten by the real UUID once each insert's response comes back)
let _idc = 1000;
const nid = (p: string) => `${p}_${++_idc}`;
const isTempId = (id: string) => /^[a-z]+_\d+$/.test(id);

// Our own optimistic insert and its realtime echo can land in either order,
// so every merge is keyed by id to keep a row from appearing twice.
function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

function swapTemp<T extends { id: string }>(list: T[], tempId: string, real: T): T[] {
  const rest = list.filter((x) => x.id !== real.id);
  return rest.some((x) => x.id === tempId) ? rest.map((x) => (x.id === tempId ? real : x)) : [...rest, real];
}

// Puts back the old values after a failed save, unless a newer change (another
// tap, or someone else's edit arriving live) has replaced ours in the meantime.
function revertIfUnchanged<T extends { id: string }>(list: T[], id: string, sent: Partial<T>, previous: Partial<T>): T[] {
  return list.map((item) => {
    if (item.id !== id) return item;
    const stillOurs = (Object.keys(sent) as (keyof T)[]).every((key) => item[key] === sent[key]);
    return stillOurs ? { ...item, ...previous } : item;
  });
}

type Tables = Database["public"]["Tables"];

// The API returns at most 1,000 rows per request (Supabase's max_rows) and a
// plain select silently stops there, so read every table in pages.
const PAGE_SIZE = 1000;
async function selectAllPages<Row>(
  page: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

// What a session edit can change, in app terms and in database columns.
export type SessionPatch = Partial<
  Pick<Session, "status" | "reason" | "actualDate" | "remarks" | "coachId" | "sport" | "curriculumCode" | "lesson">
>;
const SESSION_COLUMNS: Record<keyof SessionPatch, keyof Tables["pet_sessions"]["Update"]> = {
  status: "status",
  reason: "reason",
  actualDate: "actual_date",
  remarks: "remarks",
  coachId: "coach_id",
  sport: "sport",
  curriculumCode: "curriculum_code",
  lesson: "lesson",
};

// Until the data (and, with sign-in on, the user's profile) arrives, the app
// shows a loading screen rather than guessing a role and flashing the wrong
// screens. With sign-in off, "choose" asks who is using the app.
export type StartupStatus = "loading" | "choose" | "ready" | "no-profile" | "no-programme" | "error";

export type AttendanceMark = "present" | "absent" | null;

export interface ToastMsg {
  id: number;
  text: string;
}

interface Viewer {
  role: Role;
  coachId: string | null;
}

interface StoreShape {
  // identity + navigation
  // `role` is what the UI renders as. With sign-in on it comes from the
  // user's profile (admins may preview other views); with sign-in off it is
  // the view picked on the start screen.
  role: Role;
  actualRole: Role;
  setRole: (r: Role) => void;
  openAccess: boolean;
  chooseView: (role: Role, coachId?: string | null) => void;
  switchView: () => void;
  active: ModuleKey;
  setActive: (m: ModuleKey) => void;
  currentCoachId: string;
  setCurrentCoachId: (id: string) => void;
  userEmail: string | null;
  signOut: () => void;

  // data (the programme's school only)
  school: School | null;
  schools: School[];
  coaches: Coach[];
  slots: TimetableSlot[];
  sessions: Session[];
  attendance: CoachAttendance[];
  status: StartupStatus;
  // True while the realtime channel is connected and streaming changes.
  live: boolean;

  // actions: each shows its change at once and resolves true once the
  // database has saved it. On failure the change is undone and a toast says so.
  updateSession: (id: string, patch: SessionPatch) => Promise<boolean>;
  assignCoach: (slotIds: string[], coachId: string | null) => Promise<boolean>;
  addSessions: (from: string, to: string) => Promise<{ created: number; skipped: number } | null>;
  addCoach: (c: { name: string; phone: string }) => Promise<boolean>;
  updateCoach: (id: string, patch: Partial<Pick<Coach, "name" | "phone" | "status">>) => Promise<boolean>;
  setAttendance: (coachId: string, date: string, mark: AttendanceMark) => Promise<boolean>;

  // helpers
  coachName: (id: string | null) => string;
  schoolName: (id: string) => string;

  // toasts
  toasts: ToastMsg[];
  toast: (text: string) => void;
  dismissToast: (id: number) => void;
}

const Ctx = createContext<StoreShape | null>(null);

const VIEW_KEY = "klutch-view";

function readStoredViewer(): Viewer | null {
  try {
    const raw = window.localStorage.getItem(VIEW_KEY);
    const parsed = raw ? (JSON.parse(raw) as Viewer) : null;
    return parsed && ["admin", "coach", "school"].includes(parsed.role) ? parsed : null;
  } catch {
    return null;
  }
}

function storeViewer(viewer: Viewer | null) {
  try {
    if (viewer) window.localStorage.setItem(VIEW_KEY, JSON.stringify(viewer));
    else window.localStorage.removeItem(VIEW_KEY);
  } catch {
    // Private windows can refuse storage; the view is simply asked for again.
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  // ---- who is using the app ----
  // Signed in: the authenticated role, "coach" (least privilege) until the
  // profile loads; never trust a default of "admin".
  const [actualRole, setActualRole] = useState<Role>("coach");
  const [actualCoachId, setActualCoachId] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [viewAsRole, setViewAsRole] = useState<Role | null>(null);
  // Sign-in off: the view picked on the start screen (remembered per device).
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [viewerRead, setViewerRead] = useState(!OPEN_ACCESS);

  const role: Role = OPEN_ACCESS ? (viewer?.role ?? "admin") : (viewAsRole ?? actualRole);
  const setRole = useCallback(
    (r: Role) => {
      if (!OPEN_ACCESS) setViewAsRole(actualRole === "admin" ? r : null);
    },
    [actualRole]
  );

  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [previewCoachId, setPreviewCoachId] = useState("");

  const chooseView = useCallback((r: Role, coachId: string | null = null) => {
    const next = { role: r, coachId };
    setViewer(next);
    storeViewer(next);
    setActive("dashboard");
  }, []);
  const switchView = useCallback(() => {
    setViewer(null);
    storeViewer(null);
  }, []);

  const signOut = useCallback(async () => {
    if (OPEN_ACCESS) return switchView();
    // Signs out this device only; the user's other devices stay signed in.
    await supabase.auth.signOut({ scope: "local" });
    // A full page load drops everything this page holds in memory.
    window.location.assign("/login");
  }, [supabase, switchView]);

  // ---- Supabase-backed state ----
  const [schools, setSchools] = useState<School[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<CoachAttendance[]>([]);
  const [profileStatus, setProfileStatus] = useState<StartupStatus>(OPEN_ACCESS ? "ready" : "loading");
  const [dataStatus, setDataStatus] = useState<StartupStatus>("loading");
  const [live, setLive] = useState(false);

  const schoolIdRef = useRef<string | null>(null);
  const coachIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    coachIdsRef.current = new Set(coaches.map((c) => c.id));
  }, [coaches]);

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastSeq = useRef(0);
  const toast = useCallback((text: string) => {
    // ref-based id so the updater stays pure (Strict Mode double-invokes updaters)
    const id = (toastSeq.current += 1);
    setToasts((t) => [...t, { id, text }]);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // ---- sign-in off: remember which view this device picked ----
  useEffect(() => {
    if (!OPEN_ACCESS) return;
    setViewer(readStoredViewer());
    setViewerRead(true);
  }, []);

  // ---- sign-in on: load the user's profile (role, coach_id, school_id) ----
  useEffect(() => {
    if (OPEN_ACCESS) return;
    let cancelled = false;

    async function loadProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        if (isAuthRetryableFetchError(userError)) {
          setProfileStatus((prev) => (prev === "ready" ? prev : "error"));
        } else {
          // Signed out (here or in another tab), or the session ran out.
          window.location.assign("/login");
        }
        return;
      }

      setUserEmail(user.email ?? null);

      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      if (error || !profile) {
        console.error("Failed to load profile:", error ?? "no profile row");
        // This reruns on every token refresh; a failed rerun shouldn't take
        // away a session that has already loaded.
        setProfileStatus((prev) => (prev === "ready" ? prev : error ? "error" : "no-profile"));
        return;
      }

      setActualRole(profile.role);
      setActualCoachId(profile.coach_id ?? "");
      setProfileStatus("ready");
    }

    loadProfile();

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") window.location.assign("/login");
      else loadProfile();
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  // ---- initial load: the programme's school and everything under it ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const schoolRows = await selectAllPages((a, b) => supabase.from("schools").select("*").order("id").range(a, b));
      if (cancelled) return;
      const mappedSchools = schoolRows.map(mapSchool);
      const programmeSchool = mappedSchools.find((s) => s.name === PROGRAMME.schoolName) ?? null;
      setSchools(mappedSchools);
      setSchool(programmeSchool);
      if (!programmeSchool) {
        setDataStatus("no-programme");
        return;
      }
      schoolIdRef.current = programmeSchool.id;
      const sid = programmeSchool.id;

      const [coachRows, slotRows, sessionRows, attendanceRows] = await Promise.all([
        selectAllPages((a, b) => supabase.from("coaches").select("*").eq("assigned_school_id", sid).order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("timetable_slots").select("*").eq("school_id", sid).order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("pet_sessions").select("*").eq("school_id", sid).order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("coach_attendance").select("*").order("id").range(a, b)),
      ]);
      if (cancelled) return;

      const mappedCoaches = coachRows.map(mapCoach);
      const ids = new Set(mappedCoaches.map((c) => c.id));
      setCoaches(mappedCoaches);
      setSlots(slotRows.map(mapSlot));
      setSessions(sessionRows.map(mapSession));
      setAttendance(attendanceRows.map(mapCoachAttendance).filter((a) => ids.has(a.coachId)));
      setDataStatus("ready");
    }

    load().catch((err) => {
      if (!cancelled) {
        console.error("Failed to load data from Supabase:", err);
        setDataStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // ---- live updates: merge other people's changes in as they happen ----
  useEffect(() => {
    const merge =
      <R extends { id: string }, T extends { id: string }>(
        setList: React.Dispatch<React.SetStateAction<T[]>>,
        map: (row: R) => T,
        belongs: (row: R) => boolean
      ) =>
      (payload: RealtimePostgresChangesPayload<R>) => {
        if (payload.eventType === "DELETE") {
          const id = payload.old.id;
          setList((prev) => prev.filter((item) => item.id !== id));
        } else if (belongs(payload.new)) {
          const item = map(payload.new);
          setList((prev) => upsertById(prev, item));
        }
      };
    const table = (name: keyof Tables) => ({ event: "*", schema: "public", table: name }) as const;
    const inSchool = (row: { school_id: string }) => row.school_id === schoolIdRef.current;

    const channel = supabase
      .channel("klutch-live")
      .on<Tables["pet_sessions"]["Row"]>("postgres_changes", table("pet_sessions"), merge(setSessions, mapSession, inSchool))
      .on<Tables["timetable_slots"]["Row"]>("postgres_changes", table("timetable_slots"), merge(setSlots, mapSlot, inSchool))
      .on<Tables["coaches"]["Row"]>(
        "postgres_changes",
        table("coaches"),
        merge(setCoaches, mapCoach, (row) => row.assigned_school_id === schoolIdRef.current)
      )
      .on<Tables["coach_attendance"]["Row"]>(
        "postgres_changes",
        table("coach_attendance"),
        merge(setAttendance, mapCoachAttendance, (row) => coachIdsRef.current.has(row.coach_id))
      )
      .subscribe((s) => setLive(s === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Every save shows on screen straight away. When the database doesn't save
  // it, the caller undoes the change and this says so.
  const saveFailed = useCallback(
    (what: string, error: PostgrestError | null) => {
      console.error(`Couldn't ${what}:`, error ?? "no row was changed");
      // A request that never reached the database comes back without an error code.
      toast(
        error && !error.code
          ? `Couldn't ${what}. Check your connection and try again.`
          : `Couldn't ${what}. Refresh the page and try again.`
      );
    },
    [toast]
  );

  // Changes fields on one row at once, then saves them. An update that changes
  // no row has failed too: that's how row-level security refuses one.
  const saveUpdate = useCallback(
    async <T extends { id: string }>(
      what: string,
      setList: React.Dispatch<React.SetStateAction<T[]>>,
      item: T | undefined,
      changes: Partial<T>,
      send: () => PromiseLike<{ data: unknown[] | null; error: PostgrestError | null }>
    ) => {
      if (!item) return false;
      const previous: Partial<T> = {};
      for (const key of Object.keys(changes) as (keyof T)[]) previous[key] = item[key];
      setList((list) => list.map((x) => (x.id === item.id ? { ...x, ...changes } : x)));
      const { data, error } = await send();
      if (!error && data?.length) return true;
      setList((list) => revertIfUnchanged(list, item.id, changes, previous));
      saveFailed(what, error);
      return false;
    },
    [saveFailed]
  );

  const updateSession = useCallback(
    (id: string, patch: SessionPatch) => {
      const changes = { ...patch };
      // A reason only explains a session that didn't go ahead as planned.
      if (changes.status === "Done" || changes.status === "Not reported") changes.reason = null;
      const row: Tables["pet_sessions"]["Update"] = {};
      for (const [key, value] of Object.entries(changes) as [keyof SessionPatch, unknown][]) {
        (row as Record<string, unknown>)[SESSION_COLUMNS[key]] = value;
      }
      return saveUpdate("save the session", setSessions, sessions.find((s) => s.id === id), changes, () =>
        supabase.from("pet_sessions").update(row).eq("id", id).select("id")
      );
    },
    [sessions, supabase, saveUpdate]
  );

  // Assigns a coach to weekly slots, and to those slots' sessions that nobody
  // has reported yet. Reported sessions keep the coach who delivered them.
  const assignCoach = useCallback(
    async (slotIds: string[], coachId: string | null) => {
      if (!slotIds.length) return true;
      const before = { slots, sessions };
      const ids = new Set(slotIds);
      const reassign = (s: Session) => s.slotId !== null && ids.has(s.slotId) && s.status === "Not reported";
      setSlots((prev) => prev.map((s) => (ids.has(s.id) ? { ...s, coachId } : s)));
      setSessions((prev) => prev.map((s) => (reassign(s) ? { ...s, coachId } : s)));
      const [slotRes, sessionRes] = await Promise.all([
        supabase.from("timetable_slots").update({ coach_id: coachId }).in("id", slotIds).select("id"),
        supabase
          .from("pet_sessions")
          .update({ coach_id: coachId })
          .in("slot_id", slotIds)
          .eq("status", "Not reported")
          .select("id"),
      ]);
      if (!slotRes.error && slotRes.data.length && !sessionRes.error) return true;
      setSlots(before.slots);
      setSessions(before.sessions);
      saveFailed("assign the coach", slotRes.error ?? sessionRes.error);
      return false;
    },
    [slots, sessions, supabase, saveFailed]
  );

  // Adds a session for every timetable slot between two dates, within the
  // programme's 24 weeks. Sessions that already exist are skipped (each has a
  // unique code), so running it again is safe.
  const addSessions = useCallback(
    async (from: string, to: string) => {
      if (!school) return null;
      const rows: Tables["pet_sessions"]["Insert"][] = [];
      for (let date = from; date <= to; date = addDays(date, 1)) {
        for (const slot of slots.filter((s) => s.weekday === isoWeekday(date))) {
          const plan = planSession(date, {
            period: slot.period,
            group: slot.groupLabel,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
          if (!plan) continue;
          rows.push({
            code: plan.code,
            school_id: school.id,
            slot_id: slot.id,
            date,
            period: plan.period,
            start_time: plan.startTime,
            end_time: plan.endTime,
            group_label: plan.groupLabel,
            grade: plan.grade,
            teaching_week: plan.teachingWeek,
            block: plan.block,
            week_in_block: plan.weekInBlock,
            sport: plan.sport,
            curriculum_code: plan.curriculumCode,
            lesson: plan.lesson,
            coach_id: slot.coachId,
          });
        }
      }
      let created = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const { data, error } = await supabase
          .from("pet_sessions")
          .upsert(rows.slice(i, i + 500), { onConflict: "code", ignoreDuplicates: true })
          .select("*");
        if (error) {
          // Earlier batches may have saved; running it again skips those.
          saveFailed("add all the sessions", error);
          return null;
        }
        created += data.length;
        setSessions((prev) => data.reduce((list, row) => upsertById(list, mapSession(row)), prev));
      }
      return { created, skipped: rows.length - created };
    },
    [school, slots, supabase, saveFailed]
  );

  const addCoach = useCallback(
    async (c: { name: string; phone: string }) => {
      if (!school) return false;
      const temp: Coach = { id: nid("co"), name: c.name, phone: c.phone, assignedSchoolId: school.id, status: "Active" };
      setCoaches((prev) => [...prev, temp]);
      const { data, error } = await supabase
        .from("coaches")
        .insert({ name: c.name, phone: c.phone, assigned_school_id: school.id, status: "Active" })
        .select("*")
        .single();
      if (error) {
        setCoaches((prev) => prev.filter((x) => x.id !== temp.id));
        saveFailed("add the coach", error);
        return false;
      }
      setCoaches((prev) => swapTemp(prev, temp.id, mapCoach(data)));
      return true;
    },
    [school, supabase, saveFailed]
  );

  const updateCoach = useCallback(
    (id: string, patch: Partial<Pick<Coach, "name" | "phone" | "status">>) =>
      saveUpdate("save the coach", setCoaches, coaches.find((c) => c.id === id), patch, () =>
        supabase.from("coaches").update(patch).eq("id", id).select("id")
      ),
    [coaches, supabase, saveUpdate]
  );

  const setAttendanceMark = useCallback(
    async (coachId: string, date: string, mark: AttendanceMark) => {
      const existing = attendance.find((a) => a.coachId === coachId && a.date === date);
      // A first tap still saving has no real id to update yet.
      if (existing && isTempId(existing.id)) return false;

      if (mark === null) {
        if (!existing) return true;
        setAttendance((prev) => prev.filter((a) => a.id !== existing.id));
        const { data, error } = await supabase.from("coach_attendance").delete().eq("id", existing.id).select("id");
        if (!error && data.length) return true;
        setAttendance((prev) => upsertById(prev, existing));
        saveFailed("clear the attendance", error);
        return false;
      }

      const present = mark === "present";
      if (existing) {
        return saveUpdate("save attendance", setAttendance, existing, { present }, () =>
          supabase.from("coach_attendance").update({ present }).eq("id", existing.id).select("id")
        );
      }
      const temp: CoachAttendance = { id: nid("at"), coachId, date, present };
      setAttendance((prev) => [...prev, temp]);
      const { data, error } = await supabase
        .from("coach_attendance")
        .insert({ coach_id: coachId, date, present })
        .select("*")
        .single();
      if (error) {
        setAttendance((prev) => prev.filter((a) => a.id !== temp.id));
        saveFailed("save attendance", error);
        return false;
      }
      setAttendance((prev) => swapTemp(prev, temp.id, mapCoachAttendance(data)));
      return true;
    },
    [attendance, supabase, saveUpdate, saveFailed]
  );

  // Coaches in name order ("Coach 2" before "Coach 10"), everywhere.
  const sortedCoaches = useMemo(
    () => [...coaches].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    [coaches]
  );

  const coachName = useCallback(
    (id: string | null) => (id ? (coaches.find((c) => c.id === id)?.name ?? "Unknown coach") : "Unassigned"),
    [coaches]
  );
  const schoolName = useCallback((id: string) => schools.find((s) => s.id === id)?.name ?? "—", [schools]);

  // The coach whose sessions the coach view shows: the signed-in coach, the
  // one picked on the start screen, or (for an admin previewing) any coach.
  const viewerCoachId = OPEN_ACCESS ? (viewer?.coachId ?? "") : actualCoachId;
  const currentCoachId =
    (role === "coach" ? viewerCoachId : "") || previewCoachId || viewerCoachId || sortedCoaches[0]?.id || "";

  const status: StartupStatus = (() => {
    if (profileStatus !== "ready") return profileStatus;
    if (dataStatus !== "ready") return dataStatus;
    if (!viewerRead) return "loading";
    if (OPEN_ACCESS && (!viewer || (viewer.role === "coach" && !coaches.some((c) => c.id === viewer.coachId)))) {
      return "choose";
    }
    return "ready";
  })();

  const value = useMemo<StoreShape>(
    () => ({
      role,
      actualRole: OPEN_ACCESS ? role : actualRole,
      setRole,
      openAccess: OPEN_ACCESS,
      chooseView,
      switchView,
      active,
      setActive,
      currentCoachId,
      setCurrentCoachId: setPreviewCoachId,
      userEmail,
      signOut,
      school,
      schools,
      coaches: sortedCoaches,
      slots,
      sessions,
      attendance,
      status,
      live,
      updateSession,
      assignCoach,
      addSessions,
      addCoach,
      updateCoach,
      setAttendance: setAttendanceMark,
      coachName,
      schoolName,
      toasts,
      toast,
      dismissToast,
    }),
    [
      role,
      actualRole,
      setRole,
      chooseView,
      switchView,
      active,
      currentCoachId,
      userEmail,
      signOut,
      school,
      schools,
      sortedCoaches,
      slots,
      sessions,
      attendance,
      status,
      live,
      updateSession,
      assignCoach,
      addSessions,
      addCoach,
      updateCoach,
      setAttendanceMark,
      coachName,
      schoolName,
      toasts,
      toast,
      dismissToast,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}
