// Maps snake_case Supabase rows to the camelCase app types in src/lib/types.ts.
// Components only ever see the app shapes, never raw database rows.

import type { Coach, CoachAttendance, School, Session, Sport, TimetableSlot } from "../types";
import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
type SchoolRow = Tables["schools"]["Row"];
type CoachRow = Tables["coaches"]["Row"];
type CoachAttendanceRow = Tables["coach_attendance"]["Row"];
type SlotRow = Tables["timetable_slots"]["Row"];
type SessionRow = Tables["pet_sessions"]["Row"];

// Postgres returns "14:10:00"; the app works in "14:10".
const hhmm = (time: string) => time.slice(0, 5);

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
  };
}

export function mapCoachAttendance(row: CoachAttendanceRow): CoachAttendance {
  return {
    id: row.id,
    coachId: row.coach_id,
    date: row.date,
    present: row.present,
  };
}

export function mapSlot(row: SlotRow): TimetableSlot {
  return {
    id: row.id,
    schoolId: row.school_id,
    weekday: row.weekday,
    period: row.period,
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
    groupLabel: row.group_label,
    grade: row.grade,
    coachId: row.coach_id,
  };
}

export function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    code: row.code,
    schoolId: row.school_id,
    slotId: row.slot_id,
    date: row.date,
    period: row.period,
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
    groupLabel: row.group_label,
    grade: row.grade,
    teachingWeek: row.teaching_week,
    block: row.block,
    weekInBlock: row.week_in_block,
    // The enum still lists the demo's Tennis; JGS sessions never use it.
    sport: row.sport as Sport | null,
    curriculumCode: row.curriculum_code,
    lesson: row.lesson,
    coachId: row.coach_id,
    status: row.status,
    reason: row.reason,
    actualDate: row.actual_date,
    remarks: row.remarks,
    reportedAt: row.reported_at,
  };
}
