"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { deliveryRate, isDue, missedByReason, pct, reportingRate, tally } from "@/lib/analytics";
import { shortDay, todayISO } from "@/lib/dates";
import type { Session } from "@/lib/types";
import { BarList, StackedRows, WeeklyChart } from "@/components/charts";
import { ReportDialog, timeRange } from "@/components/session";
import { Card, Empty, StatCard, StatGrid, Table, Td, Th, THead, Tr } from "@/components/ui";
import { ChartCard, ProgrammeStrip, useProgrammeCharts } from "./shared";

export default function Dashboard() {
  const { sessions, slots, coaches, attendance, coachName, setActive, live } = useStore();
  const today = todayISO();
  const { weeks, byClass, bySport, overall } = useProgrammeCharts(sessions, today);
  const [reporting, setReporting] = useState<Session | null>(null);

  const overdue = useMemo(
    () =>
      sessions
        .filter((s) => s.date < today && s.status === "Not reported")
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [sessions, today]
  );
  const missed = overall.Missed + overall.Postponed;
  const rate = deliveryRate(overall);
  const reported = reportingRate(overall);
  const activeCoaches = coaches.filter((c) => c.status === "Active");
  const presentToday = attendance.filter((a) => a.date === today && a.present).length;
  const unassignedSlots = slots.filter((s) => !s.coachId).length;
  const mixedSlots = slots.filter((s) => s.grade === null);
  const reasons = missedByReason(sessions);

  const coachRows = useMemo(() => {
    const month = today.slice(0, 7);
    return coaches.map((c) => {
      const mine = sessions.filter((s) => s.coachId === c.id);
      const t = tally(mine, today);
      const marks = attendance.filter((a) => a.coachId === c.id && a.date.startsWith(month));
      return {
        coach: c,
        slots: slots.filter((s) => s.coachId === c.id).length,
        t,
        overdue: mine.filter((s) => s.date < today && s.status === "Not reported").length,
        present: marks.filter((a) => a.present).length,
        marked: marks.length,
      };
    });
  }, [coaches, sessions, slots, attendance, today]);

  return (
    <div className="space-y-6">
      <ProgrammeStrip today={today} />

      <StatGrid cols={4}>
        <StatCard
          label="Sessions delivered"
          icon="check-circle"
          tone="tennis"
          value={overall.due ? `${rate}%` : "—"}
          sub={overall.due ? `${overall.Done} of ${overall.due} due so far` : `${overall.total} sessions planned`}
        />
        <StatCard
          label="Waiting for a report"
          icon="clock"
          tone={overdue.length ? "orange" : "neutral"}
          value={overdue.length}
          sub={overall.due ? `${reported}% of due sessions reported` : "Coaches report after each session"}
        />
        <StatCard
          label="Missed or postponed"
          icon="cancel"
          tone={missed ? "orange" : "neutral"}
          value={missed}
          sub={overall.due ? `${pct(missed, overall.due)}% of due sessions` : "None yet"}
        />
        <StatCard
          label="Coaches present today"
          icon="attendance"
          value={`${presentToday} of ${activeCoaches.length}`}
          sub={
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse-dot bg-hue-lime motion-reduce:animate-none" : "bg-faint"}`} />
              {live ? "Updating live" : "Connecting…"}
            </span>
          }
        />
      </StatGrid>

      <ChartCard title="Sessions by teaching week" sub="Every planned PET session, by what happened. Hover or tap a week for its numbers.">
        <WeeklyChart weeks={weeks} />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="By class" sub="Mixed 8/9 are the two cross-class groups, 9C/8A and 9H/8I.">
          <StackedRows rows={byClass} />
        </ChartCard>
        <ChartCard title="By sport" sub="Sports change every six weeks, so these totals shift by block.">
          <StackedRows rows={bySport} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-[1.0625rem] font-extrabold tracking-[-0.015em] text-content">Needs attention</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {unassignedSlots > 0 && (
              <AttentionItem
                title={`${unassignedSlots} of ${slots.length} weekly slots have no coach`}
                body="Coaches only see the sessions assigned to them."
                action="Assign coaches"
                onClick={() => setActive("timetable")}
              />
            )}
            {mixedSlots.length > 0 && (
              <AttentionItem
                title={`Confirm the mixed groups ${mixedSlots.map((s) => s.groupLabel).join(" and ")}`}
                body="Classes 8 and 9 play the same sport every block, so their sessions are planned with it. Check with the school who attends."
              />
            )}
            {overdue.length > 0 && (
              <AttentionItem
                title={`${overdue.length} past session${overdue.length === 1 ? "" : "s"} not reported`}
                body="They count as not delivered until a coach reports them."
                action="Open session tracking"
                onClick={() => setActive("sessions")}
              />
            )}
            {!unassignedSlots && !mixedSlots.length && !overdue.length && (
              <li className="py-3 text-faint">Nothing waiting. Every due session is reported.</li>
            )}
          </ul>
          {overdue.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-lg border border-line">
              <Table>
                <THead>
                  <Th>Session</Th>
                  <Th>Coach</Th>
                </THead>
                <tbody>
                  {overdue.slice(0, 6).map((s, i) => (
                    <Tr key={s.id} i={i}>
                      <Td>
                        <button onClick={() => setReporting(s)} className="text-left font-semibold text-accent hover:underline">
                          {s.groupLabel}
                        </button>
                        <div className="text-[12px] text-faint">
                          {shortDay(s.date)}, {timeRange(s)}
                        </div>
                      </Td>
                      <Td className={s.coachId ? "" : "text-faint"}>{coachName(s.coachId)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>

        <ChartCard title="Why sessions didn't happen" sub="Missed and postponed sessions, by the reason the coach gave.">
          <BarList
            rows={reasons.map((r) => ({ label: r.reason, sub: r.side === "Other" ? undefined : `${r.side} side`, value: r.count }))}
            empty="No missed or postponed sessions yet."
          />
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-3 font-display text-[1.1875rem] font-extrabold tracking-[-0.02em] text-content">Coaches</h2>
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <Th>Coach</Th>
              <Th>Weekly slots</Th>
              <Th>Delivered</Th>
              <Th>Not reported</Th>
              <Th>Present this month</Th>
            </THead>
            <tbody>
              {coachRows.map(({ coach, slots: n, t, overdue: late, present, marked }, i) => (
                <Tr key={coach.id} i={i}>
                  <Td className="font-semibold text-content">{coach.name}</Td>
                  <Td className="font-mono">{n}</Td>
                  <Td className="font-mono">{t.due ? `${t.Done} of ${t.due} (${deliveryRate(t)}%)` : "—"}</Td>
                  <Td className={`font-mono ${late ? "font-semibold text-bad" : ""}`}>{late}</Td>
                  <Td className="font-mono">{marked ? `${present} of ${marked} days` : "No days marked"}</Td>
                </Tr>
              ))}
              {coachRows.length === 0 && <Empty cols={5}>No coaches yet. Add them on the Coaches screen.</Empty>}
            </tbody>
          </Table>
        </Card>
        {sessions.some((s) => isDue(s, today) && !s.coachId) && (
          <p className="mt-2 text-[12.5px] text-faint">Sessions without a coach aren't counted for anyone above.</p>
        )}
      </div>

      {reporting && <ReportDialog session={reporting} admin onClose={() => setReporting(null)} />}
    </div>
  );
}

function AttentionItem({ title, body, action, onClick }: { title: string; body: string; action?: string; onClick?: () => void }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="font-semibold text-content">{title}</div>
        <div className="mt-0.5 text-[13px] text-muted">{body}</div>
      </div>
      {action && (
        <button
          onClick={onClick}
          className="shrink-0 rounded-sm border border-line px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent"
        >
          {action}
        </button>
      )}
    </li>
  );
}
