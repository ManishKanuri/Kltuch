"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Assessment,
  Cancellation,
  CancellationRow,
  CancelledBy,
  ClassRoom,
  ClassSlot,
  Coach,
  CoachAttendance,
  CurriculumWeek,
  Equipment,
  FitnessAssessment,
  Role,
  School,
  Session,
  SessionStatus,
  SkillKey,
} from "./types";
import {
  isAuthRetryableFetchError,
  type PostgrestError,
  type RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { addDays, isoWeekday, todayISO } from "./dates";
import type { ModuleKey } from "./nav";
import { createClient } from "./supabase/client";
import type { Database } from "./supabase/database.types";
import {
  mapAssessment,
  mapCancellation,
  mapCancellationRow,
  mapClass,
  mapClassSlot,
  mapCoach,
  mapCoachAttendance,
  mapCurriculum,
  mapEquipment,
  mapFitnessAssessment,
  mapSchool,
  mapSession,
} from "./supabase/mappers";

// ---- lightweight id generator for optimistic-update temp IDs ----
// (overwritten by the real UUID once each insert's response comes back)
let _idc = 1000;
const nid = (p: string) => `${p}_${++_idc}`;
const isTempId = (id: string) => /^[a-z]+_\d+$/.test(id);

// Our own optimistic insert and its realtime echo can land in either order,
// so every merge is keyed by id to keep a row from appearing twice.
function upsertById<T extends { id: string }>(list: T[], item: T, prepend = false): T[] {
  if (list.some((x) => x.id === item.id)) return list.map((x) => (x.id === item.id ? item : x));
  return prepend ? [item, ...list] : [...list, item];
}

function swapTemp<T extends { id: string }>(list: T[], tempId: string, real: T): T[] {
  const rest = list.filter((x) => x.id !== real.id);
  return rest.some((x) => x.id === tempId)
    ? rest.map((x) => (x.id === tempId ? real : x))
    : [...rest, real];
}

// Puts back the old values after a failed save, unless a newer change (another
// tap, or someone else's edit arriving live) has replaced ours in the meantime.
function revertIfUnchanged<T extends { id: string }>(
  list: T[],
  id: string,
  sent: Partial<T>,
  previous: Partial<T>
): T[] {
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

// Until the user's profile and the first data load arrive, the app shows a
// loading screen rather than guessing a role and flashing the wrong screens.
export type StartupStatus = "loading" | "ready" | "no-profile" | "error";

export interface ToastMsg {
  id: number;
  text: string;
}

interface StoreShape {
  // identity + navigation
  // `role` is what the UI renders as — admins may temporarily "view as"
  // coach/school for testing; `actualRole` is the real, authenticated role
  // from the user's profiles row and is what every Supabase query/RLS check
  // actually honors. Only an admin's `actualRole` is allowed to diverge.
  role: Role;
  actualRole: Role;
  setRole: (r: Role) => void;
  active: ModuleKey;
  setActive: (m: ModuleKey) => void;
  currentCoachId: string;
  currentSchoolId: string;
  setCurrentSchoolId: (id: string) => void;
  userEmail: string | null;
  signOut: () => void;

  // data
  schools: School[];
  coaches: Coach[];
  classes: ClassRoom[];
  sessions: Session[];
  cancellations: Cancellation[];
  cancellationRows: CancellationRow[];
  assessments: Assessment[];
  equipment: Equipment[];
  attendance: CoachAttendance[];
  curriculum: CurriculumWeek[];
  fitnessAssessments: FitnessAssessment[];
  status: StartupStatus;
  // True while the realtime channel is connected and streaming changes.
  live: boolean;

  // actions: each shows its change at once and resolves true once the
  // database has saved it. On failure the change is undone and a toast says so.
  toggleAttendance: (coachId: string) => Promise<boolean>;
  setSessionStatus: (sessionId: string, status: SessionStatus) => Promise<boolean>;
  setCurriculumWeek: (sessionId: string, week: number) => Promise<boolean>;
  logCancellation: (
    sessionId: string,
    cancelledBy: CancelledBy,
    reason: string,
    rescheduledDate: string | null
  ) => Promise<boolean>;
  addAssessment: (a: Omit<Assessment, "id">) => Promise<boolean>;
  updateAssessment: (id: string, ratings: Record<SkillKey, number>) => Promise<boolean>;
  addEquipment: (e: Omit<Equipment, "id">) => Promise<boolean>;
  updateEquipmentStatus: (
    id: string,
    condition: Equipment["condition"],
    status: Equipment["status"]
  ) => Promise<boolean>;
  addCoach: (c: Omit<Coach, "id">) => Promise<boolean>;
  setCoachRating: (id: string, rating: number) => Promise<boolean>;

  // timetable + scheduling
  schedule: ClassSlot[];
  addSlot: (classId: string, weekday: number, startTime: string) => Promise<boolean>;
  removeSlot: (id: string) => void;
  createSessions: (from: string, to: string) => Promise<{ created: number; skipped: number } | null>;
  addSession: (classId: string, date: string, startTime: string | null) => Promise<boolean>;

  // helpers
  schoolName: (id: string) => string;
  coachName: (id: string) => string;
  classById: (id: string) => ClassRoom | undefined;
  classLabel: (id: string) => string;

  // toasts
  toasts: ToastMsg[];
  toast: (text: string) => void;
  dismissToast: (id: number) => void;
}

const Ctx = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  // The authenticated role — defaults to "coach" (least privilege) until the
  // real profile loads; never trust a default of "admin".
  const [actualRole, setActualRole] = useState<Role>("coach");
  const [actualCoachId, setActualCoachId] = useState<string>("");
  const [actualSchoolId, setActualSchoolId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // "View as" role — only ever diverges from actualRole when actualRole is
  // admin (the Sidebar/RoleSwitcher use this for admins to preview other
  // roles' screens; it never grants extra access, since every Supabase query
  // and RLS policy keys off actualRole/actualCoachId/actualSchoolId, not this).
  const [viewAsRole, setViewAsRole] = useState<Role | null>(null);
  const role = viewAsRole ?? actualRole;
  const setRole = useCallback(
    (r: Role) => setViewAsRole(actualRole === "admin" ? r : null),
    [actualRole]
  );

  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [currentSchoolId, setCurrentSchoolId] = useState<string>("");

  const signOut = useCallback(async () => {
    // Signs out this device only; the user's other devices stay signed in.
    await supabase.auth.signOut({ scope: "local" });
    // A full page load drops everything this page holds in memory.
    window.location.assign("/login");
  }, [supabase]);

  // ---- Supabase-backed state ----
  const [schools, setSchools] = useState<School[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [fitnessAssessments, setFitnessAssessments] = useState<FitnessAssessment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [cancellationRows, setCancellationRows] = useState<CancellationRow[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [attendance, setAttendance] = useState<CoachAttendance[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumWeek[]>([]);
  const [schedule, setSchedule] = useState<ClassSlot[]>([]);
  const [profileStatus, setProfileStatus] = useState<StartupStatus>("loading");
  const [dataStatus, setDataStatus] = useState<"loading" | "ready" | "error">("loading");
  const status: StartupStatus =
    profileStatus === "no-profile"
      ? "no-profile"
      : profileStatus === "error" || dataStatus === "error"
        ? "error"
        : profileStatus === "ready" && dataStatus === "ready"
          ? "ready"
          : "loading";
  const [live, setLive] = useState(false);

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastSeq = useRef(0);

  const toast = useCallback(
    (text: string) => {
      // ref-based id so the updater stays pure (Strict Mode double-invokes updaters)
      const id = (toastSeq.current += 1);
      setToasts((t) => [...t, { id, text }]);
      // auto-dismiss handled in UI via effect; keep store simple
    },
    []
  );
  const dismissToast = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  // ---- load the authenticated user's profile (role, coach_id, school_id) ----
  useEffect(() => {
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

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
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
      setActualSchoolId(profile.school_id ?? "");
      if (profile.school_id) setCurrentSchoolId(profile.school_id);
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

  // ---- initial load from Supabase ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [
        schoolRows,
        coachRows,
        classRows,
        assessmentRows,
        fitnessRows,
        sessionRows,
        cancellationRowsDb,
        cancellationViewRows,
        equipmentRows,
        attendanceRows,
        curriculumRows,
        scheduleRows,
      ] = await Promise.all([
        selectAllPages((a, b) => supabase.from("schools").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("coaches").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("classes").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("assessments").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("fitness_assessments").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("sessions").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("cancellations").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("cancellation_rows").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("equipment").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("coach_attendance").select("*").order("id").range(a, b)),
        selectAllPages((a, b) => supabase.from("curriculum").select("*").order("class_id").range(a, b)),
        selectAllPages((a, b) => supabase.from("class_schedule").select("*").order("id").range(a, b)),
      ]);

      if (cancelled) return;

      const mappedSchools = schoolRows.map(mapSchool);
      setSchools(mappedSchools);
      setCoaches(coachRows.map(mapCoach));
      setClasses(classRows.map(mapClass));
      setAssessments(assessmentRows.map(mapAssessment));
      setFitnessAssessments(fitnessRows.map(mapFitnessAssessment));
      setSessions(sessionRows.map(mapSession));
      setCancellations(cancellationRowsDb.map(mapCancellation));
      setCancellationRows(cancellationViewRows.map(mapCancellationRow));
      setEquipment(equipmentRows.map(mapEquipment));
      setAttendance(attendanceRows.map(mapCoachAttendance));
      setCurriculum(curriculumRows.map(mapCurriculum));
      setSchedule(scheduleRows.map(mapClassSlot));
      setCurrentSchoolId((prev) => prev || mappedSchools[0]?.id || "");
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
        map: (row: R) => T
      ) =>
      (payload: RealtimePostgresChangesPayload<R>) => {
        if (payload.eventType === "DELETE") {
          const id = payload.old.id;
          setList((prev) => prev.filter((item) => item.id !== id));
        } else {
          const item = map(payload.new);
          setList((prev) => upsertById(prev, item));
        }
      };
    const table = (name: keyof Tables) =>
      ({ event: "*", schema: "public", table: name }) as const;

    const channel = supabase
      .channel("klutch-live")
      .on<Tables["sessions"]["Row"]>("postgres_changes", table("sessions"), merge(setSessions, mapSession))
      .on<Tables["coach_attendance"]["Row"]>("postgres_changes", table("coach_attendance"), merge(setAttendance, mapCoachAttendance))
      .on<Tables["assessments"]["Row"]>("postgres_changes", table("assessments"), merge(setAssessments, mapAssessment))
      .on<Tables["equipment"]["Row"]>("postgres_changes", table("equipment"), merge(setEquipment, mapEquipment))
      .on<Tables["coaches"]["Row"]>("postgres_changes", table("coaches"), merge(setCoaches, mapCoach))
      .on<Tables["curriculum"]["Row"]>("postgres_changes", table("curriculum"), (payload) => {
        if (payload.eventType === "DELETE") {
          const classId = payload.old.class_id;
          setCurriculum((prev) => prev.filter((c) => c.classId !== classId));
          return;
        }
        const item = mapCurriculum(payload.new);
        setCurriculum((prev) =>
          prev.some((c) => c.classId === item.classId)
            ? prev.map((c) => (c.classId === item.classId ? item : c))
            : [...prev, item]
        );
      })
      .on<Tables["cancellations"]["Row"]>("postgres_changes", table("cancellations"), (payload) => {
        merge(setCancellations, mapCancellation)(payload);
        if (payload.eventType !== "INSERT") return;
        // cancellation_rows is a view, which Realtime can't stream; fetch the new row.
        supabase
          .from("cancellation_rows")
          .select("*")
          .eq("id", payload.new.id)
          .single()
          .then(({ data }) => {
            if (data) setCancellationRows((prev) => upsertById(prev, mapCancellationRow(data), true));
          });
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const schoolName = useCallback(
    (id: string) => schools.find((s) => s.id === id)?.name ?? "—",
    [schools]
  );
  const coachName = useCallback(
    (id: string) => coaches.find((c) => c.id === id)?.name ?? "—",
    [coaches]
  );
  const classById = useCallback(
    (id: string) => classes.find((c) => c.id === id),
    [classes]
  );
  const classLabel = useCallback(
    (id: string) => classById(id)?.className ?? "—",
    [classById]
  );

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

  // Adds a row at once under a temporary id, then swaps in the saved row.
  const saveInsert = useCallback(
    async <T extends { id: string }, Row>(
      what: string,
      setList: React.Dispatch<React.SetStateAction<T[]>>,
      temp: T,
      send: () => PromiseLike<{ data: Row | null; error: PostgrestError | null }>,
      map: (row: Row) => T
    ) => {
      setList((list) => [...list, temp]);
      const { data, error } = await send();
      if (error || !data) {
        setList((list) => list.filter((x) => x.id !== temp.id));
        saveFailed(what, error);
        return false;
      }
      setList((list) => swapTemp(list, temp.id, map(data)));
      return true;
    },
    [saveFailed]
  );

  const toggleAttendance = useCallback(
    async (coachId: string) => {
      const today = todayISO();
      const existing = attendance.find((a) => a.coachId === coachId && a.date === today);
      if (existing) {
        // The first tap is still saving, so its row has no real id to update yet.
        if (isTempId(existing.id)) return false;
        const present = !existing.present;
        return saveUpdate("save attendance", setAttendance, existing, { present }, () =>
          supabase.from("coach_attendance").update({ present }).eq("id", existing.id).select("id")
        );
      }
      return saveInsert(
        "save attendance",
        setAttendance,
        { id: nid("at"), coachId, date: today, present: true },
        () =>
          supabase
            .from("coach_attendance")
            .insert({ coach_id: coachId, date: today, present: true })
            .select("*")
            .single(),
        mapCoachAttendance
      );
    },
    [attendance, supabase, saveUpdate, saveInsert]
  );

  const setSessionStatus = useCallback(
    (sessionId: string, status: SessionStatus) =>
      saveUpdate("update the session", setSessions, sessions.find((s) => s.id === sessionId), { status }, () =>
        supabase.from("sessions").update({ status }).eq("id", sessionId).select("id")
      ),
    [sessions, supabase, saveUpdate]
  );

  const setCurriculumWeek = useCallback(
    (sessionId: string, week: number) =>
      saveUpdate(
        "update the curriculum week",
        setSessions,
        sessions.find((s) => s.id === sessionId),
        { curriculumWeek: week },
        () => supabase.from("sessions").update({ curriculum_week: week }).eq("id", sessionId).select("id")
      ),
    [sessions, supabase, saveUpdate]
  );

  const logCancellation = useCallback(
    async (
      sessionId: string,
      cancelledBy: CancelledBy,
      reason: string,
      rescheduledDate: string | null
    ) => {
      const sess = sessions.find((s) => s.id === sessionId);
      if (!sess) return false;
      const cls = classes.find((c) => c.id === sess.classId);
      const tempId = nid("ca");
      const tempRowId = nid("car");
      // Saving the cancellation also marks the session Cancelled, in the same
      // transaction (the mark_session_cancelled trigger), so show both now.
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: "Cancelled" as const } : s))
      );
      setCancellations((prev) => [
        ...prev,
        { id: tempId, sessionId, cancelledBy, reason, rescheduledDate },
      ]);
      setCancellationRows((prev) => [
        {
          id: tempRowId,
          date: sess.date,
          schoolId: cls?.schoolId ?? "",
          className: cls?.className ?? "—",
          cancelledBy,
          reason,
          rescheduledDate,
        },
        ...prev,
      ]);

      const { data, error } = await supabase
        .from("cancellations")
        .insert({ session_id: sessionId, cancelled_by: cancelledBy, reason, rescheduled_date: rescheduledDate })
        .select("*")
        .single();
      if (error) {
        setSessions((prev) =>
          revertIfUnchanged(prev, sessionId, { status: "Cancelled" }, { status: sess.status })
        );
        setCancellations((prev) => prev.filter((c) => c.id !== tempId));
        setCancellationRows((prev) => prev.filter((r) => r.id !== tempRowId));
        saveFailed("log the cancellation", error);
        return false;
      }
      setCancellations((prev) => swapTemp(prev, tempId, mapCancellation(data)));

      // Refresh the denormalized view row with its real id, keeping the
      // optimistic date/school/class fields (the view join is identical).
      supabase
        .from("cancellation_rows")
        .select("*")
        .eq("id", data.id)
        .single()
        .then(({ data: rowData }) => {
          if (rowData) {
            setCancellationRows((prev) => swapTemp(prev, tempRowId, mapCancellationRow(rowData)));
          }
        });

      if (rescheduledDate) {
        supabase
          .from("sessions")
          .upsert(
            {
              class_id: sess.classId,
              coach_id: sess.coachId,
              date: rescheduledDate,
              start_time: sess.startTime,
              status: "Pending",
              curriculum_week: sess.curriculumWeek,
            },
            { onConflict: "class_id,date,start_time", ignoreDuplicates: true }
          )
          .select("*")
          .then(({ data: made, error: makeupError }) => {
            if (makeupError) {
              console.error("Couldn't add the makeup session:", makeupError);
              toast("Cancellation logged, but the makeup session couldn't be added. Add it from the Timetable.");
              return;
            }
            if (made?.length) {
              setSessions((prev) => made.reduce((list, row) => upsertById(list, mapSession(row)), prev));
              toast(`Makeup session added for ${rescheduledDate}`);
            }
          });
      }
      return true;
    },
    [sessions, classes, supabase, toast, saveFailed]
  );

  const addAssessment = useCallback(
    (a: Omit<Assessment, "id">) =>
      saveInsert(
        "save the assessment",
        setAssessments,
        { ...a, id: nid("as") },
        () =>
          supabase
            .from("assessments")
            .insert({
              student_name: a.studentName,
              class_id: a.classId,
              term: a.term,
              ratings: a.ratings,
              date: a.date,
            })
            .select("*")
            .single(),
        mapAssessment
      ),
    [supabase, saveInsert]
  );

  const updateAssessment = useCallback(
    (id: string, ratings: Record<SkillKey, number>) =>
      saveUpdate("update the report card", setAssessments, assessments.find((a) => a.id === id), { ratings }, () =>
        supabase.from("assessments").update({ ratings }).eq("id", id).select("id")
      ),
    [assessments, supabase, saveUpdate]
  );

  const addEquipment = useCallback(
    (e: Omit<Equipment, "id">) =>
      saveInsert(
        "add the equipment",
        setEquipment,
        { ...e, id: nid("eq") },
        () =>
          supabase
            .from("equipment")
            .insert({
              item_name: e.itemName,
              qty: e.qty,
              school_id: e.schoolId,
              condition: e.condition,
              date_issued: e.dateIssued,
              status: e.status,
            })
            .select("*")
            .single(),
        mapEquipment
      ),
    [supabase, saveInsert]
  );

  const updateEquipmentStatus = useCallback(
    (id: string, condition: Equipment["condition"], status: Equipment["status"]) =>
      saveUpdate("update the equipment", setEquipment, equipment.find((e) => e.id === id), { condition, status }, () =>
        supabase.from("equipment").update({ condition, status }).eq("id", id).select("id")
      ),
    [equipment, supabase, saveUpdate]
  );

  const addCoach = useCallback(
    (c: Omit<Coach, "id">) =>
      saveInsert(
        "add the coach",
        setCoaches,
        { ...c, id: nid("co") },
        () =>
          supabase
            .from("coaches")
            .insert({
              name: c.name,
              phone: c.phone,
              assigned_school_id: c.assignedSchoolId,
              status: c.status,
              rating: c.rating,
            })
            .select("*")
            .single(),
        mapCoach
      ),
    [supabase, saveInsert]
  );

  const setCoachRating = useCallback(
    (id: string, rating: number) =>
      saveUpdate("save the rating", setCoaches, coaches.find((c) => c.id === id), { rating }, () =>
        supabase.from("coaches").update({ rating }).eq("id", id).select("id")
      ),
    [coaches, supabase, saveUpdate]
  );

  const addSlot = useCallback(
    async (classId: string, weekday: number, startTime: string) => {
      const { data, error } = await supabase
        .from("class_schedule")
        .insert({ class_id: classId, weekday, start_time: startTime })
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") toast("That class already has a slot at that time.");
        else saveFailed("save the slot", error);
        return false;
      }
      setSchedule((prev) => upsertById(prev, mapClassSlot(data)));
      return true;
    },
    [supabase, toast, saveFailed]
  );

  const removeSlot = useCallback(
    async (id: string) => {
      const removed = schedule.find((slot) => slot.id === id);
      if (!removed) return;
      setSchedule((prev) => prev.filter((slot) => slot.id !== id));
      const { data, error } = await supabase.from("class_schedule").delete().eq("id", id).select("id");
      if (!error && data.length) return;
      setSchedule((prev) => upsertById(prev, removed));
      saveFailed("remove the slot", error);
    },
    [schedule, supabase, saveFailed]
  );

  // A Pending session for every timetable slot between two dates. Sessions that
  // already exist are skipped (unique class/date/time), so rerunning is safe.
  const createSessions = useCallback(
    async (from: string, to: string) => {
      const rows: Tables["sessions"]["Insert"][] = [];
      for (let date = from; date <= to; date = addDays(date, 1)) {
        const weekday = isoWeekday(date);
        for (const slot of schedule) {
          if (slot.weekday !== weekday) continue;
          const cls = classes.find((c) => c.id === slot.classId);
          if (!cls) continue;
          rows.push({
            class_id: cls.id,
            coach_id: cls.coachId,
            date,
            start_time: slot.startTime,
            status: "Pending",
            curriculum_week: curriculum.find((c) => c.classId === cls.id)?.currentWeek ?? 1,
          });
        }
      }
      let created = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const { data, error } = await supabase
          .from("sessions")
          .upsert(rows.slice(i, i + 500), { onConflict: "class_id,date,start_time", ignoreDuplicates: true })
          .select("*");
        if (error) {
          // Earlier batches may have saved; running it again skips those.
          saveFailed("create all the sessions", error);
          return null;
        }
        created += data.length;
        setSessions((prev) => data.reduce((list, row) => upsertById(list, mapSession(row)), prev));
      }
      return { created, skipped: rows.length - created };
    },
    [schedule, classes, curriculum, supabase, saveFailed]
  );

  const addSession = useCallback(
    async (classId: string, date: string, startTime: string | null) => {
      const cls = classes.find((c) => c.id === classId);
      if (!cls) return false;
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          class_id: cls.id,
          coach_id: cls.coachId,
          date,
          start_time: startTime,
          status: "Pending",
          curriculum_week: curriculum.find((c) => c.classId === cls.id)?.currentWeek ?? 1,
        })
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") toast("That class already has a session at that date and time.");
        else saveFailed("add the session", error);
        return false;
      }
      setSessions((prev) => upsertById(prev, mapSession(data)));
      return true;
    },
    [classes, curriculum, supabase, toast, saveFailed]
  );

  const value = useMemo<StoreShape>(
    () => ({
      role,
      actualRole,
      setRole,
      active,
      setActive,
      // A real coach login uses their own coach_id. An admin previewing the
      // coach screen has none, so preview as the first real coach record.
      currentCoachId: actualCoachId || coaches[0]?.id || "",
      currentSchoolId,
      setCurrentSchoolId,
      userEmail,
      signOut,
      schools,
      coaches,
      classes,
      sessions,
      cancellations,
      cancellationRows,
      assessments,
      equipment,
      attendance,
      curriculum,
      fitnessAssessments,
      status,
      live,
      toggleAttendance,
      setSessionStatus,
      setCurriculumWeek,
      logCancellation,
      addAssessment,
      updateAssessment,
      addEquipment,
      updateEquipmentStatus,
      addCoach,
      setCoachRating,
      schedule,
      addSlot,
      removeSlot,
      createSessions,
      addSession,
      schoolName,
      coachName,
      classById,
      classLabel,
      toasts,
      toast,
      dismissToast,
    }),
    [
      role,
      actualRole,
      setRole,
      active,
      actualCoachId,
      currentSchoolId,
      userEmail,
      signOut,
      schools,
      coaches,
      classes,
      sessions,
      cancellations,
      cancellationRows,
      assessments,
      equipment,
      attendance,
      curriculum,
      fitnessAssessments,
      status,
      live,
      toggleAttendance,
      setSessionStatus,
      setCurriculumWeek,
      logCancellation,
      addAssessment,
      updateAssessment,
      addEquipment,
      updateEquipmentStatus,
      addCoach,
      setCoachRating,
      schedule,
      addSlot,
      removeSlot,
      createSessions,
      addSession,
      schoolName,
      coachName,
      classById,
      classLabel,
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
