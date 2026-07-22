// KLUTCH SportsEd — domain types (mirror the 8 DB tables in the brief)

export type Role = "admin" | "coach" | "school";

export type CoachStatus = "Active" | "Inactive";
export interface Coach {
  id: string;
  name: string;
  phone: string;
  assignedSchoolId: string;
  status: CoachStatus;
  rating: number; // 1-5 performance
}

export interface School {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
}

export type Sport = "Football" | "Basketball" | "Tennis";

export const SPORTS: Sport[] = ["Football", "Basketball", "Tennis"];

// Categorical brand color per sport (paired with icon + label everywhere).
export const SPORT_COLOR: Record<Sport, string> = {
  Football: "#2244db",
  Basketball: "#f26b1d",
  Tennis: "#a6ce2e",
};

export const SPORT_ICON: Record<Sport, "football" | "basketball" | "tennis"> = {
  Football: "football",
  Basketball: "basketball",
  Tennis: "tennis",
};

export interface ClassRoom {
  id: string;
  schoolId: string;
  className: string; // e.g. "Class 5A"
  section: string;
  coachId: string;
  sport: Sport;
}

export type SessionStatus = "Done" | "Pending" | "Cancelled";
export interface Session {
  id: string;
  classId: string;
  date: string; // ISO date
  status: SessionStatus;
  curriculumWeek: number;
  coachId: string;
}

export type CancelledBy = "School" | "KLUTCH";
export interface Cancellation {
  id: string;
  sessionId: string;
  cancelledBy: CancelledBy;
  reason: string;
  rescheduledDate: string | null;
}

// Denormalized row used by the Cancellation Log table
export interface CancellationRow {
  id: string;
  date: string;
  schoolId: string;
  className: string;
  cancelledBy: CancelledBy;
  reason: string;
  rescheduledDate: string | null;
}

export type SkillKey = "motorSkills" | "coordination" | "fitness" | "attitude";
export interface Assessment {
  id: string;
  studentName: string;
  classId: string;
  term: string;
  ratings: Record<SkillKey, number>; // 1-5 each
  date: string;
}

export type EquipmentCondition = "Good" | "Fair" | "Damaged";
export type EquipmentStatus = "Active" | "Replace";
export interface Equipment {
  id: string;
  itemName: string;
  qty: number;
  schoolId: string;
  condition: EquipmentCondition;
  dateIssued: string;
  status: EquipmentStatus;
}

export interface CoachAttendance {
  id: string;
  coachId: string;
  date: string;
  present: boolean;
}

export interface CurriculumWeek {
  classId: string;
  currentWeek: number;
  totalWeeks: number;
  lastDelivered: string;
}

export const SKILL_LABELS: Record<SkillKey, string> = {
  motorSkills: "Motor Skills",
  coordination: "Coordination",
  fitness: "Fitness",
  attitude: "Attitude",
};

export const CANCEL_REASONS = [
  "School event",
  "Exam prep",
  "Coach sick",
  "Weather",
  "Holiday",
  "Ground unavailable",
];
