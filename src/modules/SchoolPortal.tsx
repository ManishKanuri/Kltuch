"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { SKILL_LABELS, type SkillKey } from "@/lib/types";
import { Icon, type IconName } from "@/components/icons";
import {
  Card,
  Empty,
  Meter,
  PrimaryButton,
  RatingPill,
  SportBadge,
  StatCard,
  StatusTag,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

const TABS: { key: string; icon: IconName }[] = [
  { key: "Sessions", icon: "session" },
  { key: "Curriculum", icon: "curriculum" },
  { key: "Students", icon: "assessment" },
  { key: "Report", icon: "download" },
];
const SKILLS: SkillKey[] = ["motorSkills", "coordination", "fitness", "attitude"];

export default function SchoolPortal() {
  const {
    schools,
    currentSchoolId,
    setCurrentSchoolId,
    sessions,
    classes,
    curriculum,
    assessments,
    coachName,
    classById,
    schoolName,
    toast,
  } = useStore();

  const [tab, setTab] = useState("Sessions");
  const schoolId = currentSchoolId;

  const schoolClassIds = useMemo(
    () => classes.filter((c) => c.schoolId === schoolId).map((c) => c.id),
    [classes, schoolId]
  );
  const schoolSessions = sessions.filter((s) =>
    schoolClassIds.includes(s.classId)
  );
  const schoolCurriculum = curriculum.filter((c) =>
    schoolClassIds.includes(c.classId)
  );
  const schoolAssessments = assessments.filter((a) =>
    schoolClassIds.includes(a.classId)
  );
  const doneCount = schoolSessions.filter((s) => s.status === "Done").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted">Viewing:</span>
          <select
            value={schoolId}
            onChange={(e) => setCurrentSchoolId(e.target.value)}
            className="k-field w-auto font-semibold"
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-klutch-blue/10 px-3 py-1 text-xs font-semibold text-klutch-blue-bright">
          <Icon name="school" size={13} /> Scoped to own data only
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Classes" icon="curriculum" tone="blue" value={schoolClassIds.length} />
        <StatCard
          label="Sessions Done"
          icon="check-circle"
          tone="tennis"
          value={`${doneCount}/${schoolSessions.length}`}
        />
        <StatCard
          label="Students Assessed"
          icon="assessment"
          tone="orange"
          value={schoolAssessments.length}
        />
        <StatCard
          label="Avg Curriculum Wk"
          icon="target"
          tone="neutral"
          value={
            schoolCurriculum.length
              ? Math.round(
                  schoolCurriculum.reduce((s, c) => s + c.currentWeek, 0) /
                    schoolCurriculum.length
                )
              : 0
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.key
                ? "border-klutch-orange text-content"
                : "border-transparent text-faint hover:text-content"
            }`}
          >
            <Icon name={t.icon} size={16} />
            {t.key}
          </button>
        ))}
      </div>

      {tab === "Sessions" && (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <Th>Class</Th>
              <Th>Sport</Th>
              <Th>Date</Th>
              <Th>Coach</Th>
              <Th>Curr. Week</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {schoolSessions.map((s, i) => {
                const cls = classById(s.classId);
                return (
                  <Tr key={s.id} i={i}>
                    <Td className="font-semibold text-content">
                      {cls?.className}
                    </Td>
                    <Td>{cls && <SportBadge sport={cls.sport} />}</Td>
                    <Td>{s.date}</Td>
                    <Td>{coachName(s.coachId)}</Td>
                    <Td>Wk {s.curriculumWeek}</Td>
                    <Td>
                      <StatusTag value={s.status} />
                    </Td>
                  </Tr>
                );
              })}
              {schoolSessions.length === 0 && (
                <Empty cols={6}>No sessions for this school.</Empty>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === "Curriculum" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {schoolCurriculum.map((cw) => {
            const cls = classById(cw.classId);
            const pctVal = Math.round((cw.currentWeek / cw.totalWeeks) * 100);
            return (
              <Card key={cw.classId} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-content">
                    {cls?.className}
                    {cls && <SportBadge sport={cls.sport} showLabel={false} />}
                  </div>
                  <div className="text-sm font-bold text-klutch-blue-bright">
                    Wk {cw.currentWeek}/{cw.totalWeeks}
                  </div>
                </div>
                <div className="mt-3">
                  <Meter value={pctVal} tone="gradient" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "Students" && (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <Th>Student</Th>
              <Th>Class</Th>
              {SKILLS.map((sk) => (
                <Th key={sk}>{SKILL_LABELS[sk]}</Th>
              ))}
              <Th>Term</Th>
            </THead>
            <tbody>
              {schoolAssessments.map((a, i) => (
                <Tr key={a.id} i={i}>
                  <Td className="font-semibold text-content">{a.studentName}</Td>
                  <Td>{classById(a.classId)?.className}</Td>
                  {SKILLS.map((sk) => (
                    <Td key={sk}>
                      <RatingPill n={a.ratings[sk]} />
                    </Td>
                  ))}
                  <Td>{a.term}</Td>
                </Tr>
              ))}
              {schoolAssessments.length === 0 && (
                <Empty cols={7}>
                  No student assessments recorded for this school yet.
                </Empty>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === "Report" && (
        <Card className="p-6">
          <div className="rounded-2xl border border-dashed border-klutch-blue/40 bg-brand-gradient-soft p-6 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-brand">
              <Icon name="download" size={22} />
            </div>
            <div className="font-display text-lg font-bold text-content">
              Monthly Report — {schoolName(schoolId)}
            </div>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              Auto-generated PDF summarizing sessions delivered, cancellations,
              curriculum progress, and student assessment summaries for June
              2025.
            </p>
            <div className="mt-4 flex justify-center">
              <PrimaryButton
                icon="download"
                onClick={() =>
                  toast(`Monthly report for ${schoolName(schoolId)} generated (demo)`)
                }
              >
                Download Monthly Report (PDF)
              </PrimaryButton>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-left">
              <MiniStat
                label="Sessions Done"
                value={`${doneCount}/${schoolSessions.length}`}
              />
              <MiniStat label="Classes" value={schoolClassIds.length} />
              <MiniStat label="Students" value={schoolAssessments.length} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="text-[11px] uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className="font-display text-xl font-bold text-content">{value}</div>
    </div>
  );
}
