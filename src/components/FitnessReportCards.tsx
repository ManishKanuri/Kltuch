"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { analyzeFitnessStudent, FITNESS_METRICS } from "@/lib/stats";
import type { FitnessAssessment } from "@/lib/types";
import { Icon } from "./icons";
import { LogoMark } from "./Logo";
import { Card, SectionTitle, Table, Td, Th, THead, Tr } from "./ui";
import { downloadElementPdf } from "@/lib/pdf";

export default function FitnessReportCards() {
  const { fitnessAssessments, schools, schoolName } = useStore();
  const [query, setQuery] = useState("");
  const [schoolId, setSchoolId] = useState("all");
  const [reportFor, setReportFor] = useState<FitnessAssessment | null>(null);
  const records = useMemo(() => fitnessAssessments.filter((record) =>
    (schoolId === "all" || record.schoolId === schoolId) &&
    `${record.studentName} ${record.studentId}`.toLowerCase().includes(query.toLowerCase())
  ), [fitnessAssessments, query, schoolId]);
  const displayed = records.slice(0, 100);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle icon="assessment">CISCE Fitness Report Cards</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or student ID" className="k-field w-52" />
          <select value={schoolId} onChange={(event) => setSchoolId(event.target.value)} className="k-field w-40">
            <option value="all">All schools</option>
            {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
          </select>
        </div>
      </div>
      <p className="text-sm text-muted">
        {records.length.toLocaleString()} fitness records found. Showing the first {displayed.length}; use search to open any student’s report card.
      </p>
      <Card className="overflow-hidden">
        <Table>
          <THead><Th>Student</Th><Th>School</Th><Th>Class</Th><Th>Gender</Th><Th>Attendance</Th><Th>Sessions</Th><Th>Report</Th></THead>
          <tbody>{displayed.map((record, index) => (
            <Tr key={record.id} i={index}>
              <Td><div className="font-semibold text-content">{record.studentName}</div><div className="text-xs text-faint">{record.studentId}</div></Td>
              <Td>{schoolName(record.schoolId)}</Td>
              <Td>{record.className}</Td>
              <Td>{record.gender}</Td>
              <Td>{record.attendanceRate}%</Td>
              <Td>{record.sessionsFinished}/{record.sessionsScheduled}</Td>
              <Td><button onClick={() => setReportFor(record)} className="inline-flex items-center gap-1.5 rounded-lg border border-klutch-blue/40 px-2.5 py-1 text-xs font-semibold text-klutch-blue-bright transition hover:bg-klutch-blue/10"><Icon name="download" size={13} /> Report Card</button></Td>
            </Tr>
          ))}</tbody>
        </Table>
      </Card>
      {reportFor && <FitnessReportCard record={reportFor} onClose={() => setReportFor(null)} />}
    </div>
  );
}

function FitnessReportCard({ record, onClose }: { record: FitnessAssessment; onClose: () => void }) {
  const { fitnessAssessments, schoolName, toast } = useStore();
  const cohort = useMemo(() => fitnessAssessments.filter((candidate) => candidate.schoolId === record.schoolId && candidate.grade === record.grade), [fitnessAssessments, record]);
  const analysis = useMemo(() => analyzeFitnessStudent(record, cohort), [record, cohort]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  async function downloadPdf() {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const safeName = `${record.studentName}-${record.studentId}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      await downloadElementPdf(cardRef.current, `fitness-report-card-${safeName}.pdf`);
      toast("Fitness report card PDF downloaded");
    } catch {
      toast("Could not generate PDF — please try again");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div ref={cardRef} className="animate-fade-up scrollbar-thin max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative overflow-hidden bg-klutch-ink bg-sidebar-glow px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3"><LogoMark size={40} /><div><div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">CISCE Fitness Report Card</div><div className="font-display text-2xl font-extrabold">{record.studentName}</div><div className="mt-0.5 text-sm text-slate-400">{record.studentId} · {record.className} · {record.gender} · {schoolName(record.schoolId)}</div></div></div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close"><Icon name="x" size={18} /></button>
          </div>
        </div>
        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <Summary label="Profile" value={analysis.profile} sub={`${analysis.aboveAverage}/5 metrics at or better than cohort`} />
            <Summary label="Cohort" value={`Grade ${record.grade}`} sub={`${cohort.length} students at this school`} />
            <Summary label="BMI measurement" value={String(record.bmi)} sub="Recorded value — not a diagnosis" />
            <Summary label="Attendance" value={`${record.attendanceRate}%`} sub={`${record.sessionsFinished}/${record.sessionsScheduled} sessions finished`} />
          </div>
          <div><div className="mb-2 text-sm font-bold text-content">Fitness Breakdown</div><div className="space-y-3">{analysis.insights.map((item) => <div key={item.key} className="rounded-xl border border-line bg-elevated p-3"><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-content">{item.label}</span><span className="font-bold text-content">{item.value} {item.unit}</span></div><div className="mt-1 flex items-center justify-between text-xs"><span className="text-muted">School-grade average: {item.average} {item.unit}</span><span className={item.better ? "font-semibold text-emerald-500" : "font-semibold text-amber-500"}>{item.better ? "At / better than" : "Below"} cohort average</span></div></div>)}</div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InsightBox title="Strengths" tone="emerald" items={analysis.strengths.map((item) => item.label)} empty="Consistent profile across the current measures." />
            <InsightBox title="Focus for coaching" tone="amber" items={analysis.focus.map((item) => item.label)} empty="Continue maintaining the current all-round routine." />
          </div>
          <p className="rounded-xl border border-line bg-elevated p-3 text-xs leading-relaxed text-muted">This report compares fitness performance with students in the same school and grade. It supports sports coaching and is not medical advice. BMI requires age- and sex-specific percentile data before any clinical interpretation.</p>
          <div data-pdf-hide className="flex justify-end border-t border-line pt-4"><button onClick={downloadPdf} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60"><Icon name="download" size={15} /> {saving ? "Generating…" : "Download PDF"}</button></div>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className="rounded-xl border border-line bg-elevated p-4"><div className="text-[11px] uppercase tracking-wider text-faint">{label}</div><div className="mt-1 font-display text-lg font-bold text-content">{value}</div><div className="mt-1 text-xs text-muted">{sub}</div></div>; }
function InsightBox({ title, tone, items, empty }: { title: string; tone: "emerald" | "amber"; items: string[]; empty: string }) { const isGreen = tone === "emerald"; return <div className={`rounded-xl border p-4 ${isGreen ? "border-emerald-500/30 bg-emerald-500/8" : "border-amber-500/30 bg-amber-500/8"}`}><div className={`mb-2 text-sm font-bold ${isGreen ? "text-emerald-500" : "text-amber-500"}`}>{title}</div>{items.length ? <ul className="space-y-1 text-sm text-content">{items.map((item) => <li key={item} className="flex items-center gap-2"><Icon name={isGreen ? "check" : "target"} size={14} />{item}</li>)}</ul> : <p className="text-sm text-muted">{empty}</p>}</div>; }
