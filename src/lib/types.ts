// KLUTCH SportsEd — domain types for the JGS PET programme (see programme.ts).

export type Role = "admin" | "coach" | "school";

export type CoachStatus = "Active" | "Inactive";
export interface Coach {
  id: string;
  name: string;
  phone: string;
  assignedSchoolId: string;
  status: CoachStatus;
}

export interface School {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
}

export type Sport = "Football" | "Basketball" | "Volleyball";

export const SPORTS: Sport[] = ["Football", "Basketball", "Volleyball"];

// Categorical brand hue per sport (paired with icon + label everywhere).
// Theme-aware: resolves to the brighter on-dark variant in dark mode.
export const SPORT_COLOR: Record<Sport, string> = {
  Football: "rgb(var(--hue-blue))",
  Basketball: "rgb(var(--hue-orange))",
  Volleyball: "rgb(var(--hue-lime))",
};

export const SPORT_ICON: Record<Sport, "football" | "basketball" | "volleyball"> = {
  Football: "football",
  Basketball: "basketball",
  Volleyball: "volleyball",
};

// One weekly PET slot from the school's timetable. The coach assigned here is
// copied onto that slot's sessions that haven't been reported yet.
export interface TimetableSlot {
  id: string;
  schoolId: string;
  weekday: number; // 1 = Monday … 6 = Saturday
  period: number;
  startTime: string; // "14:10"
  endTime: string;
  groupLabel: string; // "10J/10L"
  grade: number | null; // null for a mixed group such as 9C/8A
  coachId: string | null;
}

export type SessionStatus = "Not reported" | "Done" | "Not Done" | "Cancelled" | "Postponed";

export interface Session {
  id: string;
  code: string; // "JGS-20261102-P8-8D", stable for the life of the session
  schoolId: string;
  slotId: string | null;
  date: string;
  period: number;
  startTime: string;
  endTime: string;
  groupLabel: string;
  grade: number | null;
  teachingWeek: number;
  block: number;
  weekInBlock: number;
  sport: Sport | null;
  curriculumCode: string | null;
  lesson: string | null;
  coachId: string | null;
  status: SessionStatus;
  reason: string | null;
  actualDate: string | null; // when it really happened, if not on the scheduled date
  remarks: string | null; // internal to KLUTCH; never shown to the school
  reportedAt: string | null;
}

export interface CoachAttendance {
  id: string;
  coachId: string;
  date: string;
  present: boolean;
}
