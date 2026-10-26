"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { bucketOf, sessionClass } from "@/lib/analytics";
import { shortDay, todayISO } from "@/lib/dates";
import { HOLIDAYS, PROGRAMME, teachingWeek } from "@/lib/programme";
import type { Session } from "@/lib/types";
import { LessonLine, ReportDialog, timeRange, weekDates } from "@/components/session";
import { Icon } from "@/components/icons";
import { Card, Empty, OutlineButton, SportBadge, StatusTag, Table, Td, Th, THead, Tr } from "@/components/ui";

const STATUS_FILTERS = ["All", "Not reported", "Done", "Not Done", "Cancelled", "Postponed", "Still to come"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function Sessions() {
  const { sessions, coaches, coachName, updateSession, toast } = useStore();
  const today = todayISO();
  const weeksLoaded = useMemo(() => [...new Set(sessions.map((s) => s.teachingWeek))].sort((a, b) => a - b), [sessions]);
  const currentWeek = teachingWeek(today);
  const defaultWeek = String(currentWeek && weeksLoaded.includes(currentWeek) ? currentWeek : (weeksLoaded[0] ?? 1));

  const [week, setWeek] = useState(defaultWeek);
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [coachFilter, setCoachFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [reporting, setReporting] = useState<Session | null>(null);
  const [closing, setClosing] = useState(false);
  const [closureDate, setClosureDate] = useState("");

  const classes = useMemo(() => [...new Set(sessions.map(sessionClass))].sort(), [sessions]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions
      .filter((s) => week === "All" || s.teachingWeek === Number(week))
      .filter((s) => classFilter === "All" || sessionClass(s) === classFilter)
      .filter((s) => coachFilter === "All" || (coachFilter === "none" ? !s.coachId : s.coachId === coachFilter))
      .filter((s) => {
        if (statusFilter === "All") return true;
        if (statusFilter === "Not reported") return bucketOf(s, today) === "Not reported";
        if (statusFilter === "Still to come") return bucketOf(s, today) === "Upcoming";
        return s.status === statusFilter;
      })
      .filter((s) => !q || s.groupLabel.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.groupLabel.localeCompare(b.groupLabel));
  }, [sessions, week, classFilter, coachFilter, statusFilter, query, today]);

  async function markDone(s: Session) {
    if (await updateSession(s.id, { status: "Done" })) toast(`${s.groupLabel} on ${shortDay(s.date)} saved as Done`);
  }

  // A closure cancels every unreported session that day, with the reason set,
  // so the school's numbers show it was on their side.
  async function markClosure() {
    const day = sessions.filter((s) => s.date === closureDate && s.status === "Not reported");
    if (!closureDate) return toast("Pick the day the school was closed.");
    if (!day.length) return toast(`No unreported sessions on ${shortDay(closureDate)}.`);
    setClosing(true);
    const results = await Promise.all(
      day.map((s) => updateSession(s.id, { status: "Cancelled", reason: "School closed or holiday" }))
    );
    setClosing(false);
    const saved = results.filter(Boolean).length;
    if (saved) toast(`${saved} session${saved === 1 ? "" : "s"} on ${shortDay(closureDate)} marked Cancelled, school closed`);
    if (saved === day.length) setClosureDate("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={week} onChange={(e) => setWeek(e.target.value)} aria-label="Teaching week" className="k-field w-auto">
          <option value="All">All weeks</option>
          {weeksLoaded.map((w) => (
            <option key={w} value={w}>
              Week {w}, {weekDates(w)}
              {w === currentWeek ? " (this week)" : ""}
            </option>
          ))}
        </select>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} aria-label="Class" className="k-field w-auto">
          <option value="All">All classes</option>
          {classes.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Status"
          className="k-field w-auto"
        >
          {STATUS_FILTERS.map((st) => (
            <option key={st} value={st}>
              {st === "All" ? "Any status" : st}
            </option>
          ))}
        </select>
        <select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)} aria-label="Coach" className="k-field w-auto">
          <option value="All">All coaches</option>
          <option value="none">Unassigned</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Group or session ID"
          aria-label="Search sessions"
          className="k-field w-full sm:w-48"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          {shown.length} session{shown.length === 1 ? "" : "s"}
          {week !== "All" ? ` in week ${week}` : ""}. Sessions run to {shortDay(lastDate(sessions))}; add later weeks on the
          Timetable screen.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={closureDate}
            min={PROGRAMME.startDate}
            onChange={(e) => setClosureDate(e.target.value)}
            aria-label="Day the school was closed"
            className="k-field w-auto"
          />
          <OutlineButton onClick={markClosure}>{closing ? "Saving…" : "School closed this day"}</OutlineButton>
        </div>
      </div>

      <Card className="hidden overflow-hidden md:block">
        <Table>
          <THead>
            <Th>Date</Th>
            <Th>Time</Th>
            <Th>Group</Th>
            <Th>Sport and lesson</Th>
            <Th>Coach</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Report</span>
            </Th>
          </THead>
          <tbody>
            {shown.map((s, i) => (
              <Tr key={s.id} i={i}>
                <Td className="whitespace-nowrap">
                  {shortDay(s.date)}
                  {HOLIDAYS[s.date] && <div className="text-[11.5px] text-warn">{HOLIDAYS[s.date]}</div>}
                </Td>
                <Td className="whitespace-nowrap font-mono text-[12.5px]">
                  P{s.period} <span className="text-faint">{timeRange(s)}</span>
                </Td>
                <Td>
                  <div className="font-semibold text-content">{s.groupLabel}</div>
                  <div className="text-[12px] text-faint">{sessionClass(s)}</div>
                </Td>
                <Td>
                  <SportBadge sport={s.sport} />
                  <div className="mt-1 text-[13px]">
                    <LessonLine s={s} />
                  </div>
                </Td>
                <Td className={s.coachId ? "" : "text-faint"}>{coachName(s.coachId)}</Td>
                <Td>
                  <StatusTag value={bucketOf(s, today) === "Upcoming" ? "Upcoming" : s.status} />
                  {s.reason && <div className="mt-1 text-[12px] text-muted">{s.reason}</div>}
                </Td>
                <Td>
                  <RowActions s={s} today={today} onReport={() => setReporting(s)} onDone={() => markDone(s)} />
                </Td>
              </Tr>
            ))}
            {shown.length === 0 && <Empty cols={7}>No sessions match these filters.</Empty>}
          </tbody>
        </Table>
      </Card>

      {/* Phones: one card per session. */}
      <ul className="space-y-2 md:hidden">
        {shown.map((s) => (
          <li key={s.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-content">
                  {s.groupLabel} <span className="font-normal text-faint">{sessionClass(s)}</span>
                </div>
                <div className="mt-0.5 text-[12.5px] text-muted">
                  {shortDay(s.date)}, P{s.period} {timeRange(s)}
                </div>
              </div>
              <StatusTag value={bucketOf(s, today) === "Upcoming" ? "Upcoming" : s.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
              <SportBadge sport={s.sport} />
              <LessonLine s={s} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className={`text-[12.5px] ${s.coachId ? "text-muted" : "text-faint"}`}>{coachName(s.coachId)}</span>
              <RowActions s={s} today={today} onReport={() => setReporting(s)} onDone={() => markDone(s)} />
            </div>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-faint">No sessions match these filters.</li>
        )}
      </ul>

      {reporting && <ReportDialog session={reporting} admin onClose={() => setReporting(null)} />}
    </div>
  );
}

const lastDate = (sessions: Session[]) => sessions.reduce<string>((max, s) => (s.date > max ? s.date : max), PROGRAMME.startDate);

function RowActions({ s, today, onReport, onDone }: { s: Session; today: string; onReport: () => void; onDone: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {s.status === "Not reported" && s.date <= today && (
        <button
          onClick={onDone}
          aria-label={`Mark ${s.groupLabel} on ${shortDay(s.date)} as done`}
          title="Mark done"
          className="rounded-sm border border-line p-1.5 text-good transition-colors hover:border-good"
        >
          <Icon name="check" size={14} strokeWidth={2.4} />
        </button>
      )}
      <button
        onClick={onReport}
        aria-label={`Report ${s.groupLabel} on ${shortDay(s.date)}`}
        className="whitespace-nowrap rounded-sm border border-line px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent"
      >
        {s.status === "Not reported" ? "Report" : "Edit"}
      </button>
    </div>
  );
}
