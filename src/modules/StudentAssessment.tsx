"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/dates";
import { analyzeStudent, skillStatusWord } from "@/lib/stats";
import { SKILL_LABELS, type Assessment, type SkillKey } from "@/lib/types";
import { Icon } from "@/components/icons";
import FitnessReportCards, { ReportHeader } from "@/components/FitnessReportCards";
import { downloadElementPdf } from "@/lib/pdf";
import {
  Card,
  Modal,
  OutlineButton,
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

// On-dark bar fills (the report panel is fixed navy in both themes).
const SKILL_STATUS_BAR_COLOR: Record<string, string> = {
  Excelling: "bg-klutch-lime-bright",
  "On track": "bg-klutch-blue-bright",
  Developing: "bg-klutch-orange-bright",
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
      date: todayISO(),
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
            Add assessment
          </PrimaryButton>
        }
      >
        Skill assessments
      </SectionTitle>

      {open && (
        <Card className="animate-fade-up p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student name"
              aria-label="Student name"
              className="k-field"
            />
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              aria-label="Class"
              className="k-field"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className} ({c.sport})
                </option>
              ))}
            </select>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              aria-label="Term"
              className="k-field"
            >
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </div>
          <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {SKILLS.map((sk) => (
              <div key={sk} className="bg-surface p-3">
                <div className="text-[13px] font-medium text-muted">
                  {SKILL_LABELS[sk]}
                </div>
                <div className="mt-1.5">
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
              Save assessment
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
                  <Td>{a.term}</Td>
                  <Td>
                    <button
                      onClick={() => setReportFor(a)}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-line px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/[0.06]"
                    >
                      <Icon name="download" size={13} />
                      Report card
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
      toast("Could not generate the PDF. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal ref={cardRef} onClose={onClose} className="max-w-2xl">
      <ReportHeader
        eyebrow="Player report card"
        name={a.studentName}
        meta={[cls?.className ?? "", a.term, cls ? schoolName(cls.schoolId) : ""]}
        onClose={onClose}
      >
        {cls && <span className="rounded-sm bg-white/[0.12] px-1.5 py-0.5 font-sans text-[11px] font-semibold text-white">{cls.sport}</span>}
      </ReportHeader>

      <div className="space-y-5 p-6">
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          <div className="bg-surface p-4">
            <div className="text-[12.5px] font-medium text-muted">Overall grade</div>
            <div className="mt-1 font-display text-[3rem] font-black leading-none tracking-[-0.04em] text-accent">
              {analysis.grade}
            </div>
            <div className="mt-1.5 font-mono text-[12px] text-muted">{analysis.overall} / 5</div>
          </div>
          <div className="bg-surface p-4">
            <div className="text-[12.5px] font-medium text-muted">Against class average</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-[1.75rem] font-black leading-none tracking-[-0.03em] text-content">
                {analysis.classOverall}
              </span>
              <span className="text-[12px] text-faint">class avg</span>
            </div>
            <div className={`mt-2 flex items-center gap-1 text-[13px] font-semibold ${analysis.aheadOfClass ? "text-good" : "text-warn"}`}>
              <Icon name={analysis.aheadOfClass ? "trend-up" : "trend-down"} size={15} />
              {analysis.aheadOfClass ? "Above" : "Below"} class average
            </div>
          </div>
          <div className="bg-surface p-4">
            <div className="text-[12.5px] font-medium text-muted">School</div>
            <div className="mt-2 font-display text-[1.0625rem] font-extrabold tracking-[-0.015em] text-content">
              {cls ? schoolName(cls.schoolId) : "—"}
            </div>
            <div className="mt-1 font-mono text-[12px] text-faint">Assessed {a.date}</div>
          </div>
        </div>

        <div className="rounded-lg bg-klutch-ink p-6 text-white dark:ring-1 dark:ring-white/[0.07]">
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <span className="font-display text-base font-extrabold tracking-[-0.02em]">Skill breakdown</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/50">
              <span className="h-2.5 w-0.5 rounded-full bg-white/60" /> class average
            </span>
          </div>
          <div className="space-y-5">
            {analysis.insights.map((ins) => {
              const status = skillStatusWord(r[ins.skill]);
              return (
                <div key={ins.skill}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[15px] font-semibold">{SKILL_LABELS[ins.skill]}</span>
                    <StarRating
                      onDark
                      value={r[ins.skill]}
                      onChange={(v) => setR((p) => ({ ...p, [ins.skill]: v }))}
                    />
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-white/[0.18]">
                    <div
                      className={`h-full origin-left rounded-full ${SKILL_STATUS_BAR_COLOR[status]} animate-grow-bar`}
                      style={{ width: `${(r[ins.skill] / 5) * 100}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-white/60"
                      style={{ left: `${(ins.classAvg / 5) * 100}%` }}
                      title={`Class average ${ins.classAvg}`}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[11px]">
                    <span className="font-medium uppercase tracking-[0.13em] text-white/[0.62]">{status}</span>
                    <span className="flex items-center gap-2 text-white/50">
                      class avg {ins.classAvg} <DeltaChip delta={ins.delta} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          <SkillList
            title="Strengths"
            marker="bg-hue-lime"
            items={analysis.strengths.map((s) => `${SKILL_LABELS[s.skill]} (${s.score}/5)`)}
            empty="Consistent across all skills."
          />
          <SkillList
            title="Focus areas"
            marker="bg-hue-orange"
            items={analysis.focus.map((s) => `${SKILL_LABELS[s.skill]} (${s.score}/5)`)}
            empty="No weak areas; strong all-round performance."
          />
        </div>

        <div data-pdf-hide className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-[12.5px] text-faint">
            Edit the stars above, then save. The PDF captures this card as shown.
          </p>
          <div className="flex gap-2">
            <OutlineButton icon="download" onClick={downloadPdf}>
              {saving ? "Generating…" : "PDF"}
            </OutlineButton>
            <PrimaryButton icon="check" onClick={() => onSave(r)}>
              Save report
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SkillList({ title, marker, items, empty }: { title: string; marker: string; items: string[]; empty: string }) {
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

// Lives only inside the navy report panel, so it uses the on-dark hues
// (the site's report card shows deltas in lime).
function DeltaChip({ delta }: { delta: number }) {
  if (delta === 0) return <span className="font-medium text-white/50">= avg</span>;
  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold ${up ? "text-klutch-lime-bright" : "text-klutch-orange-bright"}`}>
      <Icon name={up ? "trend-up" : "trend-down"} size={12} />
      {up ? "+" : ""}
      {delta}
    </span>
  );
}
