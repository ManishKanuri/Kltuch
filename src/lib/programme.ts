// The Johnson Grammar School PET programme for Classes 8–12, as supplied by
// KLUTCH: the master PET timetable, the 24-week sports rotation (four blocks
// of six weeks from Monday 2 November 2026) and the six-week curriculum.
// Sessions store the plan they were created with, so changing anything here
// only affects sessions added afterwards.

import type { SessionStatus, Sport } from "./types";

export const PROGRAMME = {
  code: "JGS",
  schoolName: "Johnson Grammar School, Mallapur",
  startDate: "2026-11-02", // Monday of teaching week 1
  weeksPerBlock: 6,
  totalWeeks: 24,
  endDate: "2027-04-17", // Saturday of teaching week 24
  // The working period in the supplied session tracker. Later weeks are added
  // from the Timetable screen once the school confirms its calendar.
  firstLoadEnd: "2026-12-30",
} as const;

export const PERIODS: Record<number, { start: string; end: string }> = {
  1: { start: "09:25", end: "10:05" },
  2: { start: "10:05", end: "10:45" },
  3: { start: "10:55", end: "11:35" },
  4: { start: "11:35", end: "12:15" },
  5: { start: "12:15", end: "12:55" },
  6: { start: "13:30", end: "14:10" },
  7: { start: "14:10", end: "14:50" },
  8: { start: "15:00", end: "15:50" },
};

// From the MASTER PET TIMETABLE PDF (Mon = 1 … Sat = 6). A slash pair such as
// 10J/10L is one session; groups stacked in the same period are separate sessions.
export const TIMETABLE: { weekday: number; period: number; group: string }[] = [
  { weekday: 1, period: 2, group: "9I" },
  { weekday: 1, period: 3, group: "9B" },
  { weekday: 1, period: 4, group: "10J/10L" },
  { weekday: 1, period: 5, group: "12B" },
  { weekday: 1, period: 6, group: "12C" },
  { weekday: 1, period: 7, group: "11B" },
  { weekday: 1, period: 7, group: "10F" },
  { weekday: 1, period: 8, group: "8D" },
  { weekday: 2, period: 3, group: "9F" },
  { weekday: 2, period: 5, group: "12A" },
  { weekday: 2, period: 7, group: "11A" },
  { weekday: 2, period: 7, group: "10J" },
  { weekday: 2, period: 8, group: "9C/8A" },
  { weekday: 3, period: 1, group: "10K" },
  { weekday: 3, period: 3, group: "8F" },
  { weekday: 3, period: 4, group: "10L" },
  { weekday: 3, period: 5, group: "12G" },
  { weekday: 3, period: 5, group: "8E" },
  { weekday: 3, period: 6, group: "12E" },
  { weekday: 3, period: 7, group: "11G" },
  { weekday: 3, period: 7, group: "10D" },
  { weekday: 3, period: 8, group: "8B/8G" },
  { weekday: 4, period: 2, group: "10H" },
  { weekday: 4, period: 3, group: "8C" },
  { weekday: 4, period: 4, group: "9J" },
  { weekday: 4, period: 5, group: "11C" },
  { weekday: 4, period: 6, group: "11F" },
  { weekday: 4, period: 7, group: "11E" },
  { weekday: 4, period: 7, group: "10I" },
  { weekday: 4, period: 8, group: "9H/8I" },
  { weekday: 5, period: 2, group: "10E" },
  { weekday: 5, period: 3, group: "10B" },
  { weekday: 5, period: 4, group: "9A" },
  { weekday: 5, period: 5, group: "11D" },
  { weekday: 5, period: 5, group: "9E" },
  { weekday: 5, period: 5, group: "10J/10L" },
  { weekday: 5, period: 6, group: "12F" },
  { weekday: 5, period: 8, group: "9G" },
  { weekday: 6, period: 1, group: "10C" },
  { weekday: 6, period: 2, group: "10A" },
  { weekday: 6, period: 3, group: "8J/8H" },
  { weekday: 6, period: 4, group: "10G" },
  { weekday: 6, period: 5, group: "12D" },
  { weekday: 6, period: 5, group: "9D" },
  { weekday: 6, period: 7, group: "9K" },
];

export const GRADES = [8, 9, 10, 11, 12] as const;

// The revised sports allocation: block -> class -> sport.
export const ROTATION: Record<number, Record<number, Sport>> = {
  1: { 8: "Basketball", 9: "Basketball", 10: "Football", 11: "Volleyball", 12: "Football" },
  2: { 8: "Football", 9: "Football", 10: "Volleyball", 11: "Basketball", 12: "Basketball" },
  3: { 8: "Basketball", 9: "Basketball", 10: "Football", 11: "Volleyball", 12: "Volleyball" },
  4: { 8: "Volleyball", 9: "Volleyball", 10: "Basketball", 11: "Football", 12: "Football" },
};

