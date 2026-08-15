import {
  SPORTS,
  type Assessment,
  type ClassRoom,
  type CoachAttendance,
  type FitnessAssessment,
  type Session,
  type SkillKey,
  type Sport,
} from "./types";

const SKILLS: SkillKey[] = ["motorSkills", "coordination", "fitness", "attitude"];

export function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export function completionRate(sessions: Session[]) {
  const done = sessions.filter((s) => s.status === "Done").length;
  return { done, total: sessions.length, rate: pct(done, sessions.length) };
}

export function attendanceRate(
  attendance: CoachAttendance[],
  totalCoaches: number,
  date: string
) {
  const present = attendance.filter((a) => a.date === date && a.present).length;
  return { present, total: totalCoaches, rate: pct(present, totalCoaches) };
}

export function skillAverages(assessments: Assessment[]) {
  const out = {} as Record<SkillKey, number>;
  for (const sk of SKILLS) {
    const vals = assessments.map((a) => a.ratings[sk]);
    out[sk] = vals.length
      ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
      : 0;
  }
  return out;
}

export function overallAvg(ratings: Record<SkillKey, number>) {
  const vals = SKILLS.map((s) => ratings[s]);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export interface SportStat {
  sport: Sport;
  classes: number;
  sessions: number;
  done: number;
  rate: number;
}

export function sportBreakdown(
  classes: ClassRoom[],
  sessions: Session[]
): SportStat[] {
  return SPORTS.map((sport) => {
    const clsIds = classes
      .filter((c) => c.sport === sport)
      .map((c) => c.id);
    const sess = sessions.filter((s) => clsIds.includes(s.classId));
    const done = sess.filter((s) => s.status === "Done").length;
    return {
      sport,
      classes: clsIds.length,
      sessions: sess.length,
      done,
      rate: pct(done, sess.length),
    };
  });
}

export interface CoachStat {
  coachId: string;
  name: string;
  done: number;
  total: number;
  rate: number;
  rating: number;
}

export function coachLeaderboard(
  coaches: { id: string; name: string; rating: number }[],
  sessions: Session[]
): CoachStat[] {
  return coaches
    .map((c) => {
      const sess = sessions.filter((s) => s.coachId === c.id);
      const done = sess.filter((s) => s.status === "Done").length;
      return {
        coachId: c.id,
        name: c.name,
        done,
        total: sess.length,
        rate: pct(done, sess.length),
        rating: c.rating,
      };
    })
    .sort((a, b) => b.rating - a.rating || b.done - a.done);
}

// ---- Report-card analysis for one student ----
export interface SkillInsight {
  skill: SkillKey;
  score: number;
  classAvg: number;
  delta: number; // vs class average
}

export function analyzeStudent(
  student: Assessment,
  classAssessments: Assessment[]
) {
  const classAvgs = skillAverages(classAssessments);
  const insights: SkillInsight[] = SKILLS.map((sk) => ({
    skill: sk,
    score: student.ratings[sk],
    classAvg: classAvgs[sk],
    delta: Math.round((student.ratings[sk] - classAvgs[sk]) * 10) / 10,
  }));

  const sorted = [...insights].sort((a, b) => b.score - a.score);
  const strengths = sorted.filter((i) => i.score >= 4).slice(0, 2);
  const focus = [...sorted].reverse().filter((i) => i.score <= 3).slice(0, 2);
  const overall = overallAvg(student.ratings);
  const classOverall =
    Math.round(
      (SKILLS.reduce((s, sk) => s + classAvgs[sk], 0) / SKILLS.length) * 10
    ) / 10;

  const grade =
    overall >= 4.5
      ? "A+"
      : overall >= 4
        ? "A"
        : overall >= 3.5
          ? "B+"
          : overall >= 3
            ? "B"
            : overall >= 2
              ? "C"
              : "D";

  return {
    insights,
    strengths,
    focus,
    overall,
    classOverall,
    grade,
    aheadOfClass: overall >= classOverall,
  };
}

export const SKILL_ORDER = SKILLS;

export const FITNESS_METRICS = [
  { key: "speed50mSeconds", label: "50m Dash", unit: "sec", higherIsBetter: false },
  { key: "stamina600mSeconds", label: "600m Run / Walk", unit: "sec", higherIsBetter: false },
  { key: "toeTouchCm", label: "Forward Toe Touch", unit: "cm", higherIsBetter: true },
  { key: "pushUps", label: "Push-ups", unit: "reps", higherIsBetter: true },
  { key: "curls", label: "Curls", unit: "reps", higherIsBetter: true },
] as const;

export type FitnessMetricKey = (typeof FITNESS_METRICS)[number]["key"];

export function mean(values: number[]) {
  return values.length
    ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
    : 0;
}

export function fitnessAverages(records: FitnessAssessment[]) {
  return Object.fromEntries(
    FITNESS_METRICS.map((metric) => [
      metric.key,
      mean(records.map((record) => record[metric.key])),
    ])
  ) as Record<FitnessMetricKey, number>;
}

export function analyzeFitnessStudent(
  student: FitnessAssessment,
  cohort: FitnessAssessment[]
) {
  const averages = fitnessAverages(cohort);
  const insights = FITNESS_METRICS.map((metric) => {
    const value = student[metric.key];
    const average = averages[metric.key];
    const rawDelta = Math.round((value - average) * 10) / 10;
    const better = metric.higherIsBetter ? rawDelta >= 0 : rawDelta <= 0;
    const relative = average ? Math.round((Math.abs(rawDelta) / average) * 100) : 0;
    return { ...metric, value, average, rawDelta, better, relative };
  });
  const strengths = [...insights].filter((item) => item.better).sort((a, b) => b.relative - a.relative).slice(0, 2);
  const focus = [...insights].filter((item) => !item.better).sort((a, b) => b.relative - a.relative).slice(0, 2);
  const aboveAverage = insights.filter((item) => item.better).length;
  return {
    insights,
    strengths,
    focus,
    aboveAverage,
    profile: aboveAverage >= 4 ? "Strong all-round profile" : aboveAverage >= 3 ? "Developing well" : "Focused support recommended",
  };
}

export function fitnessScore(student: FitnessAssessment, peers: FitnessAssessment[]) {
  if (peers.length < 2) return 0;
  const score = FITNESS_METRICS.reduce((sum, metric) => {
    const values = peers.map((peer) => peer[metric.key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max === min) return sum + 50;
    const ratio = (student[metric.key] - min) / (max - min);
    return sum + (metric.higherIsBetter ? ratio : 1 - ratio) * 100;
  }, 0);
  return Math.round(score / FITNESS_METRICS.length);
}

export function fitnessLeaderboard(records: FitnessAssessment[]) {
  return records.map((student) => {
    const peers = records.filter((peer) => peer.age === student.age && peer.gender === student.gender);
    return { student, score: fitnessScore(student, peers) };
  }).sort((a, b) => b.score - a.score).slice(0, 10);
}
