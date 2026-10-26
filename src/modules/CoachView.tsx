"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { sessionClass } from "@/lib/analytics";
import { addDays, mondayOf, shortDay, todayISO } from "@/lib/dates";
import { HOLIDAYS, PROGRAMME, teachingWeek } from "@/lib/programme";
import type { Session } from "@/lib/types";
import { LessonLine, ReportDialog, timeRange } from "@/components/session";
import { Icon } from "@/components/icons";
import { SportBadge, StatusTag } from "@/components/ui";

export default function CoachView() {
  const { role, coaches, currentCoachId, setCurrentCoachId, sessions, attendance, setAttendance, updateSession, toast } = useStore();
  const today = todayISO();
  const coach = coaches.find((c) => c.id === currentCoachId);
  const [everyone, setEveryone] = useState(false);
  const [reporting, setReporting] = useState<{ session: Session } | null>(null);

  const mine = useMemo(
    () =>
      sessions
        .filter((s) => everyone || s.coachId === currentCoachId)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [sessions, everyone, currentCoachId]
  );
  const assignedCount = sessions.filter((s) => s.coachId === currentCoachId).length;
  const todays = mine.filter((s) => s.date === today);
  const waiting = mine.filter((s) => s.date < today && s.status === "Not reported");
  const weekEnd = addDays(mondayOf(today), 5);
  const comingUp = mine.filter((s) => s.date > today && s.date <= (today < PROGRAMME.startDate ? addDays(PROGRAMME.startDate, 5) : weekEnd));
  const week = teachingWeek(today);
  const thisWeek = mine.filter((s) => week !== null && s.teachingWeek === week);
  const doneThisWeek = thisWeek.filter((s) => s.status === "Done").length;

  const mark = attendance.find((a) => a.coachId === currentCoachId && a.date === today);
  const markState = mark ? (mark.present ? "present" : "absent") : "none";

  async function markAttendance(next: "present" | "absent") {
    if (!coach) return;
    const value = markState === next ? null : next;
    if (await setAttendance(coach.id, today, value)) {
      toast(value === null ? "Attendance cleared" : value === "present" ? "Marked present for today" : "Marked absent for today");
    }
  }

  async function markDone(s: Session) {
    if (await updateSession(s.id, { status: "Done" })) toast(`${s.groupLabel} saved as Done`);
  }

  if (!coach) return <p className="text-sm text-faint">Add a coach on the Coaches screen first.</p>;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {role === "admin" && (
        <label className="flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-[13px] text-muted">
          Previewing as
          <select value={currentCoachId} onChange={(e) => setCurrentCoachId(e.target.value)} className="k-field w-auto">
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div>
        <h2 className="font-display text-[1.75rem] font-black leading-tight tracking-[-0.03em] text-content">{coach.name}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {shortDay(today)}
          {week
            ? `, week ${week} of ${PROGRAMME.totalWeeks}. ${doneThisWeek} of ${thisWeek.length} sessions done this week.`
            : today < PROGRAMME.startDate
              ? `. The programme starts ${shortDay(PROGRAMME.startDate)}.`
              : "."}
        </p>
      </div>

      <section className="rounded-lg border border-line bg-surface p-4">
        <h3 className="text-[13px] font-semibold text-muted">Your attendance today</h3>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {(["present", "absent"] as const).map((value) => (
            <button
              key={value}
              onClick={() => markAttendance(value)}
              aria-pressed={markState === value}
              className={`flex items-center justify-center gap-2 rounded-sm border px-3 py-3 text-sm font-semibold transition-colors ${
                markState === value
                  ? value === "present"
                    ? "border-good bg-good/10 text-content"
                    : "border-bad bg-bad/10 text-content"
                  : "border-line text-muted hover:text-content"
              }`}
            >
              <StatusTag value={value === "present" ? "Present" : "Absent"} />
            </button>
          ))}
        </div>
        {markState !== "none" && <p className="mt-2 text-[12.5px] text-faint">Tap it again to clear.</p>}
      </section>

      {assignedCount === 0 && !everyone && (
        <p className="rounded-lg bg-hue-amber/15 px-4 py-3 text-[13px] text-content">
          No sessions are assigned to you yet. The admin assigns coaches on the Timetable screen. Meanwhile you can{" "}
          <button onClick={() => setEveryone(true)} className="font-semibold text-accent underline underline-offset-2">
            see everyone&rsquo;s sessions
          </button>
          .
        </p>
      )}
      {(assignedCount > 0 || everyone) && (
        <div className="flex rounded-sm border border-line bg-elevated p-0.5 text-[13px] font-semibold" role="group" aria-label="Whose sessions">
          {[false, true].map((all) => (
            <button
              key={String(all)}
              onClick={() => setEveryone(all)}
              aria-pressed={everyone === all}
              className={`flex-1 rounded-[1px] px-3 py-1.5 transition-colors ${everyone === all ? "bg-klutch-field text-white" : "text-muted hover:text-content"}`}
            >
              {all ? "Everyone's sessions" : "My sessions"}
            </button>
          ))}
        </div>
      )}

      {waiting.length > 0 && (
        <SessionGroup title={`Waiting for a report (${waiting.length})`} tone="warn">
          {waiting.map((s) => (
            <SessionCard key={s.id} s={s} today={today} showDate onDone={() => markDone(s)} onReport={() => setReporting({ session: s })} />
          ))}
        </SessionGroup>
      )}

      <SessionGroup title={`Today${HOLIDAYS[today] ? `, ${HOLIDAYS[today]}` : ""}`}>
        {todays.map((s) => (
          <SessionCard key={s.id} s={s} today={today} onDone={() => markDone(s)} onReport={() => setReporting({ session: s })} />
        ))}
        {todays.length === 0 && <p className="py-4 text-center text-sm text-faint">No sessions today.</p>}
      </SessionGroup>

      <SessionGroup title={today < PROGRAMME.startDate ? "First week" : "Coming up this week"}>
        {comingUp.map((s) => (
          <SessionCard key={s.id} s={s} today={today} showDate onReport={() => setReporting({ session: s })} />
        ))}
        {comingUp.length === 0 && <p className="py-4 text-center text-sm text-faint">Nothing else this week.</p>}
      </SessionGroup>

      {reporting && <ReportDialog session={reporting.session} onClose={() => setReporting(null)} />}
    </div>
  );
}

function SessionGroup({ title, tone, children }: { title: string; tone?: "warn"; children: React.ReactNode }) {
  return (
    <section>
      <h3 className={`mb-2 px-1 text-[13px] font-semibold ${tone === "warn" ? "text-warn" : "text-muted"}`}>{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SessionCard({
  s,
  today,
  showDate = false,
  onDone,
  onReport,
}: {
  s: Session;
  today: string;
  showDate?: boolean;
  onDone?: () => void;
  onReport: () => void;
}) {
  const { coachName } = useStore();
  const canReport = s.date <= today;
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-black tracking-[-0.02em] text-content">{s.groupLabel}</span>
            <span className="text-[12.5px] text-faint">{sessionClass(s)}</span>
          </div>
          <div className="mt-0.5 font-mono text-[12.5px] text-muted">
            {showDate && `${shortDay(s.date)}, `}P{s.period} {timeRange(s)}
          </div>
        </div>
        {s.status !== "Not reported" && <StatusTag value={s.status} />}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13.5px] text-content">
        <SportBadge sport={s.sport} />
        <LessonLine s={s} />
      </div>
      <div className="mt-1 text-[12px] text-faint">{coachName(s.coachId)}</div>
      <div className="mt-3 flex gap-2">
        {canReport && s.status === "Not reported" && onDone && (
          <button
            onClick={onDone}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-klutch-cta px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-klutch-cta-hover"
          >
            <Icon name="check" size={15} strokeWidth={2.4} /> Done
          </button>
        )}
        <button
          onClick={onReport}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-line px-3 py-2.5 text-sm font-semibold text-content transition-colors hover:border-accent"
        >
          {!canReport ? "Details" : s.status === "Not reported" ? "Didn't happen, or add a note" : "Change report"}
        </button>
      </div>
    </div>
  );
}
