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
