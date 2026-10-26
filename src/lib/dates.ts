// The school runs on India time, so every "today" in the app means today in
// IST, whatever time zone the server or the viewer's browser is in.
const IST = "Asia/Kolkata";

function istParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Today's date in IST as YYYY-MM-DD (the format stored in the database). */
export function todayISO(): string {
  const { year, month, day } = istParts(new Date());
  return `${year}-${month}-${day}`;
}

/** "2026-10" or "2026-10-13" -> "October 2026". */
export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2026-10-13" -> "Tuesday, 13 October". */
export function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** ISO weekday of a YYYY-MM-DD date: 1 = Monday ... 7 = Sunday. */
export function isoWeekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Adds n days (n may be negative) to a YYYY-MM-DD date. */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Short weekday names, indexed by ISO weekday - 1. */
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** "13:05" -> "1:05 pm"; empty string for no time. */
export function timeLabel(hhmm: string | null): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** Sort key for sessions: by date, then start time (untimed sessions last). */
export function bySchedule<T extends { date: string; startTime: string | null }>(a: T, b: T): number {
  return a.date.localeCompare(b.date) || (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99");
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-02" -> "Mon 2 Nov". */
export function shortDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${WEEKDAYS[isoWeekday(iso) - 1]} ${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "2026-11-02", "2026-11-07" -> "2–7 Nov"; across months, "30 Nov–5 Dec". */
export function rangeLabel(from: string, to: string): string {
  const [, fm, fd] = from.split("-").map(Number);
  const [, tm, td] = to.split("-").map(Number);
  return fm === tm ? `${fd}–${td} ${MONTHS_SHORT[tm - 1]}` : `${fd} ${MONTHS_SHORT[fm - 1]}–${td} ${MONTHS_SHORT[tm - 1]}`;
}

/** The Monday of the week a date falls in. */
export function mondayOf(iso: string): string {
  return addDays(iso, 1 - isoWeekday(iso));
}
