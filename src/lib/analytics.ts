// How every screen counts sessions, so the admin, coach and school views
// always agree. A session is "due" once its date has passed, or on the day
// itself once it has been reported. Delivery rate = Done out of due, so a
// session nobody has reported never counts as delivered.

import { classLabel, reasonSide } from "./programme";
import type { Session } from "./types";

export type Bucket = "Done" | "Missed" | "Postponed" | "Not reported" | "Upcoming";
export const BUCKETS: Bucket[] = ["Done", "Missed", "Postponed", "Not reported", "Upcoming"];

export const isReported = (s: Session) => s.status !== "Not reported";
export const isDue = (s: Session, today: string) => s.date < today || (s.date === today && isReported(s));

/** What happened to a session, or what is still to come. Missed = Not Done or Cancelled. */
export function bucketOf(s: Session, today: string): Bucket {
  switch (s.status) {
    case "Done":
      return "Done";
    case "Not Done":
    case "Cancelled":
      return "Missed";
    case "Postponed":
      return "Postponed";
    default:
      return s.date < today ? "Not reported" : "Upcoming";
  }
}

export type Tally = Record<Bucket, number> & { total: number; due: number };

const emptyTally = (): Tally => ({ Done: 0, Missed: 0, Postponed: 0, "Not reported": 0, Upcoming: 0, total: 0, due: 0 });

export function tally(sessions: Session[], today: string): Tally {
  const t = emptyTally();
  for (const s of sessions) {
    t[bucketOf(s, today)] += 1;
    t.total += 1;
    if (isDue(s, today)) t.due += 1;
  }
  return t;
}

/** Done out of due, as a whole percentage; null while nothing is due yet. */
export const deliveryRate = (t: Tally) => (t.due ? Math.round((t.Done / t.due) * 100) : null);

/** Reported out of due; null while nothing is due yet. */
export const reportingRate = (t: Tally) =>
  t.due ? Math.round(((t.due - t["Not reported"]) / t.due) * 100) : null;

/** Tallies per key, in the order the keys first appear unless sorted after. */
export function tallyBy(sessions: Session[], today: string, keyOf: (s: Session) => string): Map<string, Tally> {
  const groups = new Map<string, Session[]>();
  for (const s of sessions) {
    const key = keyOf(s);
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return new Map([...groups].map(([key, list]) => [key, tally(list, today)]));
}

export const sessionClass = (s: Session) => classLabel(s.grade, s.groupLabel);

/** Missed and postponed sessions by reason, with whose side the reason falls on. */
export function missedByReason(sessions: Session[]) {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== "Not Done" && s.status !== "Cancelled" && s.status !== "Postponed") continue;
    const reason = s.reason ?? "No reason given";
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts]
    .map(([reason, count]) => ({ reason, count, side: reasonSide(reason === "No reason given" ? null : reason) }))
    .sort((a, b) => b.count - a.count);
}

export const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
