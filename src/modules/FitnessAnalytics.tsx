"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { FITNESS_METRICS, fitnessAverages, fitnessLeaderboard, mean } from "@/lib/stats";
import type { FitnessAssessment } from "@/lib/types";
import { Card, Meter, SectionTitle, StatCard, StatGrid, Table, Td, Th, THead, Tr } from "@/components/ui";

type SummaryRow = { label: string; students: number; speed: number; stamina: number; pushUps: number; attendance: number; finished: number; missed: number };
type AgeMetricRow = { age: number; students: number; values: ReturnType<typeof fitnessAverages> };

function summary(label: string, records: FitnessAssessment[]): SummaryRow {
  const averages = fitnessAverages(records);
  return {
    label,
    students: records.length,
    speed: averages.speed50mSeconds,
    stamina: averages.stamina600mSeconds,
    pushUps: averages.pushUps,
    attendance: mean(records.map((record) => record.attendanceRate)),
    finished: records.reduce((sum, record) => sum + record.sessionsFinished, 0),
    missed: records.reduce((sum, record) => sum + record.sessionsMissed, 0),
  };
}

export default function FitnessAnalytics() {
  const { fitnessAssessments, schools, schoolName } = useStore();
  const [schoolId, setSchoolId] = useState("all");
  const [grade, setGrade] = useState("all");
  const [gender, setGender] = useState("all");
  const records = useMemo(() => fitnessAssessments.filter((record) =>
    (schoolId === "all" || record.schoolId === schoolId) &&
    (grade === "all" || record.grade === Number(grade)) &&
    (gender === "all" || record.gender === gender)
  ), [fitnessAssessments, schoolId, grade, gender]);
  const averages = useMemo(() => fitnessAverages(records), [records]);
  const grades = useMemo(() => [...new Set(fitnessAssessments.map((record) => record.grade))].sort((a, b) => a - b), [fitnessAssessments]);
  const totalFinished = useMemo(() => records.reduce((sum, record) => sum + record.sessionsFinished, 0), [records]);
  const totalMissed = useMemo(() => records.reduce((sum, record) => sum + record.sessionsMissed, 0), [records]);
  const attendance = useMemo(() => mean(records.map((record) => record.attendanceRate)), [records]);
  const bySection = useMemo(() => ["A", "B", "C"].map((section) => summary(`Section ${section}`, records.filter((record) => record.section === section))).filter((row) => row.students), [records]);
  const byClass = useMemo(() => [...new Set(records.map((record) => record.className))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((className) => summary(className, records.filter((record) => record.className === className))), [records]);
  const byAge = useMemo(() => [...new Set(records.map((record) => record.age))].sort((a, b) => a - b).map((age) => summary(`${age} years`, records.filter((record) => record.age === age))), [records]);
  const ageMetricRows = useMemo<AgeMetricRow[]>(() => [...new Set(records.map((record) => record.age))].sort((a, b) => a - b).map((age) => {
    const group = records.filter((record) => record.age === age);
    return { age, students: group.length, values: fitnessAverages(group) };
  }), [records]);
  const byGender = useMemo(() => ["Female", "Male"].map((value) => summary(value, records.filter((record) => record.gender === value))).filter((row) => row.students), [records]);
  const best = useMemo(() => fitnessLeaderboard(records), [records]);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <SectionTitle icon="analytics">Cohort overview</SectionTitle>
      <div className="flex flex-wrap gap-2">
        <select value={schoolId} onChange={(event) => setSchoolId(event.target.value)} aria-label="Filter by school" className="k-field w-40"><option value="all">All schools</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select>
        <select value={grade} onChange={(event) => setGrade(event.target.value)} aria-label="Filter by grade" className="k-field w-32"><option value="all">All grades</option>{grades.map((value) => <option key={value} value={value}>Grade {value}</option>)}</select>
        <select value={gender} onChange={(event) => setGender(event.target.value)} aria-label="Filter by gender" className="k-field w-32"><option value="all">All genders</option><option>Female</option><option>Male</option></select>
      </div>
    </div>

    <StatGrid cols={4}>
      <StatCard label="Students assessed" icon="assessment" tone="blue" value={records.length.toLocaleString()} sub="Fitness baseline recorded" />
      <StatCard label="Attendance" icon="attendance" tone="tennis" value={`${attendance}%`} sub="Across scheduled sessions" />
      <StatCard label="Sessions finished" icon="check-circle" tone="blue" value={totalFinished.toLocaleString()} sub="Student session completions" />
      <StatCard label="Sessions missed" icon="cancel" tone="orange" value={totalMissed.toLocaleString()} sub="Needs an attendance follow-up" />
    </StatGrid>

    <div className="grid gap-6 lg:grid-cols-2">
      <div><SectionTitle icon="assessment">Cohort fitness averages</SectionTitle><Card className="space-y-4 p-5">{FITNESS_METRICS.map((metric) => {
        const value = averages[metric.key];
        const max = metric.key === "stamina600mSeconds" ? 600 : metric.key === "speed50mSeconds" ? 20 : metric.key === "toeTouchCm" ? 30 : 60;
        return <div key={metric.key}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium text-content">{metric.label}</span><span className="font-mono font-bold text-accent">{value} {metric.unit}</span></div><Meter value={Math.min(100, Math.max(0, (value / max) * 100))} tone="blue" /></div>;
      })}</Card></div>
      <div><SectionTitle icon="target">Interpretation</SectionTitle><Card className="space-y-3 p-5 text-sm text-muted"><p><span className="font-semibold text-content">Fair comparison:</span> tables are filterable by school, grade, and gender. Student report cards compare with their school-grade cohort.</p><p><span className="font-semibold text-content">Performance:</span> lower times are better for 50m and 600m; higher values are better for flexibility, push-ups, and curls.</p><p><span className="font-semibold text-content">BMI:</span> a measurement only. Adult BMI categories don’t apply to children.</p><p><span className="font-semibold text-content">Attendance:</span> missed sessions identify where a coach or school follow-up may help.</p></Card></div>
    </div>

    <SummaryTable title="By section" rows={bySection} />
    <SummaryTable title="By class" rows={byClass} limit={24} />
    <div className="grid gap-6 xl:grid-cols-2"><SummaryTable title="By age" rows={byAge} /><SummaryTable title="By gender" rows={byGender} /></div>
    <AgeGroupCharts rows={ageMetricRows} />

    <div><SectionTitle icon="trophy">Best all-round performers</SectionTitle><Card className="overflow-hidden"><Table><THead><Th>Rank</Th><Th>Student</Th><Th>Class</Th><Th>Gender</Th><Th>All-round score</Th><Th>Attendance</Th></THead><tbody>{best.map(({ student, score }, index) => <Tr key={student.id} i={index}><Td><span className={`inline-flex h-6 w-6 items-center justify-center rounded-sm font-mono text-xs font-bold ${index === 0 ? "bg-hue-lime text-klutch-ink" : "bg-content/[0.07] text-muted"}`}>{index + 1}</span></Td><Td><div className="font-semibold text-content">{student.studentName}</div><div className="font-mono text-[11px] text-faint">{student.studentId}</div></Td><Td>{student.className}</Td><Td>{student.gender}</Td><Td className="font-mono font-bold text-content">{score}/100</Td><Td>{student.attendanceRate}%</Td></Tr>)}</tbody></Table></Card><p className="mt-2 text-xs text-faint">All-round score is a non-clinical, age-and-gender peer-normalised score across the five fitness tests.</p></div>
    {schoolId !== "all" && <p className="text-xs text-faint">Showing {schoolName(schoolId)} data only.</p>}
  </div>;
}

function SummaryTable({ title, rows, limit }: { title: string; rows: SummaryRow[]; limit?: number }) {
  const shown = limit ? rows.slice(0, limit) : rows;
  return <div><SectionTitle icon="analytics">{title}</SectionTitle><Card className="overflow-hidden"><Table><THead><Th>Group</Th><Th>Students</Th><Th>50m</Th><Th>600m</Th><Th>Push-ups</Th><Th>Attendance</Th><Th>Finished</Th><Th>Missed</Th></THead><tbody>{shown.map((row, index) => <Tr key={row.label} i={index}><Td className="font-semibold text-content">{row.label}</Td><Td>{row.students}</Td><Td>{row.speed}s</Td><Td>{row.stamina}s</Td><Td>{row.pushUps}</Td><Td>{row.attendance}%</Td><Td>{row.finished}</Td><Td>{row.missed}</Td></Tr>)}</tbody></Table></Card>{limit && rows.length > limit && <p className="mt-2 text-xs text-faint">Showing the first {limit} classes for the selected filters.</p>}</div>;
}

function AgeGroupCharts({ rows }: { rows: AgeMetricRow[] }) {
  return <div><SectionTitle icon="analytics">Fitness by age group</SectionTitle><div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{FITNESS_METRICS.map((metric) => {
    const values = rows.map((row) => row.values[metric.key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return <Card key={metric.key} className="p-4"><div className="flex items-baseline justify-between"><h3 className="font-display text-[15px] font-extrabold tracking-[-0.015em] text-content">{metric.label}</h3><span className="text-xs text-faint">{metric.higherIsBetter ? "Higher is better" : "Lower is better"}</span></div><div className="mt-5 flex h-40 items-end gap-1.5 border-b border-line pb-1">{rows.map((row) => {
      const value = row.values[metric.key];
      const ratio = max === min ? 0.6 : metric.higherIsBetter ? (value - min) / (max - min) : (max - value) / (max - min);
      return <div key={row.age} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="invisible font-mono text-[9px] font-semibold text-content group-hover:visible">{value}</span><div className="w-full min-w-2 rounded-t-sm bg-hue-blue transition-opacity group-hover:opacity-80" style={{ height: `${18 + ratio * 102}px` }} title={`Age ${row.age}: ${value} ${metric.unit}`} /><span className="font-mono text-[10px] text-faint">{row.age}</span></div>;
    })}</div><p className="mt-2 text-[11px] text-faint">Age in years. Hover a bar for the group average in {metric.unit}.</p></Card>;
  })}</div></div>;
}
