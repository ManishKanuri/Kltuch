"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { monthLabel, todayISO } from "@/lib/dates";
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
  StatGrid,
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
          <label htmlFor="school-select" className="text-sm font-semibold text-muted">School</label>
          <select
            id="school-select"
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
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
          <Icon name="school" size={14} className="text-accent" /> Shows this school’s data only
        </span>
      </div>

      <StatGrid cols={4}>
        <StatCard label="Classes" icon="curriculum" tone="blue" value={schoolClassIds.length} />
        <StatCard
          label="Sessions done"
          icon="check-circle"
          tone="tennis"
          value={`${doneCount}/${schoolSessions.length}`}
        />
        <StatCard
          label="Students assessed"
          icon="assessment"
          tone="orange"
          value={schoolAssessments.length}
        />
        <StatCard
          label="Average curriculum week"
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
      </StatGrid>

      {/* Tabs */}
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-hue-orange text-content"
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
              <Th>Week</Th>
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
                    <Td className="font-mono text-[13px]">{s.date}</Td>
                    <Td>{coachName(s.coachId)}</Td>
                    <Td className="font-mono text-[13px]">Wk {s.curriculumWeek}</Td>
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
                  <div className="font-mono text-sm font-bold text-accent">
                    Wk {cw.currentWeek}/{cw.totalWeeks}
                  </div>
                </div>
                <div className="mt-3">
                  <Meter value={pctVal} tone="blue" />
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
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-klutch-field text-white">
              <Icon name="download" size={20} />
            </div>
            <div>
              <div className="font-display text-[1.25rem] font-extrabold tracking-[-0.02em] text-content">
                {monthLabel(todayISO())} monthly report
              </div>
              <div className="text-sm text-muted">{schoolName(schoolId)}</div>
              <p className="mt-2 max-w-lg text-sm text-muted">
                A PDF summary of sessions delivered, cancellations, curriculum
                progress and student assessments.
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <MiniStat
              label="Sessions done"
              value={`${doneCount}/${schoolSessions.length}`}
            />
            <MiniStat label="Classes" value={schoolClassIds.length} />
            <MiniStat label="Students" value={schoolAssessments.length} />
          </div>
          <div className="mt-5">
            <PrimaryButton
              icon="download"
              onClick={() =>
                toast(`Monthly report for ${schoolName(schoolId)} generated (demo)`)
              }
            >
              Download monthly report
            </PrimaryButton>
          </div>
        </Card>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-surface p-3">
      <div className="text-[12.5px] font-medium text-muted">{label}</div>
      <div className="mt-1 font-display text-[1.5rem] font-black tracking-[-0.03em] text-content">{value}</div>
    </div>
  );
}
