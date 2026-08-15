"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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
import { fitnessAssessments as seededFitnessAssessments } from "./fitnessSeed";
import type { ModuleKey } from "./nav";

// ---- lightweight id generator (deterministic-ish, no Date.now needed) ----
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
  const [role, setRole] = useState<Role>("admin");
  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [currentSchoolId, setCurrentSchoolId] = useState<string>("sch_abc");

  const [coaches, setCoaches] = useState<Coach[]>(seed.coaches);
  const [sessions, setSessions] = useState<Session[]>(seed.sessions);
  const [cancellations, setCancellations] = useState<Cancellation[]>(
    seed.cancellations
  );
  const [cancellationRows, setCancellationRows] = useState(
    seed.cancellationRows.map((r) => ({ ...r }))
  );
  const [assessments, setAssessments] = useState<Assessment[]>(seed.assessments);
  const [equipment, setEquipment] = useState<Equipment[]>(seed.equipment);
  const [attendance, setAttendance] = useState<CoachAttendance[]>(
    seed.coachAttendance
  );
  const [curriculum, setCurriculum] = useState<CurriculumWeek[]>(
    seed.curriculum
  );

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [toastSeq, setToastSeq] = useState(1);

  const toast = useCallback(
    (text: string) => {
      setToastSeq((s) => {
        const id = s;
        setToasts((t) => [...t, { id, text }]);
        // auto-dismiss handled in UI via effect; keep store simple
        return s + 1;
      });
    },
    []
  );
  const dismissToast = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  const schoolName = useCallback(
    (id: string) => seed.schools.find((s) => s.id === id)?.name ?? "—",
    []
  );
  const coachName = useCallback(
    (id: string) => coaches.find((c) => c.id === id)?.name ?? "—",
    [coaches]
  );
  const classById = useCallback(
    (id: string) => seed.classes.find((c) => c.id === id),
    []
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
      const cls = sess ? seed.classes.find((c) => c.id === sess.classId) : undefined;
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
    [sessions]
  );

  const addAssessment = useCallback((a: Omit<Assessment, "id">) => {
    setAssessments((prev) => [...prev, { ...a, id: nid("as") }]);
  }, []);

  const updateAssessment = useCallback(
    (id: string, ratings: Record<SkillKey, number>) => {
      setAssessments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ratings } : a))
      );
    },
    []
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

  const addCoach = useCallback((c: Omit<Coach, "id">) => {
    setCoaches((prev) => [...prev, { ...c, id: nid("co") }]);
  }, []);

  const setCoachRating = useCallback((id: string, rating: number) => {
    setCoaches((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rating } : c))
    );
  }, []);

  const value = useMemo<StoreShape>(
    () => ({
      role,
      setRole,
      active,
      setActive,
      currentCoachId: seed.CURRENT_COACH_ID,
      currentSchoolId,
      setCurrentSchoolId,
      schools: seed.schools,
      coaches,
      classes: seed.classes,
      sessions,
      cancellations,
      cancellationRows,
      assessments,
      equipment,
      attendance,
      curriculum,
      fitnessAssessments: seededFitnessAssessments,
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
      coaches,
      sessions,
      cancellations,
      cancellationRows,
      assessments,
      equipment,
      attendance,
      curriculum,
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
