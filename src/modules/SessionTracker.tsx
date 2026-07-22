"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { SPORTS, type SessionStatus, type Sport } from "@/lib/types";
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

  const rows = useMemo(() => {
    return sessions
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
  }, [sessions, schoolFilter, statusFilter, sportFilter, classById]);

  return (
    <div className="space-y-4">
      <SectionTitle icon="session">Session Tracker</SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="k-field w-auto"
        >
          <option value="All">All Schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value as Sport | "All")}
          className="k-field w-auto"
        >
          <option value="All">All Sports</option>
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-full border border-line bg-elevated p-0.5">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-brand-gradient text-white"
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
            <Th>Coach</Th>
            <Th>Curr. Week</Th>
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
                <Td>{s.date}</Td>
                <Td>{coachName(s.coachId)}</Td>
                <Td>Wk {s.curriculumWeek}</Td>
                <Td>
                  <StatusTag value={s.status} />
                </Td>
                <Td>
                  <select
                    value={s.status}
                    onChange={(e) => {
                      setSessionStatus(s.id, e.target.value as SessionStatus);
                      toast(`${cls?.className} → ${e.target.value}`);
                    }}
                    className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-content"
                  >
                    <option>Done</option>
                    <option>Pending</option>
                    <option>Cancelled</option>
                  </select>
                </Td>
              </Tr>
            ))}
            {rows.length === 0 && (
              <Empty cols={8}>
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
