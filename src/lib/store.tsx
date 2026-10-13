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
  mapClass,
  mapCoach,
  mapFitnessAssessment,
  mapSchool,
} from "./supabase/mappers";

// ---- lightweight id generator for the tables still on mock data ----
// (sessions, cancellations, equipment, attendance, curriculum — out of pilot
// scope; see docs/PRODUCTION_BLUEPRINT.md §9. Live on Supabase: schools,
// coaches, classes, assessments, fitness_assessments.)
let _idc = 1000;
const nid = (p: string) => `${p}_${++_idc}`;

export interface ToastMsg {
  id: number;
  text: string;
}

interface StoreShape {
  // identity + navigation
  role: Role;
  setRole: (r: Role) => void;
  active: ModuleKey;
  setActive: (m: ModuleKey) => void;
  currentCoachId: string;
  currentSchoolId: string;
  setCurrentSchoolId: (id: string) => void;

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

  const [role, setRole] = useState<Role>("admin");
  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [currentSchoolId, setCurrentSchoolId] = useState<string>("");

  // ---- Supabase-backed state (pilot scope) ----
  const [schools, setSchools] = useState<School[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [fitnessAssessments, setFitnessAssessments] = useState<FitnessAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- still mock data: out of pilot scope (no table yet) ----
  const [sessions, setSessions] = useState<Session[]>(seed.sessions);
  const [cancellations, setCancellations] = useState<Cancellation[]>(
    seed.cancellations
  );
  const [cancellationRows, setCancellationRows] = useState(
    seed.cancellationRows.map((r) => ({ ...r }))
  );
  const [equipment, setEquipment] = useState<Equipment[]>(seed.equipment);
  const [attendance, setAttendance] = useState<CoachAttendance[]>(
    seed.coachAttendance
  );
  const [curriculum, setCurriculum] = useState<CurriculumWeek[]>(
    seed.curriculum
  );

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
      ] = await Promise.all([
        supabase.from("schools").select("*"),
        supabase.from("coaches").select("*"),
        supabase.from("classes").select("*"),
        supabase.from("assessments").select("*"),
        supabase.from("fitness_assessments").select("*"),
      ]);

      if (cancelled) return;

      if (schoolsRes.error) throw schoolsRes.error;
      if (coachesRes.error) throw coachesRes.error;
      if (classesRes.error) throw classesRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;
      if (fitnessRes.error) throw fitnessRes.error;

      const mappedSchools = schoolsRes.data.map(mapSchool);
      setSchools(mappedSchools);
      setCoaches(coachesRes.data.map(mapCoach));
      setClasses(classesRes.data.map(mapClass));
      setAssessments(assessmentsRes.data.map(mapAssessment));
      setFitnessAssessments(fitnessRes.data.map(mapFitnessAssessment));
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

  const toggleAttendance = useCallback((coachId: string) => {
    setAttendance((prev) => {
      const existing = prev.find(
        (a) => a.coachId === coachId && a.date === seed.TODAY
      );
      if (existing) {
        return prev.map((a) =>
          a.id === existing.id ? { ...a, present: !a.present } : a
        );
      }
      return [
        ...prev,
        { id: nid("at"), coachId, date: seed.TODAY, present: true },
      ];
    });
  }, []);

  const setSessionStatus = useCallback(
    (sessionId: string, status: SessionStatus) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status } : s))
      );
    },
    []
  );

  const setCurriculumWeek = useCallback(
    (sessionId: string, week: number) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, curriculumWeek: week } : s
        )
      );
    },
    []
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
      setCancellations((prev) => [
        ...prev,
        { id: nid("ca"), sessionId, cancelledBy, reason, rescheduledDate },
      ]);
      const sess = sessions.find((s) => s.id === sessionId);
      const cls = sess ? classes.find((c) => c.id === sess.classId) : undefined;
      setCancellationRows((prev) => [
        {
          id: nid("car"),
          date: seed.TODAY,
          schoolId: cls?.schoolId ?? "",
          className: cls?.className ?? "—",
          cancelledBy,
          reason,
          rescheduledDate,
        },
        ...prev,
      ]);
    },
    [sessions, classes]
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

  const addEquipment = useCallback((e: Omit<Equipment, "id">) => {
    setEquipment((prev) => [...prev, { ...e, id: nid("eq") }]);
  }, []);

  const updateEquipmentStatus = useCallback(
    (
      id: string,
      condition: Equipment["condition"],
      status: Equipment["status"]
    ) => {
      setEquipment((prev) =>
        prev.map((e) => (e.id === id ? { ...e, condition, status } : e))
      );
    },
    []
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
      setRole,
      active,
      setActive,
      currentCoachId: seed.CURRENT_COACH_ID,
      currentSchoolId,
      setCurrentSchoolId,
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
      active,
      currentSchoolId,
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
