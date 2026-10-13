"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { SPORTS, type SessionStatus, type Sport } from "@/lib/types";
import { addDays, bySchedule, isoWeekday, timeLabel, todayISO } from "@/lib/dates";
import { Icon } from "@/components/icons";
import {
  Card,
  Empty,
  SectionTitle,
  SportBadge,
  StatusTag,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

const STATUSES: (SessionStatus | "All")[] = ["All", "Done", "Pending", "Cancelled"];
const RANGES = { today: "Today", week: "This week", upcoming: "Upcoming", all: "All dates" } as const;
type Range = keyof typeof RANGES;

export default function SessionTracker() {
  const {
    sessions,
    schools,
    coachName,
    classById,
    schoolName,
    setSessionStatus,
    toast,
  } = useStore();

  const [schoolFilter, setSchoolFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "All">("All");
  const [sportFilter, setSportFilter] = useState<Sport | "All">("All");
  const [range, setRange] = useState<Range>("week");
  const today = todayISO();

  const rows = useMemo(() => {
    const weekStart = addDays(today, 1 - isoWeekday(today));
    const inRange = (date: string) =>
      range === "today" ? date === today
        : range === "week" ? date >= weekStart && date <= addDays(weekStart, 6)
          : range === "upcoming" ? date >= today
            : true;
    return [...sessions]
      .filter((s) => inRange(s.date))
      .sort(bySchedule)
      .map((s) => ({ s, cls: classById(s.classId) }))
      .filter(({ cls }) =>
        schoolFilter === "All" ? true : cls?.schoolId === schoolFilter
      )
      .filter(({ s }) =>
        statusFilter === "All" ? true : s.status === statusFilter
      )
      .filter(({ cls }) =>
        sportFilter === "All" ? true : cls?.sport === sportFilter
      );
  }, [sessions, range, today, schoolFilter, statusFilter, sportFilter, classById]);

  return (
    <div className="space-y-4">
      <SectionTitle icon="session">Session tracker</SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          aria-label="Filter by date"
          className="k-field w-auto"
        >
          {Object.entries(RANGES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          aria-label="Filter by school"
          className="k-field w-auto"
        >
          <option value="All">All schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value as Sport | "All")}
          aria-label="Filter by sport"
          className="k-field w-auto"
        >
          <option value="All">All sports</option>
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div role="group" aria-label="Filter by status" className="flex items-center gap-0.5 rounded-sm border border-line bg-elevated p-0.5">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              aria-pressed={statusFilter === st}
              className={`rounded-[1px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-klutch-field text-white"
                  : "text-muted hover:text-content"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <Th>School</Th>
            <Th>Class</Th>
            <Th>Sport</Th>
            <Th>Date</Th>
            <Th>Time</Th>
            <Th>Coach</Th>
            <Th>Week</Th>
            <Th>Status</Th>
            <Th>Update</Th>
          </THead>
          <tbody>
            {rows.map(({ s, cls }, i) => (
              <Tr key={s.id} i={i}>
                <Td className="font-semibold text-content">
                  {cls ? schoolName(cls.schoolId) : "—"}
                </Td>
                <Td>{cls?.className}</Td>
                <Td>{cls && <SportBadge sport={cls.sport} />}</Td>
                <Td className="font-mono text-[13px]">{s.date}</Td>
                <Td className="font-mono text-[13px]">{timeLabel(s.startTime) || "—"}</Td>
                <Td>{coachName(s.coachId)}</Td>
                <Td className="font-mono text-[13px]">Wk {s.curriculumWeek}</Td>
                <Td>
                  <StatusTag value={s.status} />
                </Td>
                <Td>
                  <select
                    value={s.status}
                    onChange={async (e) => {
                      const next = e.target.value as SessionStatus;
                      if (await setSessionStatus(s.id, next)) toast(`${cls?.className} marked ${next}`);
                    }}
                    aria-label={`Update status for ${cls?.className} on ${s.date}`}
                    className="rounded-sm border border-line bg-surface px-2 py-1 text-xs text-content"
                  >
                    <option>Done</option>
                    <option>Pending</option>
                    <option>Cancelled</option>
                  </select>
                </Td>
              </Tr>
            ))}
            {rows.length === 0 && (
              <Empty cols={9}>
                <span className="inline-flex items-center gap-2">
                  <Icon name="filter" size={15} /> No sessions match these
                  filters.
                </span>
              </Empty>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
