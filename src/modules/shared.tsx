"use client";

// Pieces the admin dashboard and the school view share, so both describe the
// programme with the same numbers.

import { useMemo } from "react";
import { sessionClass, tally, tallyBy } from "@/lib/analytics";
import type { StackedRow, WeekColumn } from "@/components/charts";
import { weekDates } from "@/components/session";
import { GRADES, PROGRAMME, ROTATION, blockOf, teachingWeek, weekStart } from "@/lib/programme";
import { addDays, shortDay } from "@/lib/dates";
import { SPORT_COLOR, SPORT_ICON, type Session } from "@/lib/types";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui";

const CLASS_ORDER = (label: string) => {
  const n = /^Class (\d+)/.exec(label)?.[1];
  return n ? Number(n) : 99;
};

export function useProgrammeCharts(sessions: Session[], today: string) {
  return useMemo(() => {
    const current = teachingWeek(today);
    const weeks: WeekColumn[] = [...tallyBy(sessions, today, (s) => String(s.teachingWeek))]
      .map(([week, t]) => ({ week: Number(week), dates: weekDates(Number(week)), tally: t, current: Number(week) === current }))
      .sort((a, b) => a.week - b.week);
    const byClass: StackedRow[] = [...tallyBy(sessions, today, sessionClass)]
      .map(([label, t]) => ({ label, tally: t }))
      .sort((a, b) => CLASS_ORDER(a.label) - CLASS_ORDER(b.label) || a.label.localeCompare(b.label));
    const bySport: StackedRow[] = [...tallyBy(sessions, today, (s) => s.sport ?? "Sport to confirm")]
      .map(([label, t]) => ({ label, tally: t }))
      .sort((a, b) => b.tally.total - a.tally.total);
    return { weeks, byClass, bySport, overall: tally(sessions, today) };
  }, [sessions, today]);
}

/** Where the programme is today: teaching week, block, and each class's sport. */
export function ProgrammeStrip({ today }: { today: string }) {
  const week = teachingWeek(today);
  const before = today < PROGRAMME.startDate;
  const after = !week && !before;
  const block = week ? blockOf(week) : before ? 1 : 4;
  const blockFrom = weekStart((block - 1) * PROGRAMME.weeksPerBlock + 1);
  const blockTo = addDays(weekStart(block * PROGRAMME.weeksPerBlock), 5);
  const daysToStart = Math.round((Date.parse(PROGRAMME.startDate) - Date.parse(today)) / 86_400_000);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[13px] font-medium text-muted">{PROGRAMME.schoolName}, Classes 8–12</div>
          <div className="mt-1 font-display text-[1.75rem] font-black leading-tight tracking-[-0.03em] text-content">
            {before
              ? `Starts ${shortDay(PROGRAMME.startDate)}, in ${daysToStart} day${daysToStart === 1 ? "" : "s"}`
              : after
                ? "All 24 weeks are complete"
                : `Week ${week} of ${PROGRAMME.totalWeeks}`}
          </div>
          <div className="mt-1 text-sm text-muted">
            Block {block} of 4 runs {shortDay(blockFrom)} to {shortDay(blockTo)}
            {week ? `, week ${((week - 1) % PROGRAMME.weeksPerBlock) + 1} of 6` : ""}.
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-5">
          {GRADES.map((g) => {
            const sport = ROTATION[block][g];
            return (
              <li key={g} className="bg-surface px-3.5 py-2.5 last:col-span-2 sm:last:col-span-1">
                <div className="text-[12px] font-medium text-muted">Class {g}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold text-content">
                  <Icon name={SPORT_ICON[sport]} size={14} style={{ color: SPORT_COLOR[sport] }} />
                  {sport}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

export function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="font-display text-[1.0625rem] font-extrabold tracking-[-0.015em] text-content">{title}</h2>
      {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}
