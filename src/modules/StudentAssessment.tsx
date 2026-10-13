"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { analyzeStudent, skillStatusWord } from "@/lib/stats";
import { SKILL_LABELS, type Assessment, type SkillKey } from "@/lib/types";
import { Icon } from "@/components/icons";
import { LogoMark } from "@/components/Logo";
import FitnessReportCards from "@/components/FitnessReportCards";
import { downloadElementPdf } from "@/lib/pdf";
import {
  Card,
  Modal,
  PrimaryButton,
  RatingPill,
  SectionTitle,
  SportBadge,
  StarRating,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

const SKILL_STATUS_BAR_COLOR: Record<string, string> = {
  Excelling: "bg-klutch-tennis",
  "On track": "bg-klutch-blue-bright",
  Developing: "bg-klutch-orange",
};
const SKILL_STATUS_TEXT_COLOR: Record<string, string> = {
  Excelling: "text-klutch-tennis",
  "On track": "text-klutch-blue-bright",
  Developing: "text-klutch-orange-bright",
};

const SKILLS: SkillKey[] = ["motorSkills", "coordination", "fitness", "attitude"];
const emptyRatings = (): Record<SkillKey, number> => ({
  motorSkills: 3,
  coordination: 3,
  fitness: 3,
  attitude: 3,
});

export default function StudentAssessment() {
  const { assessments, classes, addAssessment, updateAssessment, toast } =
    useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  // classes loads asynchronously from Supabase — starts empty, so this can't
  // read classes[0] synchronously. Synced once real data arrives below.
  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [ratings, setRatings] = useState<Record<SkillKey, number>>(
    emptyRatings()
  );
  const [reportFor, setReportFor] = useState<Assessment | null>(null);

  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0].id);
  }, [classId, classes]);

  function submit() {
    if (!name.trim()) return;
    addAssessment({
      studentName: name.trim(),
      classId,
      term,
      ratings,
      date: "2025-06-02",
    });
    toast(`Assessment saved for ${name.trim()}`);
    setName("");
    setRatings(emptyRatings());
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon="assessment"
        right={
          <PrimaryButton icon="plus" onClick={() => setOpen((v) => !v)}>
            Add Assessment
          </PrimaryButton>
        }
      >
        Student Assessment
      </SectionTitle>

      {open && (
        <Card className="animate-fade-up p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student name"
              className="k-field"
            />
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="k-field"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className} · {c.sport}
                </option>
              ))}
            </select>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="k-field"
            >
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SKILLS.map((sk) => (
              <div key={sk} className="rounded-xl border border-line p-3">
                <div className="text-xs font-semibold text-muted">
                  {SKILL_LABELS[sk]}
                </div>
                <div className="mt-1">
                  <StarRating
                    value={ratings[sk]}
                    size={20}
                    onChange={(v) => setRatings((r) => ({ ...r, [sk]: v }))}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <PrimaryButton icon="check" onClick={submit}>
              Save Assessment
            </PrimaryButton>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <Th>Student</Th>
            <Th>Class</Th>
            <Th>Sport</Th>
            {SKILLS.map((sk) => (
              <Th key={sk}>{SKILL_LABELS[sk]}</Th>
            ))}
            <Th>Term</Th>
            <Th>Report</Th>
          </THead>
          <tbody>
            {assessments.map((a, i) => {
              const cls = classes.find((c) => c.id === a.classId);
              return (
                <Tr key={a.id} i={i}>
                  <Td className="font-semibold text-content">{a.studentName}</Td>
                  <Td>{cls?.className}</Td>
                  <Td>{cls && <SportBadge sport={cls.sport} />}</Td>
                  {SKILLS.map((sk) => (
                    <Td key={sk}>
                      <RatingPill n={a.ratings[sk]} />
                    </Td>
                  ))}
                  <Td className="text-muted">{a.term}</Td>
                  <Td>
                    <button
                      onClick={() => setReportFor(a)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-klutch-blue/40 px-2.5 py-1 text-xs font-semibold text-klutch-blue-bright transition hover:bg-klutch-blue/10"
                    >
                      <Icon name="download" size={13} />
                      Report Card
                    </button>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <FitnessReportCards />

      {reportFor && (
        <ReportCard
          a={reportFor}
          onClose={() => setReportFor(null)}
          onSave={(r) => {
            updateAssessment(reportFor.id, r);
            toast(`${reportFor.studentName}'s report card updated`);
            setReportFor(null);
          }}
        />
      )}
    </div>
  );
}

function ReportCard({
  a,
  onClose,
  onSave,
}: {
  a: Assessment;
  onClose: () => void;
  onSave: (r: Record<SkillKey, number>) => void;
}) {
  const { classes, assessments, schoolName, toast } = useStore();
  const cls = classes.find((c) => c.id === a.classId);
  const [r, setR] = useState<Record<SkillKey, number>>(a.ratings);

  // live analysis against classmates
  const analysis = useMemo(() => {
    const classmates = assessments.filter((x) => x.classId === a.classId);
    return analyzeStudent({ ...a, ratings: r }, classmates);
  }, [a, r, assessments]);

  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  async function downloadPdf() {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const safeName = `${a.studentName}-${a.term}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      await downloadElementPdf(cardRef.current, `report-card-${safeName}.pdf`);
      toast("Report card PDF downloaded");
    } catch {
      toast("Could not generate PDF — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal ref={cardRef} onClose={onClose} className="max-w-2xl">
        {/* Header */}
        <div className="relative overflow-hidden bg-klutch-ink bg-sidebar-glow px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <LogoMark size={40} />
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Player Report Card
                </div>
                <div className="font-display text-2xl font-extrabold">
                  {a.studentName}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-400">
                  {cls?.className} · {a.term}
                  {cls && <SportBadge sport={cls.sport} />}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Overall grade + comparison */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-elevated p-4 text-center">
              <div className="text-[11px] uppercase tracking-wider text-faint">
                Overall Grade
              </div>
              <div className="font-display text-4xl font-extrabold text-gradient">
                {analysis.grade}
              </div>
              <div className="text-sm text-muted">{analysis.overall} / 5</div>
            </div>
            <div className="rounded-xl border border-line bg-elevated p-4">
              <div className="text-[11px] uppercase tracking-wider text-faint">
                Vs. Class Average
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Icon
                  name={analysis.aheadOfClass ? "trend-up" : "trend-down"}
                  size={22}
                  className={
                    analysis.aheadOfClass ? "text-emerald-500" : "text-amber-500"
                  }
                />
                <span className="font-display text-2xl font-bold text-content">
                  {analysis.classOverall}
                </span>
                <span className="text-xs text-faint">class avg</span>
              </div>
              <div
                className={`mt-1 text-xs font-medium ${
                  analysis.aheadOfClass ? "text-emerald-500" : "text-amber-500"
                }`}
              >
                {analysis.aheadOfClass ? "Above" : "Below"} class average
              </div>
            </div>
            <div className="rounded-xl border border-line bg-elevated p-4">
              <div className="text-[11px] uppercase tracking-wider text-faint">
                School
              </div>
              <div className="mt-1 font-semibold text-content">
                {cls ? schoolName(cls.schoolId) : "—"}
              </div>
              <div className="mt-1 text-xs text-faint">Assessed {a.date}</div>
            </div>
          </div>

          {/* Per-skill comparison bars */}
          <div className="overflow-hidden rounded-2xl bg-klutch-ink p-5 text-white">
            <div className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-slate-400">
              Skill Breakdown
            </div>
            <div className="space-y-4">
              {analysis.insights.map((ins) => {
                const status = skillStatusWord(r[ins.skill]);
                return (
                  <div key={ins.skill}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-white">
                        {SKILL_LABELS[ins.skill]}
                      </span>
                      <span className="flex items-center gap-2">
                        <StarRating
                          value={r[ins.skill]}
                          onChange={(v) =>
                            setR((p) => ({ ...p, [ins.skill]: v }))
                          }
                        />
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full origin-left rounded-full ${SKILL_STATUS_BAR_COLOR[status]} animate-grow-bar`}
                        style={{ width: `${(r[ins.skill] / 5) * 100}%` }}
                      />
                      <div
                        className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-white/50"
                        style={{ left: `${(ins.classAvg / 5) * 100}%` }}
                        title={`Class avg ${ins.classAvg}`}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className={`font-semibold uppercase tracking-wide ${SKILL_STATUS_TEXT_COLOR[status]}`}>
                        {status}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500">
                        class avg {ins.classAvg} <DeltaChip delta={ins.delta} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-500">
                <Icon name="trophy" size={16} /> Strengths
              </div>
              {analysis.strengths.length ? (
                <ul className="space-y-1 text-sm text-content">
                  {analysis.strengths.map((s) => (
                    <li key={s.skill} className="flex items-center gap-2">
                      <Icon name="check" size={14} className="text-emerald-500" />
                      {SKILL_LABELS[s.skill]} ({s.score}/5)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  Consistent across all skills — keep it up.
                </p>
              )}
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-500">
                <Icon name="target" size={16} /> Focus Areas
              </div>
              {analysis.focus.length ? (
                <ul className="space-y-1 text-sm text-content">
                  {analysis.focus.map((s) => (
                    <li key={s.skill} className="flex items-center gap-2">
                      <Icon name="chevron-right" size={14} className="text-amber-500" />
                      {SKILL_LABELS[s.skill]} ({s.score}/5)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  No weak areas — strong all-round performance.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
            <p className="text-[11px] text-faint">
              Auto-generated · downloads a PDF snapshot of this report card.
            </p>
            <div data-pdf-hide className="flex gap-2">
              <button
                onClick={downloadPdf}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium text-content transition hover:border-klutch-blue-bright disabled:opacity-60"
              >
                <Icon name="download" size={15} /> {saving ? "Generating…" : "PDF"}
              </button>
              <PrimaryButton icon="check" onClick={() => onSave(r)}>
                Save Report
              </PrimaryButton>
            </div>
          </div>
        </div>
    </Modal>
  );
}

function DeltaChip({ delta }: { delta: number }) {
  if (delta === 0)
    return <span className="text-xs font-medium text-faint">=avg</span>;
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        up ? "text-emerald-500" : "text-amber-500"
      }`}
    >
      <Icon name={up ? "trend-up" : "trend-down"} size={12} />
      {up ? "+" : ""}
      {delta}
    </span>
  );
}
