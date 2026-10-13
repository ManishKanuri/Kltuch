// Maps snake_case Supabase rows <-> the camelCase app types in src/lib/types.ts.
// Keeping this mapping in one place is what let Phase 3 swap store.tsx's
// internals without touching any UI component — components only ever see
// the App* shapes below, never raw DB rows.

import type { Assessment, Coach, ClassRoom, FitnessAssessment, School } from "../types";
import type { Database } from "./database.types";

type SchoolRow = Database["public"]["Tables"]["schools"]["Row"];
type CoachRow = Database["public"]["Tables"]["coaches"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type AssessmentRow = Database["public"]["Tables"]["assessments"]["Row"];
type FitnessAssessmentRow = Database["public"]["Tables"]["fitness_assessments"]["Row"];

export function mapSchool(row: SchoolRow): School {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    contactPerson: row.contact_person,
  };
}

export function mapCoach(row: CoachRow): Coach {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    assignedSchoolId: row.assigned_school_id,
    status: row.status,
    rating: Number(row.rating),
  };
}

export function mapClass(row: ClassRow): ClassRoom {
  return {
    id: row.id,
    schoolId: row.school_id,
    className: row.class_name,
    section: row.section,
    coachId: row.coach_id,
    sport: row.sport,
  };
}

export function mapAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    studentName: row.student_name,
    classId: row.class_id,
    term: row.term,
    ratings: row.ratings as Assessment["ratings"],
    date: row.date,
  };
}

export function mapFitnessAssessment(row: FitnessAssessmentRow): FitnessAssessment {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    schoolId: row.school_id,
    age: row.age,
    grade: row.grade,
    section: row.section,
    className: row.class_name,
    gender: row.gender,
    date: row.date,
    speed50mSeconds: Number(row.speed_50m_seconds),
    stamina600mSeconds: Number(row.stamina_600m_seconds),
    toeTouchCm: Number(row.toe_touch_cm),
    pushUps: row.push_ups,
    curls: row.curls,
    heightCm: Number(row.height_cm),
    weightKg: Number(row.weight_kg),
    bmi: Number(row.bmi),
    attendanceRate: Number(row.attendance_rate),
    sessionsScheduled: row.sessions_scheduled,
    sessionsFinished: row.sessions_finished,
    sessionsMissed: row.sessions_missed,
  };
}
