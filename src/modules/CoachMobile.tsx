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

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* header */}
      <div className="relative overflow-hidden rounded-3xl bg-klutch-ink bg-sidebar-glow p-5 text-white shadow-brand">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-400">
          <Icon name="calendar" size={13} /> Coach Mobile · {TODAY}
        </div>
        <div className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold">
          <Icon name="wave" size={22} className="text-klutch-tennis" />
          Hi, {coachName(currentCoachId).split(" ")[0]}
        </div>
        <div className="mt-1 text-sm text-slate-400">
          {done}/{mySessions.length} sessions done · finish in under 60 seconds
        </div>
      </div>

      {/* 1 — attendance */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card dark:shadow-card-dark">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-gradient text-[9px] font-bold text-white">
                1
              </span>
              Today&apos;s Attendance
            </div>
            <div className="mt-1 text-base font-semibold text-content">
              {present ? "You're marked present" : "Not marked yet"}
            </div>
          </div>
          <Toggle
            on={present}
            onClick={() => {
              toggleAttendance(currentCoachId);
              toast(present ? "Attendance cleared" : "Marked present");
            }}
          />
        </div>
      </div>

      {/* 2 & 3 — sessions */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card dark:shadow-card-dark">
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-gradient text-[9px] font-bold text-white">
            2
          </span>
          Session Completed?
        </div>
        <div className="space-y-2.5">
          {mySessions.map((s) => {
            const cls = classes.find((c) => c.id === s.classId);
            return (
              <div key={s.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-content">
                      {cls?.className}
                      {cls && <SportBadge sport={cls.sport} showLabel={false} />}
                    </div>
                    <div className="text-xs text-faint">
                      {cls ? schoolName(cls.schoolId) : ""} · Wk {s.curriculumWeek}
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
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-brand transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
                  >
                    <Icon name="check" size={15} strokeWidth={2.4} /> Done
                  </button>
                  <button
                    onClick={() => setCancelFor(cancelFor === s.id ? null : s.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/10"
                  >
                    <Icon name="x" size={15} strokeWidth={2.4} /> Cancelled
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <span>Curriculum week:</span>
                  <select
                    value={s.curriculumWeek}
                    onChange={(e) =>
                      setCurriculumWeek(s.id, Number(e.target.value))
                    }
                    className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-content"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Wk {w}
                      </option>
                    ))}
                  </select>
                </div>

                {cancelFor === s.id && (
                  <div className="animate-fade-up mt-3 rounded-lg border border-rose-500/20 bg-rose-500/8 p-3">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-rose-500">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                        3
                      </span>
                      Cancellation Reason
                    </div>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
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
                      Log Cancellation
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
      </div>

      <p className="px-2 text-center text-xs text-faint">
        Max 3 actions. Name, school &amp; class auto-filled — built for under 60
        seconds a day.
      </p>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-9 w-16 rounded-full transition ${
        on ? "bg-brand-gradient" : "bg-content/20"
      }`}
      aria-label="Toggle"
      aria-pressed={on}
    >
      <span
        className={`absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow transition-all ${
          on ? "left-8" : "left-1"
        }`}
      >
        {on && <Icon name="check" size={14} className="text-klutch-blue" strokeWidth={2.6} />}
      </span>
    </button>
  );
}
