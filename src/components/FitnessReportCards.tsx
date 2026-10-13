"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { analyzeFitnessStudent, fitnessStatusWord } from "@/lib/stats";
import type { FitnessAssessment } from "@/lib/types";
import { Icon } from "./icons";
import { LogoMark } from "./Logo";
import { Card, Modal, PrimaryButton, SectionTitle, Table, Td, Th, THead, Tr } from "./ui";
import { downloadElementPdf } from "@/lib/pdf";

// Bar fills use the site's on-dark variants; the status word itself stays
// neutral (as on the site) so meaning never rides on color alone.
const STATUS_BAR_COLOR: Record<string, string> = {
  Excelling: "bg-klutch-lime-bright",
  "On track": "bg-klutch-blue-bright",
  Developing: "bg-klutch-orange-bright",
};

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
        <SectionTitle icon="assessment">CISCE fitness report cards</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or student ID" aria-label="Search students" className="k-field w-52" />
          <select value={schoolId} onChange={(event) => setSchoolId(event.target.value)} aria-label="Filter by school" className="k-field w-40">
            <option value="all">All schools</option>
            {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
          </select>
        </div>
      </div>
      <p className="text-sm text-muted">
        {records.length.toLocaleString()} fitness records found. Showing the first {displayed.length}; search to open any student’s report card.
      </p>
      <Card className="overflow-hidden">
        <Table>
          <THead><Th>Student</Th><Th>School</Th><Th>Class</Th><Th>Gender</Th><Th>Attendance</Th><Th>Sessions</Th><Th>Report</Th></THead>
          <tbody>{displayed.map((record, index) => (
            <Tr key={record.id} i={index}>
              <Td><div className="font-semibold text-content">{record.studentName}</div><div className="font-mono text-[11px] text-faint">{record.studentId}</div></Td>
              <Td>{schoolName(record.schoolId)}</Td>
              <Td>{record.className}</Td>
              <Td>{record.gender}</Td>
              <Td className="font-mono">{record.attendanceRate}%</Td>
              <Td className="font-mono">{record.sessionsFinished}/{record.sessionsScheduled}</Td>
              <Td>
                <button onClick={() => setReportFor(record)} className="inline-flex items-center gap-1.5 rounded-sm border border-line px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/[0.06]">
                  <Icon name="download" size={13} /> Report card
                </button>
              </Td>
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
      toast("Could not generate the PDF. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal ref={cardRef} onClose={onClose} className="max-w-2xl">
      <ReportHeader
        eyebrow="CISCE fitness report card"
        name={record.studentName}
        meta={[record.studentId, record.className, record.gender, schoolName(record.schoolId)]}
        onClose={onClose}
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
          <SummaryCell label="Profile" value={analysis.profile} sub={`${analysis.aboveAverage} of 5 metrics at or above cohort`} />
          <SummaryCell label="Cohort" value={`Grade ${record.grade}`} sub={`${cohort.length} students at this school`} />
          <SummaryCell label="BMI measurement" value={String(record.bmi)} sub="Recorded value, not a diagnosis" />
          <SummaryCell label="Attendance" value={`${record.attendanceRate}%`} sub={`${record.sessionsFinished} of ${record.sessionsScheduled} sessions finished`} />
        </div>

        <div className="rounded-lg bg-klutch-ink p-6 text-white dark:ring-1 dark:ring-white/[0.07]">
          <div className="mb-5 font-display text-base font-extrabold tracking-[-0.02em]">Fitness breakdown</div>
          <div className="space-y-5">
            {analysis.insights.map((item) => {
              const status = fitnessStatusWord(item.better, item.relative);
              const fillPct = Math.max(8, Math.min(100, 50 + (item.better ? 1 : -1) * item.relative));
              return (
                <div key={item.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-semibold">{item.label}</span>
                    <span className="font-mono text-[15px] font-bold tabular-nums">
                      {item.value} <span className="text-[12px] font-medium text-white/60">{item.unit}</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.18]">
                    <div
                      className={`h-full origin-left rounded-full ${STATUS_BAR_COLOR[status]} animate-grow-bar`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.13em]">
                    <span className="font-medium text-white/[0.62]">{status}</span>
                    <span className="normal-case tracking-normal text-white/50">cohort avg {item.average} {item.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          <InsightCell title="Strengths" marker="bg-hue-lime" items={analysis.strengths.map((item) => item.label)} empty="Consistent profile across the current measures." />
          <InsightCell title="Focus for coaching" marker="bg-hue-orange" items={analysis.focus.map((item) => item.label)} empty="Continue the current all-round routine." />
        </div>

        <p className="border-t border-line pt-4 text-[12.5px] leading-relaxed text-faint">
          This report compares fitness performance with students in the same school and grade. It supports sports coaching and is not medical advice. BMI needs age- and sex-specific percentile data before any clinical interpretation.
        </p>

        <div data-pdf-hide className="flex justify-end">
          <PrimaryButton icon="download" onClick={downloadPdf} disabled={saving}>
            {saving ? "Generating…" : "Download PDF"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

// Shared by both report cards: the brand's field-blue band, the student's
// name in the site's heavy display type, and the facts in mono.
export function ReportHeader({
  eyebrow,
  name,
  meta,
  onClose,
  children,
}: {
  eyebrow: string;
  name: string;
  meta: string[];
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-klutch-field px-6 py-5 text-white">
      <div
        aria-hidden
        className="court-lines pointer-events-none absolute -right-44 -top-10 h-[260px] w-[420px] opacity-[0.14]"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <LogoMark size={38} className="mt-1 shrink-0" />
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">{eyebrow}</div>
            <div className="mt-1 font-display text-[1.875rem] font-black uppercase leading-[0.95] tracking-[-0.03em]">
              {name}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-white/75">
              {meta.filter(Boolean).map((item) => <span key={item}>{item}</span>)}
              {children}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          data-pdf-hide
          className="rounded-sm p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <Icon name="x" size={18} />
        </button>
      </div>
    </div>
  );
}

function SummaryCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="text-[12.5px] font-medium text-muted">{label}</div>
      <div className="mt-1.5 font-display text-[1.0625rem] font-extrabold leading-snug tracking-[-0.015em] text-content">{value}</div>
      <div className="mt-1 text-[12px] leading-snug text-muted">{sub}</div>
    </div>
  );
}

function InsightCell({ title, marker, items, empty }: { title: string; marker: string; items: string[]; empty: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="mb-2.5 font-display text-[15px] font-extrabold tracking-[-0.015em] text-content">{title}</div>
      {items.length ? (
        <ul className="space-y-1.5 text-sm text-content">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <span className={`h-[7px] w-[7px] shrink-0 rounded-[1px] ${marker}`} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}
