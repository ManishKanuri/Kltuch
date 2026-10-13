"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { TODAY } from "@/lib/seed";
import { CANCEL_REASONS } from "@/lib/types";
import { Icon } from "@/components/icons";
import { PrimaryButton, SportBadge, StatusTag } from "@/components/ui";

export default function CoachMobile() {
  const {
    currentCoachId,
    coachName,
    sessions,
    classes,
    attendance,
    toggleAttendance,
    setSessionStatus,
    setCurriculumWeek,
    logCancellation,
    schoolName,
    toast,
  } = useStore();

  const present =
    attendance.find((a) => a.coachId === currentCoachId && a.date === TODAY)
      ?.present ?? false;

  const mySessions = useMemo(
    () => sessions.filter((s) => s.coachId === currentCoachId && s.date === TODAY),
    [sessions, currentCoachId]
  );

  const [cancelFor, setCancelFor] = useState<string | null>(null);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const done = mySessions.filter((s) => s.status === "Done").length;
  const firstName = coachName(currentCoachId).split(" ")[0];

  return (
    <div className="mx-auto max-w-md space-y-3">
      {/* The coach screen has no sidebar, so the field-blue card carries the brand here */}
      <div className="relative overflow-hidden rounded-lg bg-klutch-field p-5 text-white">
        <div
          aria-hidden
          className="court-lines pointer-events-none absolute -right-48 -top-12 h-[260px] w-[420px] opacity-[0.15]"
        />
        <div className="relative flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
          <span>Coach</span>
          <span>{TODAY}</span>
        </div>
        <div className="relative mt-2 font-display text-[2rem] font-black uppercase leading-none tracking-[-0.035em]">
          Hi, {firstName}
        </div>
        <div className="relative mt-2.5 text-[14px] text-white/80">
          <span className="font-mono font-bold text-white">{done}/{mySessions.length}</span> sessions done today
        </div>
      </div>

      <StepCard step="01" title="Today’s attendance">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-content">
            {present ? "You’re marked present" : "Not marked yet"}
          </div>
          <Toggle
            on={present}
            label="Mark me present"
            onClick={() => {
              toggleAttendance(currentCoachId);
              toast(present ? "Attendance cleared" : "Marked present");
            }}
          />
        </div>
      </StepCard>

      <StepCard step="02" title="Did each session happen?">
        <div className="space-y-2.5">
          {mySessions.map((s) => {
            const cls = classes.find((c) => c.id === s.classId);
            return (
              <div key={s.id} className="rounded-lg border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-content">
                      {cls?.className}
                      {cls && <SportBadge sport={cls.sport} showLabel={false} />}
                    </div>
                    <div className="mt-0.5 flex gap-3 text-[12.5px] text-faint">
                      <span>{cls ? schoolName(cls.schoolId) : ""}</span>
                      <span className="font-mono">Wk {s.curriculumWeek}</span>
                    </div>
                  </div>
                  <StatusTag value={s.status} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSessionStatus(s.id, "Done");
                      toast(`${cls?.className} marked Done`);
                    }}
                    disabled={s.status === "Done"}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-klutch-cta px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-klutch-cta-hover disabled:bg-content/[0.08] disabled:text-faint"
                  >
                    <Icon name="check" size={15} strokeWidth={2.4} /> Done
                  </button>
                  <button
                    onClick={() => setCancelFor(cancelFor === s.id ? null : s.id)}
                    aria-expanded={cancelFor === s.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-line px-3 py-2.5 text-sm font-semibold text-content transition-colors hover:border-bad hover:text-bad"
                  >
                    <Icon name="x" size={15} strokeWidth={2.4} /> Cancelled
                  </button>
                </div>

                <label className="mt-2.5 flex items-center gap-2 text-[12.5px] text-muted">
                  Curriculum week
                  <select
                    value={s.curriculumWeek}
                    onChange={(e) =>
                      setCurriculumWeek(s.id, Number(e.target.value))
                    }
                    className="rounded-sm border border-line bg-surface px-2 py-1 font-mono text-xs text-content"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Wk {w}
                      </option>
                    ))}
                  </select>
                </label>

                {cancelFor === s.id && (
                  <div className="animate-fade-up mt-3 rounded-sm border border-bad/25 bg-bad/[0.06] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-content">
                      <span className="font-mono text-[12px] font-bold text-hue-orange">03</span>
                      Why was it cancelled?
                    </div>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      aria-label="Cancellation reason"
                      className="k-field mb-2"
                    >
                      {CANCEL_REASONS.map((rz) => (
                        <option key={rz}>{rz}</option>
                      ))}
                    </select>
                    <PrimaryButton
                      icon="check"
                      onClick={() => {
                        logCancellation(
                          s.id,
                          reason === "Coach sick" ? "KLUTCH" : "School",
                          reason,
                          null
                        );
                        setCancelFor(null);
                        toast(`${cls?.className} logged as cancelled`);
                      }}
                    >
                      Log cancellation
                    </PrimaryButton>
                  </div>
                )}
              </div>
            );
          })}
          {mySessions.length === 0 && (
            <div className="py-6 text-center text-sm text-faint">
              No sessions scheduled for you today.
            </div>
          )}
        </div>
      </StepCard>

      <p className="px-2 pt-1 text-center text-[12.5px] text-faint">
        Three taps at most. Your name, school and class fill in automatically.
      </p>
    </div>
  );
}

// The steps really are a sequence, so they keep numbers — set like the
// site's "01" labels (mono, orange).
function StepCard({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-2.5 text-[13px] font-semibold text-muted">
        <span className="font-mono text-[12px] font-bold text-hue-orange">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${
        on ? "bg-klutch-field" : "bg-content/20"
      }`}
      aria-label={label}
      aria-pressed={on}
    >
      <span
        className={`absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow transition-[left] duration-200 ease-brand-out ${
          on ? "left-8" : "left-1"
        }`}
      >
        {on && <Icon name="check" size={14} className="text-klutch-field" strokeWidth={2.6} />}
      </span>
    </button>
  );
}