// The six-week curriculum, one entry per week of a block. Every block
// restarts at week 1.
export const CURRICULUM: Record<Sport, { code: string; lesson: string }[]> = {
  Football: [
    { code: "F1", lesson: "Short passing and receiving" },
    { code: "F2", lesson: "Passing and shooting" },
    { code: "F3", lesson: "Attacking and defending" },
    { code: "F4", lesson: "Teamwork and tactics" },
    { code: "F5", lesson: "Match day" },
    { code: "F5", lesson: "Match day" },
  ],
  Basketball: [
    { code: "B1", lesson: "Fun and Competition" },
    { code: "B1", lesson: "Circuit Training" },
    { code: "B2", lesson: "Passing and Shooting" },
    { code: "B2", lesson: "Dribbling and Finishing" },
    { code: "B3", lesson: "Basketball Skills Assessment" },
    { code: "B3", lesson: "Final Game Day" },
  ],
  Volleyball: [
    { code: "V1", lesson: "Under-Arm Passing (Digging & Hand Lock)" },
    { code: "V1", lesson: "Overhead Passing (Setting & Fingertip Control)" },
    { code: "V1", lesson: "Under-Arm Service (Underhand Serving)" },
    { code: "V2", lesson: "Reaction & Agility (Court Movement & Ready Stance)" },
    { code: "V2", lesson: "Teamwork & Communication (3-Touch Concept)" },
    { code: "V2", lesson: "Net Defense / Basic Blocking (Introduction to Net Play)" },
  ],
};

// General holidays and observances from the supplied calendar. They are
// reminders only: the school confirms whether it is actually closed.
export const HOLIDAYS: Record<string, string> = {
  "2026-11-08": "Diwali / Naraka Chathurdashi",
  "2026-11-24": "Karthika Pournami / Guru Nanak Jayanti",
  "2026-12-24": "Christmas Eve",
  "2026-12-25": "Christmas",
  "2026-12-26": "Boxing Day / Hazrat Ali Birthday",
};

// What coaches report. "Not reported" is a session nobody has updated yet.
export const REPORT_STATUSES: Exclude<SessionStatus, "Not reported">[] = ["Done", "Not Done", "Cancelled", "Postponed"];

// Why a session didn't go ahead as planned, and whose side it fell on (the
// school sees this split; KLUTCH's own remarks stay internal).
export const REASONS: { label: string; side: "School" | "KLUTCH" | "Other" }[] = [
  { label: "School event or assembly", side: "School" },
  { label: "Exams or tests", side: "School" },
  { label: "School closed or holiday", side: "School" },
  { label: "Class busy with another subject", side: "School" },
  { label: "Ground or court unavailable", side: "School" },
  { label: "Weather", side: "Other" },
  { label: "Coach unavailable", side: "KLUTCH" },
  { label: "Equipment not available", side: "KLUTCH" },
  { label: "Other", side: "Other" },
];

export const reasonSide = (reason: string | null) =>
  REASONS.find((r) => r.label === reason)?.side ?? "Other";

/** The grades in a group: "9C/8A" -> [9, 8]. */
export function gradesOf(group: string): number[] {
  const grades = group.split("/").map((part) => Number(/^\d+/.exec(part)?.[0]));
  return [...new Set(grades.filter((g) => Number.isFinite(g)))];
}

/** The group's class, or null for a mixed group such as 9C/8A. */
export function gradeOf(group: string): number | null {
  const grades = gradesOf(group);
  return grades.length === 1 ? grades[0] : null;
}

export const classLabel = (grade: number | null, group = "") =>
  grade ? `Class ${grade}` : `Mixed ${gradesOf(group).sort((a, b) => a - b).join("/")}`;

/** Teaching week 1–24 for a date, or null outside the programme. */
export function teachingWeek(date: string): number | null {
  const days = Math.round((Date.parse(date) - Date.parse(PROGRAMME.startDate)) / 86_400_000);
  if (days < 0) return null;
  const week = Math.floor(days / 7) + 1;
  return week <= PROGRAMME.totalWeeks ? week : null;
}

export const blockOf = (week: number) => Math.ceil(week / PROGRAMME.weeksPerBlock);
export const weekInBlock = (week: number) => ((week - 1) % PROGRAMME.weeksPerBlock) + 1;

/** The Monday a teaching week starts. */
export function weekStart(week: number): string {
  const d = new Date(Date.parse(PROGRAMME.startDate) + (week - 1) * 7 * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/**
 * The sport for a group in a block. A mixed group gets a sport only when all
 * its classes share one that block (Classes 8 and 9 always do); otherwise the
 * admin has to confirm which class's plan it follows.
 */
export function sportFor(group: string, block: number): Sport | null {
  const sports = new Set(gradesOf(group).map((g) => ROTATION[block]?.[g]));
  const [only] = [...sports];
  return sports.size === 1 && only ? only : null;
}

export const sessionCode = (date: string, period: number, group: string) =>
  `${PROGRAMME.code}-${date.replace(/-/g, "")}-P${period}-${group.replace(/\//g, "")}`;

export interface PlannedSession {
  code: string;
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
}

/** The planned session for a timetable slot on a date, or null outside the programme. */
export function planSession(
  date: string,
  slot: { period: number; group: string; startTime?: string; endTime?: string }
): PlannedSession | null {
  const week = teachingWeek(date);
  if (!week) return null;
  const block = blockOf(week);
  const wib = weekInBlock(week);
  const sport = sportFor(slot.group, block);
  const step = sport ? CURRICULUM[sport][wib - 1] : null;
  return {
    code: sessionCode(date, slot.period, slot.group),
    date,
    period: slot.period,
    startTime: slot.startTime ?? PERIODS[slot.period].start,
    endTime: slot.endTime ?? PERIODS[slot.period].end,
    groupLabel: slot.group,
    grade: gradeOf(slot.group),
    teachingWeek: week,
    block,
    weekInBlock: wib,
    sport,
    curriculumCode: step?.code ?? null,
    lesson: step?.lesson ?? null,
  };
}
