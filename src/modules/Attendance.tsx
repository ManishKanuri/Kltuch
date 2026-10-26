"use client";

import { useMemo, useState } from "react";
import { useStore, type AttendanceMark } from "@/lib/store";
import { addDays, monthLabel, mondayOf, rangeLabel, shortDay, todayISO, WEEKDAYS } from "@/lib/dates";
import { pct } from "@/lib/analytics";
import { Icon } from "@/components/icons";
import { Card, OutlineButton, StatusTag, Table, Td, Th, THead, Tr } from "@/components/ui";

const NEXT: Record<"none" | "present" | "absent", AttendanceMark> = { none: "present", present: "absent", absent: null };

export default function Attendance() {
  const { coaches, attendance, sessions, setAttendance, toast } = useStore();
  const today = todayISO();
  const [monday, setMonday] = useState(mondayOf(today));
  const days = [0, 1, 2, 3, 4, 5].map((n) => addDays(monday, n));
  const active = coaches.filter((c) => c.status === "Active");

  const markOf = (coachId: string, date: string) => {
    const a = attendance.find((x) => x.coachId === coachId && x.date === date);
    return a ? (a.present ? "present" : "absent") : "none";
  };
  const sessionsOn = (coachId: string, date: string) => sessions.filter((s) => s.coachId === coachId && s.date === date).length;

  async function cycle(coachId: string, name: string, date: string) {
    const next = NEXT[markOf(coachId, date)];
    if (await setAttendance(coachId, date, next)) {
      toast(`${name}, ${shortDay(date)}: ${next === null ? "mark cleared" : next === "present" ? "present" : "absent"}`);
    }
  }

  const month = today.slice(0, 7);
  const summary = useMemo(
    () =>
      active.map((c) => {
        const marks = attendance.filter((a) => a.coachId === c.id && a.date.startsWith(month));
        const present = marks.filter((a) => a.present).length;
        const markedDays = new Set(marks.map((a) => a.date));
        const unmarkedSessionDays = new Set(
          sessions.filter((s) => s.coachId === c.id && s.date.startsWith(month) && s.date <= today && !markedDays.has(s.date)).map((s) => s.date)
        ).size;
        return { coach: c, present, absent: marks.length - present, marked: marks.length, unmarkedSessionDays };
      }),
    [active, attendance, sessions, month, today]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <OutlineButton onClick={() => setMonday(addDays(monday, -7))}>
            <span className="sr-only">Previous week</span>
            <Icon name="chevron-right" size={15} className="rotate-180" />
          </OutlineButton>
          <div className="min-w-[9rem] text-center font-display text-[1.0625rem] font-extrabold tracking-[-0.015em] text-content">
            {rangeLabel(days[0], days[5])}
          </div>
          <OutlineButton onClick={() => setMonday(addDays(monday, 7))}>
            <span className="sr-only">Next week</span>
            <Icon name="chevron-right" size={15} />
          </OutlineButton>
          {monday !== mondayOf(today) && (
            <button onClick={() => setMonday(mondayOf(today))} className="ml-1 text-[13px] font-semibold text-accent hover:underline">
              This week
            </button>
          )}
        </div>
        <p className="text-[13px] text-muted">Tap a day to mark present, then absent, then clear.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-elevated">
                <th className="px-4 py-2.5 text-left text-[12px] font-semibold text-muted">Coach</th>
                {days.map((d, i) => (
                  <th key={d} className={`px-2 py-2.5 text-left text-[12px] font-semibold ${d === today ? "text-accent" : "text-muted"}`}>
                    {WEEKDAYS[i]} {Number(d.slice(8))}
                    {d === today && <span className="ml-1 font-normal">today</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <th className="px-4 py-2 text-left font-semibold text-content">{c.name}</th>
                  {days.map((d) => {
                    const mark = markOf(c.id, d);
                    const count = sessionsOn(c.id, d);
                    const future = d > today;
                    return (
                      <td key={d} className={`px-1.5 py-1.5 ${d === today ? "bg-accent/[0.05]" : ""}`}>
                        <button
                          onClick={() => cycle(c.id, c.name, d)}
                          disabled={future}
                          aria-label={`${c.name}, ${shortDay(d)}: ${mark === "none" ? "not marked" : mark}${future ? " (future day)" : ""}`}
                          className="flex w-full flex-col items-start rounded-sm border border-line px-2 py-1.5 text-left transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line"
                        >
                          {mark === "none" ? (
                            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint">Not marked</span>
                          ) : (
                            <StatusTag value={mark === "present" ? "Present" : "Absent"} />
                          )}
                          <span className="mt-0.5 text-[11.5px] text-faint">
                            {count ? `${count} session${count === 1 ? "" : "s"}` : "No sessions"}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-[1.1875rem] font-extrabold tracking-[-0.02em] text-content">{monthLabel(today)}</h2>
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <Th>Coach</Th>
              <Th>Present</Th>
              <Th>Absent</Th>
              <Th>Attendance</Th>
              <Th>Session days not marked</Th>
            </THead>
            <tbody>
              {summary.map(({ coach, present, absent, marked, unmarkedSessionDays }, i) => (
                <Tr key={coach.id} i={i}>
                  <Td className="font-semibold text-content">{coach.name}</Td>
                  <Td className="font-mono">{present}</Td>
                  <Td className="font-mono">{absent}</Td>
                  <Td className="font-mono">{marked ? `${pct(present, marked)}%` : "—"}</Td>
                  <Td className={`font-mono ${unmarkedSessionDays ? "font-semibold text-warn" : ""}`}>{unmarkedSessionDays}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <p className="mt-2 text-[12.5px] text-faint">Attendance counts marked days only. Days a coach had sessions but no mark are listed separately.</p>
      </div>
    </div>
  );
}
