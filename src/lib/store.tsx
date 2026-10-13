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
import * as seed from "./seed";
import type { ModuleKey } from "./nav";
import { createClient } from "./supabase/client";
import {
  mapAssessment,
  mapCancellation,
  mapCancellationRow,
  mapClass,
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
  loading: boolean;

  // actions
  toggleAttendance: (coachId: string) => void;
  setSessionStatus: (sessionId: string, status: SessionStatus) => void;
  setCurriculumWeek: (sessionId: string, week: number) => void;
  logCancellation: (
    sessionId: string,
    cancelledBy: CancelledBy,
    reason: string,
    rescheduledDate: string | null
  ) => void;
  addAssessment: (a: Omit<Assessment, "id">) => void;
  updateAssessment: (id: string, ratings: Record<SkillKey, number>) => void;
  addEquipment: (e: Omit<Equipment, "id">) => void;
  updateEquipmentStatus: (
    id: string,
    condition: Equipment["condition"],
    status: Equipment["status"]
  ) => void;
  addCoach: (c: Omit<Coach, "id">) => void;
  setCoachRating: (id: string, rating: number) => void;

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

  const signOut = useCallback(() => {
    supabase.auth.signOut();
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
  const [loading, setLoading] = useState(true);

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
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      setUserEmail(user.email ?? null);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      if (error) {
        console.error("Failed to load profile:", error);
        return;
      }

      setActualRole(profile.role);
      setActualCoachId(profile.coach_id ?? "");
      setActualSchoolId(profile.school_id ?? "");
      if (profile.school_id) setCurrentSchoolId(profile.school_id);
    }

    loadProfile();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
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
      setLoading(true);
      const [
        schoolsRes,
        coachesRes,
        classesRes,
        assessmentsRes,
        fitnessRes,
        sessionsRes,
        cancellationsRes,
        cancellationRowsRes,
        equipmentRes,
        attendanceRes,
        curriculumRes,
      ] = await Promise.all([
        supabase.from("schools").select("*"),
        supabase.from("coaches").select("*"),
        supabase.from("classes").select("*"),
        supabase.from("assessments").select("*"),
        supabase.from("fitness_assessments").select("*"),
        supabase.from("sessions").select("*"),
        supabase.from("cancellations").select("*"),
        supabase.from("cancellation_rows").select("*"),
        supabase.from("equipment").select("*"),
        supabase.from("coach_attendance").select("*"),
        supabase.from("curriculum").select("*"),
      ]);

      if (cancelled) return;

      if (schoolsRes.error) throw schoolsRes.error;
      if (coachesRes.error) throw coachesRes.error;
      if (classesRes.error) throw classesRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;
      if (fitnessRes.error) throw fitnessRes.error;
      if (sessionsRes.error) throw sessionsRes.error;
      if (cancellationsRes.error) throw cancellationsRes.error;
      if (cancellationRowsRes.error) throw cancellationRowsRes.error;
      if (equipmentRes.error) throw equipmentRes.error;
      if (attendanceRes.error) throw attendanceRes.error;
      if (curriculumRes.error) throw curriculumRes.error;

      const mappedSchools = schoolsRes.data.map(mapSchool);
      setSchools(mappedSchools);
      setCoaches(coachesRes.data.map(mapCoach));
      setClasses(classesRes.data.map(mapClass));
      setAssessments(assessmentsRes.data.map(mapAssessment));
      setFitnessAssessments(fitnessRes.data.map(mapFitnessAssessment));
      setSessions(sessionsRes.data.map(mapSession));
      setCancellations(cancellationsRes.data.map(mapCancellation));
      setCancellationRows(cancellationRowsRes.data.map(mapCancellationRow));
      setEquipment(equipmentRes.data.map(mapEquipment));
      setAttendance(attendanceRes.data.map(mapCoachAttendance));
      setCurriculum(curriculumRes.data.map(mapCurriculum));
      setCurrentSchoolId((prev) => prev || mappedSchools[0]?.id || "");
      setLoading(false);
    }

    load().catch((err) => {
      if (!cancelled) {
        console.error("Failed to load data from Supabase:", err);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
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

  const toggleAttendance = useCallback(
    (coachId: string) => {
      const existing = attendance.find(
        (a) => a.coachId === coachId && a.date === seed.TODAY
      );
      if (existing) {
        const nextPresent = !existing.present;
        setAttendance((prev) =>
          prev.map((a) => (a.id === existing.id ? { ...a, present: nextPresent } : a))
        );
        supabase
          .from("coach_attendance")
          .update({ present: nextPresent })
          .eq("id", existing.id)
          .then(({ error }) => {
            if (error) console.error("Failed to update attendance:", error);
          });
        return;
      }
      const tempId = nid("at");
      setAttendance((prev) => [...prev, { id: tempId, coachId, date: seed.TODAY, present: true }]);
      supabase
        .from("coach_attendance")
        .insert({ coach_id: coachId, date: seed.TODAY, present: true })
        .select("*")
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to save attendance:", error);
            setAttendance((prev) => prev.filter((a) => a.id !== tempId));
            return;
          }
          setAttendance((prev) =>
            prev.map((a) => (a.id === tempId ? mapCoachAttendance(data) : a))
          );
        });
    },
    [attendance, supabase]
  );

  const setSessionStatus = useCallback(
    (sessionId: string, status: SessionStatus) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status } : s))
      );
      supabase
        .from("sessions")
        .update({ status })
        .eq("id", sessionId)
        .then(({ error }) => {
          if (error) console.error("Failed to update session status:", error);
        });
    },
    [supabase]
  );

  const setCurriculumWeek = useCallback(
    (sessionId: string, week: number) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, curriculumWeek: week } : s
        )
      );
      supabase
        .from("sessions")
        .update({ curriculum_week: week })
        .eq("id", sessionId)
        .then(({ error }) => {
          if (error) console.error("Failed to update curriculum week:", error);
        });
    },
    [supabase]
  );

  const logCancellation = useCallback(
    (
      sessionId: string,
      cancelledBy: CancelledBy,
      reason: string,
      rescheduledDate: string | null
    ) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, status: "Cancelled" as const } : s
        )
      );
      supabase
        .from("sessions")
        .update({ status: "Cancelled" })
        .eq("id", sessionId)
        .then(({ error }) => {
          if (error) console.error("Failed to cancel session:", error);
        });

      const tempId = nid("ca");
      setCancellations((prev) => [
        ...prev,
        { id: tempId, sessionId, cancelledBy, reason, rescheduledDate },
      ]);
      const sess = sessions.find((s) => s.id === sessionId);
      const cls = sess ? classes.find((c) => c.id === sess.classId) : undefined;
      const tempRowId = nid("car");
      setCancellationRows((prev) => [
        {
          id: tempRowId,
          date: seed.TODAY,
          schoolId: cls?.schoolId ?? "",
          className: cls?.className ?? "—",
          cancelledBy,
          reason,
          rescheduledDate,
        },
        ...prev,
      ]);

      supabase
        .from("cancellations")
        .insert({ session_id: sessionId, cancelled_by: cancelledBy, reason, rescheduled_date: rescheduledDate })
        .select("*")
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to log cancellation:", error);
            setCancellations((prev) => prev.filter((c) => c.id !== tempId));
            setCancellationRows((prev) => prev.filter((r) => r.id !== tempRowId));
            return;
          }
          setCancellations((prev) =>
            prev.map((c) => (c.id === tempId ? mapCancellation(data) : c))
          );
          // Refresh the denormalized view row with its real id, keeping the
          // optimistic date/school/class fields (the view join is identical).
          supabase
            .from("cancellation_rows")
            .select("*")
            .eq("id", data.id)
            .single()
            .then(({ data: rowData }) => {
              if (rowData) {
                setCancellationRows((prev) =>
                  prev.map((r) => (r.id === tempRowId ? mapCancellationRow(rowData) : r))
                );
              }
            });
        });
    },
    [sessions, classes, supabase]
  );

  const addAssessment = useCallback(
    (a: Omit<Assessment, "id">) => {
      const tempId = nid("as");
      setAssessments((prev) => [...prev, { ...a, id: tempId }]);
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
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to save assessment:", error);
            setAssessments((prev) => prev.filter((x) => x.id !== tempId));
            return;
          }
          setAssessments((prev) =>
            prev.map((x) => (x.id === tempId ? mapAssessment(data) : x))
          );
        });
    },
    [supabase]
  );

  const updateAssessment = useCallback(
    (id: string, ratings: Record<SkillKey, number>) => {
      setAssessments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ratings } : a))
      );
      supabase
        .from("assessments")
        .update({ ratings })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Failed to update assessment:", error);
        });
    },
    [supabase]
  );

  const addEquipment = useCallback(
    (e: Omit<Equipment, "id">) => {
      const tempId = nid("eq");
      setEquipment((prev) => [...prev, { ...e, id: tempId }]);
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
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to save equipment:", error);
            setEquipment((prev) => prev.filter((x) => x.id !== tempId));
            return;
          }
          setEquipment((prev) =>
            prev.map((x) => (x.id === tempId ? mapEquipment(data) : x))
          );
        });
    },
    [supabase]
  );

  const updateEquipmentStatus = useCallback(
    (
      id: string,
      condition: Equipment["condition"],
      status: Equipment["status"]
    ) => {
      setEquipment((prev) =>
        prev.map((e) => (e.id === id ? { ...e, condition, status } : e))
      );
      supabase
        .from("equipment")
        .update({ condition, status })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Failed to update equipment:", error);
        });
    },
    [supabase]
  );

  const addCoach = useCallback(
    (c: Omit<Coach, "id">) => {
      const tempId = nid("co");
      setCoaches((prev) => [...prev, { ...c, id: tempId }]);
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
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to save coach:", error);
            setCoaches((prev) => prev.filter((x) => x.id !== tempId));
            return;
          }
          setCoaches((prev) =>
            prev.map((x) => (x.id === tempId ? mapCoach(data) : x))
          );
        });
    },
    [supabase]
  );

  const setCoachRating = useCallback(
    (id: string, rating: number) => {
      setCoaches((prev) =>
        prev.map((c) => (c.id === id ? { ...c, rating } : c))
      );
      supabase
        .from("coaches")
        .update({ rating })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Failed to update coach rating:", error);
        });
    },
    [supabase]
  );

  const value = useMemo<StoreShape>(
    () => ({
      role,
      actualRole,
      setRole,
      active,
      setActive,
      currentCoachId: actualCoachId || seed.CURRENT_COACH_ID,
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
      loading,
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
      loading,
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
