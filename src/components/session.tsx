"use client";

// How a session is described and reported, the same on every screen: the
// coach's phone view, the admin's tracker, and the school view (which never
// shows internal remarks).

import { useState } from "react";
import { useStore, type SessionPatch } from "@/lib/store";
import { addDays, rangeLabel, shortDay, timeLabel } from "@/lib/dates";
import { CURRICULUM, HOLIDAYS, REASONS, REPORT_STATUSES, classLabel, weekStart } from "@/lib/programme";
import { SPORTS, type Session, type SessionStatus, type Sport } from "@/lib/types";
import { Icon } from "./icons";
import { Modal, OutlineButton, PrimaryButton, SportBadge, StatusTag } from "./ui";

/** "2–7 Nov" for a teaching week (Monday to Saturday). */
export const weekDates = (week: number) => rangeLabel(weekStart(week), addDays(weekStart(week), 5));

export const timeRange = (s: Session) => `${timeLabel(s.startTime)}–${timeLabel(s.endTime)}`;

export function LessonLine({ s, className = "" }: { s: Session; className?: string }) {
  if (!s.lesson) return <span className={`text-faint ${className}`}>Lesson to confirm</span>;
  return (
    <span className={className}>
      <span className="mr-1.5 font-mono text-[12px] font-semibold text-accent">{s.curriculumCode}</span>
      {s.lesson}
    </span>
  );
}

const needsReason = (status: SessionStatus) => status === "Not Done" || status === "Cancelled" || status === "Postponed";

export function ReportDialog({ session, onClose, admin = false }: { session: Session; onClose: () => void; admin?: boolean }) {
  const { updateSession, coaches, toast } = useStore();
  const [status, setStatus] = useState<SessionStatus>(session.status);
  const [reason, setReason] = useState(session.reason ?? "");
  const [actualDate, setActualDate] = useState(session.actualDate ?? "");
  const [remarks, setRemarks] = useState(session.remarks ?? "");
  const [coachId, setCoachId] = useState(session.coachId ?? "");
  const [sport, setSport] = useState<Sport | "">(session.sport ?? "");
  const [saving, setSaving] = useState(false);
  const holiday = HOLIDAYS[session.date];

  async function save() {
    if (needsReason(status) && !reason) return toast("Pick a reason so the school and admin can see why.");
    if (saving) return;
    const patch: SessionPatch = {
      status,
      reason: needsReason(status) ? reason : null,
      actualDate: status === "Not reported" ? null : actualDate || null,
      remarks: remarks.trim() || null,
    };
    if (admin) {
      patch.coachId = coachId || null;
      if (sport && sport !== session.sport) {
        const step = CURRICULUM[sport][session.weekInBlock - 1];
        Object.assign(patch, { sport, curriculumCode: step.code, lesson: step.lesson });
      }
    }
    setSaving(true);
    const ok = await updateSession(session.id, patch);
    setSaving(false);
    if (!ok) return;
    toast(
      status === "Not reported"
        ? `Report cleared for ${session.groupLabel} on ${shortDay(session.date)}`
        : `${session.groupLabel} on ${shortDay(session.date)} saved as ${status}`
    );
    onClose();
  }

  return (
    <Modal onClose={onClose} className="max-w-lg">
      <div className="border-b border-line p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-black tracking-[-0.025em] text-content">{session.groupLabel}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {classLabel(session.grade, session.groupLabel)}, {shortDay(session.date)}, P{session.period}{" "}
              {timeRange(session)}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-sm p-1.5 text-muted hover:bg-elevated hover:text-content">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-content">
          <SportBadge sport={session.sport} />
          <LessonLine s={session} />
        </div>
        <p className="mt-2 font-mono text-[11.5px] text-faint">
          {session.code}, week {session.teachingWeek} (block {session.block}, week {session.weekInBlock} of 6)
        </p>
        {holiday && (
          <p className="mt-3 rounded-sm bg-hue-amber/15 px-3 py-2 text-[13px] text-content">
            {holiday} falls on this day. Check whether the school is open.
          </p>
        )}
      </div>

      <div className="space-y-4 p-5">
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-content">What happened?</legend>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                aria-pressed={status === st}
                className={`flex items-center justify-center gap-2 rounded-sm border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  status === st
                    ? "border-accent bg-accent/10 text-content"
                    : "border-line text-muted hover:border-accent/60 hover:text-content"
                }`}
              >
                <StatusTag value={st} />
              </button>
            ))}
          </div>
          {session.status !== "Not reported" && (
            <button
              type="button"
              onClick={() => setStatus("Not reported")}
              className="mt-2 text-[12.5px] font-semibold text-muted underline-offset-2 hover:text-content hover:underline"
            >
              Clear the report
            </button>
          )}
        </fieldset>

        {needsReason(status) && (
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-content">Why?</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="k-field">
              <option value="">Pick a reason…</option>
              {REASONS.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {status !== "Not reported" && (
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-content">
              {status === "Postponed" ? "New date, if known" : "Held on a different date?"}
            </span>
            <input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} className="k-field" />
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-content">Remarks</span>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="For KLUTCH only. The school never sees these."
            className="k-field"
          />
        </label>

        {admin && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">Coach</span>
              <select value={coachId} onChange={(e) => setCoachId(e.target.value)} className="k-field">
                <option value="">Unassigned</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">Sport</span>
              <select value={sport} onChange={(e) => setSport(e.target.value as Sport | "")} className="k-field">
                {!session.sport && <option value="">To confirm</option>}
                {SPORTS.map((sp) => (
                  <option key={sp}>{sp}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton icon="check" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save report"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
