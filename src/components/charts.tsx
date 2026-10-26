"use client";

import { useState } from "react";
import { BUCKETS, type Bucket, type Tally } from "@/lib/analytics";

// Status colours: lime = done, orange = missed, amber = postponed, mid grey =
// due but not reported, light grey = still to come. (Checked for colour-blind
// separation; the legend, tooltips and table view carry the values too.)
export const BUCKET_FILL: Record<Bucket, string> = {
  Done: "bg-hue-lime",
  Missed: "bg-hue-orange",
  Postponed: "bg-hue-amber",
  "Not reported": "bg-faint",
  Upcoming: "bg-line",
};

export const BUCKET_LABEL: Record<Bucket, string> = {
  Done: "Done",
  Missed: "Missed (not done or cancelled)",
  Postponed: "Postponed",
  "Not reported": "Not reported yet",
  Upcoming: "Still to come",
};

export function Legend({ buckets = BUCKETS }: { buckets?: Bucket[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
      {buckets.map((b) => (
        <li key={b} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-[2px] ${BUCKET_FILL[b]}`} />
          {BUCKET_LABEL[b]}
        </li>
      ))}
    </ul>
  );
}

function ViewToggle({ table, onChange }: { table: boolean; onChange: (table: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!table)}
      className="text-[12.5px] font-semibold text-accent underline-offset-2 hover:underline"
    >
      {table ? "Show as chart" : "Show as table"}
    </button>
  );
}

const niceMax = (n: number) => {
  if (n <= 10) return 10;
  const step = n <= 50 ? 10 : n <= 100 ? 25 : 50;
  return Math.ceil(n / step) * step;
};

export interface WeekColumn {
  week: number;
  dates: string; // "2–7 Nov"
  tally: Tally;
  current: boolean;
}

/** Sessions per teaching week, stacked by what happened. */
export function WeeklyChart({ weeks }: { weeks: WeekColumn[] }) {
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...weeks.map((w) => w.tally.total)));
  const ticks = [0, max / 2, max];
  const PLOT = 168;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Legend />
        <ViewToggle table={table} onChange={setTable} />
      </div>

      {table ? (
        <WeekTable weeks={weeks} />
      ) : (
        <>
        <WeekReadout w={weeks[hover ?? Math.max(0, weeks.findIndex((x) => x.current))]} hovered={hover !== null} />
        <div className="relative flex gap-2">
          {/* y axis */}
          <div className="relative w-7 shrink-0 font-mono text-[11px] tabular-nums text-faint" style={{ height: PLOT }}>
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: PLOT - (t / max) * PLOT }}>
                {t}
              </span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            {/* gridlines */}
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute inset-x-0 border-t border-line/70"
                style={{ top: PLOT - (t / max) * PLOT }}
              />
            ))}
            <div className="scrollbar-thin relative overflow-x-auto">
              <div className="flex min-w-max items-end gap-1 sm:gap-2" style={{ height: PLOT + 34 }}>
                {weeks.map((w, i) => (
                  <button
                    key={w.week}
                    type="button"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover((h) => (h === i ? null : h))}
                    aria-label={`Week ${w.week}, ${w.dates}: ${BUCKETS.map((b) => `${w.tally[b]} ${BUCKET_LABEL[b].toLowerCase()}`).join(", ")}`}
                    className="group relative flex h-full w-9 flex-col items-center justify-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-11"
                  >
                    <div
                      className={`flex w-6 flex-col-reverse gap-[2px] transition-opacity ${hover !== null && hover !== i ? "opacity-60" : ""}`}
                      style={{ height: (w.tally.total / max) * PLOT }}
                    >
                      {BUCKETS.filter((b) => w.tally[b] > 0).map((b, idx, shown) => (
                        <div
                          key={b}
                          className={`${BUCKET_FILL[b]} w-full ${idx === shown.length - 1 ? "rounded-t-[4px]" : ""}`}
                          style={{ flexGrow: w.tally[b], flexBasis: 0, minHeight: 2 }}
                        />
                      ))}
                    </div>
                    <span
                      className={`mt-2 h-[26px] font-mono text-[11px] leading-[13px] tabular-nums ${w.current ? "font-bold text-content" : "text-faint"}`}
                    >
                      W{w.week}
                      {w.current && <span className="block text-[10px] font-semibold text-accent">now</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

// The hovered (or tapped, or focused) week's numbers, in one line above the
// plot. It sits outside the scrolling area, so it's never clipped on phones.
function WeekReadout({ w, hovered }: { w: WeekColumn | undefined; hovered: boolean }) {
  if (!w) return null;
  return (
    <div aria-live="polite" className="mb-3 flex min-h-[40px] flex-wrap items-center gap-x-4 gap-y-1 rounded-sm bg-elevated px-3 py-2">
      <span className="text-[12.5px] font-semibold text-content">
        Week {w.week} <span className="font-normal text-muted">{w.dates}</span>
        {!hovered && w.current && <span className="ml-1.5 font-normal text-faint">(this week)</span>}
      </span>
      {BUCKETS.filter((b) => w.tally[b] > 0).map((b) => (
        <span key={b} className="flex items-center gap-1.5 text-[12.5px] text-muted">
          <span className={`h-[3px] w-3 rounded-full ${BUCKET_FILL[b]}`} />
          <span className="font-mono font-semibold tabular-nums text-content">{w.tally[b]}</span>
          {b === "Upcoming" ? "to come" : b.toLowerCase()}
        </span>
      ))}
    </div>
  );
}

function WeekTable({ weeks }: { weeks: WeekColumn[] }) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full border-collapse text-[13px] tabular-nums">
        <thead>
          <tr className="border-b border-line text-left text-[12px] text-muted">
            <th className="py-2 pr-3 font-semibold">Week</th>
            {BUCKETS.map((b) => (
              <th key={b} className="px-2 py-2 text-right font-semibold">
                {b === "Upcoming" ? "To come" : b}
              </th>
            ))}
            <th className="py-2 pl-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.week} className="border-b border-line/60">
              <td className="py-1.5 pr-3 text-content">
                Week {w.week} <span className="text-faint">{w.dates}</span>
              </td>
              {BUCKETS.map((b) => (
                <td key={b} className="px-2 py-1.5 text-right font-mono">
                  {w.tally[b]}
                </td>
              ))}
              <td className="py-1.5 pl-2 text-right font-mono font-semibold">{w.tally.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface StackedRow {
  label: string;
  sub?: string;
  tally: Tally;
}

/**
 * One horizontal bar per row (a class, a sport, a coach), split by what
 * happened. Bars share one scale so longer rows really have more sessions.
 */
export function StackedRows({ rows, buckets = BUCKETS }: { rows: StackedRow[]; buckets?: Bucket[] }) {
  const [table, setTable] = useState(false);
  const total = (r: StackedRow) => buckets.reduce((n, b) => n + r.tally[b], 0);
  const max = Math.max(1, ...rows.map(total));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Legend buckets={buckets} />
        <ViewToggle table={table} onChange={setTable} />
      </div>
      {table ? (
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full border-collapse text-[13px] tabular-nums">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-muted">
                <th className="py-2 pr-3 font-semibold"> </th>
                {buckets.map((b) => (
                  <th key={b} className="px-2 py-2 text-right font-semibold">
                    {b === "Upcoming" ? "To come" : b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-line/60">
                  <td className="py-1.5 pr-3 text-content">{r.label}</td>
                  {buckets.map((b) => (
                    <td key={b} className="px-2 py-1.5 text-right font-mono">
                      {r.tally[b]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((r) => {
            const shown = buckets.filter((b) => r.tally[b] > 0);
            const due = r.tally.due;
            return (
              <li key={r.label}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="font-semibold text-content">
                    {r.label}
                    {r.sub && <span className="ml-2 font-normal text-faint">{r.sub}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-[12px] tabular-nums text-muted">
                    {due ? `${r.tally.Done} of ${due} due done` : `${total(r)} to come`}
                  </span>
                </div>
                <div
                  className="flex h-3 gap-[2px]"
                  style={{ width: `${(total(r) / max) * 100}%` }}
                  title={shown.map((b) => `${b}: ${r.tally[b]}`).join(", ")}
                >
                  {shown.map((b, idx) => (
                    <div
                      key={b}
                      className={`${BUCKET_FILL[b]} h-full ${idx === shown.length - 1 ? "rounded-r-[4px]" : ""}`}
                      style={{ flexGrow: r.tally[b], flexBasis: 0, minWidth: 2 }}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** A single-series bar list (one colour), e.g. missed sessions by reason. */
export function BarList({ rows, empty }: { rows: { label: string; sub?: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-4 text-sm text-faint">{empty}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="text-content">
              {r.label}
              {r.sub && <span className="ml-2 text-faint">{r.sub}</span>}
            </span>
            <span className="font-mono text-[12px] font-semibold tabular-nums text-content">{r.value}</span>
          </div>
          <div className="h-2 rounded-r-[4px] bg-hue-blue" style={{ width: `${(r.value / max) * 100}%`, minWidth: 2 }} />
        </li>
      ))}
    </ul>
  );
}

/** A ratio against its whole: the fill on a lighter track of the same hue. */
export function RateBar({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-hue-blue/15" role="img" aria-label={label}>
      <div className="h-full rounded-full bg-hue-blue" style={{ width: `${value ?? 0}%` }} />
    </div>
  );
}
