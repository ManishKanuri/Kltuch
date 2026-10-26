"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { bucketOf, deliveryRate, missedByReason, sessionClass, tally } from "@/lib/analytics";
import { addDays, mondayOf, shortDay, todayISO } from "@/lib/dates";
import { PROGRAMME, teachingWeek } from "@/lib/programme";
import { BarList, StackedRows, WeeklyChart } from "@/components/charts";
import { LessonLine, timeRange, weekDates } from "@/components/session";
import { Card, Empty, SportBadge, StatCard, StatGrid, StatusTag, Table, Td, Th, THead, Tr } from "@/components/ui";
import { ChartCard, ProgrammeStrip, useProgrammeCharts } from "./shared";

// What the school sees. Internal remarks and coach attendance are KLUTCH's
// own and never appear here.
export default function SchoolView() {
  const { sessions } = useStore();
  const today = todayISO();
  const { weeks, byClass, bySport, overall } = useProgrammeCharts(sessions, today);
  const rate = deliveryRate(overall);
  const reasons = missedByReason(sessions);
  const schoolSide = reasons.filter((r) => r.side === "School").reduce((n, r) => n + r.count, 0);
  const klutchSide = reasons.filter((r) => r.side === "KLUTCH").reduce((n, r) => n + r.count, 0);

  const week = teachingWeek(today);
  const scheduleWeekStart = today < PROGRAMME.startDate ? PROGRAMME.startDate : mondayOf(today);
  const scheduleWeekEnd = addDays(scheduleWeekStart, 5);
  const thisWeek = sessions
    .filter((s) => s.date >= scheduleWeekStart && s.date <= scheduleWeekEnd)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const thisWeekTally = tally(thisWeek, today);

  const progress = useMemo(() => {
    const groups = new Map<string, typeof sessions>();
    for (const s of sessions) groups.set(sessionClass(s), [...(groups.get(sessionClass(s)) ?? []), s]);
    return [...groups]
      .map(([label, list]) => {
        const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
        const done = sorted.filter((s) => s.status === "Done");
        const latest = done[done.length - 1] ?? null;
        const next = sorted.find((s) => s.date >= today && s.status === "Not reported") ?? null;
        return { label, done: done.length, latest, next };
      })
      .sort((a, b) => (a.label.startsWith("Mixed") ? 1 : b.label.startsWith("Mixed") ? -1 : a.label.localeCompare(b.label, undefined, { numeric: true })));
  }, [sessions, today]);

  return (
    <div className="space-y-6">
      <ProgrammeStrip today={today} />

      <StatGrid cols={4}>
        <StatCard
          label="Sessions delivered"
          icon="check-circle"
          tone="tennis"
          value={overall.due ? `${rate}%` : "—"}
          sub={overall.due ? `${overall.Done} of ${overall.due} due so far` : "Delivery starts with week 1"}
        />
        <StatCard
          label={week ? "This week" : "First week"}
          icon="calendar"
          value={thisWeek.length}
          sub={thisWeekTally.Done ? `${thisWeekTally.Done} delivered so far` : `Sessions planned, ${weekDates(week ?? 1)}`}
        />
        <StatCard
          label="Missed, school side"
          icon="school"
          tone={schoolSide ? "orange" : "neutral"}
          value={schoolSide}
          sub="Events, exams, closures, grounds"
        />
        <StatCard
          label="Missed, KLUTCH side"
          icon="whistle"
          tone={klutchSide ? "orange" : "neutral"}
          value={klutchSide}
          sub="Coach or equipment unavailable"
        />
      </StatGrid>

      <ChartCard title="Sessions by teaching week" sub="Every planned PET session for Classes 8–12, by what happened.">
        <WeeklyChart weeks={weeks} />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="By class">
          <StackedRows rows={byClass} />
        </ChartCard>
        <ChartCard title="By sport">
          <StackedRows rows={bySport} />
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-3 font-display text-[1.1875rem] font-extrabold tracking-[-0.02em] text-content">Curriculum progress</h2>
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <Th>Class</Th>
              <Th>Sessions delivered</Th>
              <Th>Latest lesson delivered</Th>
              <Th>Next lesson</Th>
            </THead>
            <tbody>
              {progress.map(({ label, done, latest, next }, i) => (
                <Tr key={label} i={i}>
                  <Td className="font-semibold text-content">{label}</Td>
                  <Td className="font-mono">{done}</Td>
                  <Td>
                    {latest ? (
                      <>
                        <LessonLine s={latest} className="text-[13px]" />
                        <div className="text-[12px] text-faint">
                          {latest.groupLabel}, {shortDay(latest.date)}
                        </div>
                      </>
                    ) : (
                      <span className="text-faint">None yet</span>
                    )}
                  </Td>
                  <Td>
                    {next ? (
                      <>
                        <LessonLine s={next} className="text-[13px]" />
                        <div className="text-[12px] text-faint">
                          {next.groupLabel}, {shortDay(next.date)}
                        </div>
                      </>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <ChartCard title="Why sessions didn't happen" sub="Missed and postponed sessions, by reason, and whose side it fell on.">
        <BarList
          rows={reasons.map((r) => ({ label: r.reason, sub: r.side === "Other" ? undefined : `${r.side} side`, value: r.count }))}
          empty="No missed or postponed sessions."
        />
      </ChartCard>

      <div>
        <h2 className="mb-3 font-display text-[1.1875rem] font-extrabold tracking-[-0.02em] text-content">
          {today < PROGRAMME.startDate ? "First week" : "This week"}, {shortDay(scheduleWeekStart)} to {shortDay(scheduleWeekEnd)}
        </h2>
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <Th>Day</Th>
              <Th>Time</Th>
              <Th>Group</Th>
              <Th>Sport and lesson</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {thisWeek.map((s, i) => (
                <Tr key={s.id} i={i}>
                  <Td className="whitespace-nowrap">{shortDay(s.date)}</Td>
                  <Td className="whitespace-nowrap font-mono text-[12.5px]">{timeRange(s)}</Td>
                  <Td className="font-semibold text-content">{s.groupLabel}</Td>
                  <Td>
                    <SportBadge sport={s.sport} />
                    <div className="mt-1 text-[13px]">
                      <LessonLine s={s} />
                    </div>
                  </Td>
                  <Td>
                    <StatusTag value={bucketOf(s, today) === "Upcoming" ? "Upcoming" : s.status} />
                  </Td>
                </Tr>
              ))}
              {thisWeek.length === 0 && <Empty cols={5}>No sessions this week.</Empty>}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
