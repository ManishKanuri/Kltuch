"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { monthLabel, todayISO } from "@/lib/dates";
import { CANCEL_REASONS, type CancelledBy } from "@/lib/types";
import { Icon } from "@/components/icons";
import {
  Card,
  PrimaryButton,
  SectionTitle,
  StatusTag,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

export default function CancellationLog() {
  const {
    cancellationRows,
    sessions,
    schoolName,
    classById,
    logCancellation,
    toast,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [cancelledBy, setCancelledBy] = useState<CancelledBy>("School");
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [reschedule, setReschedule] = useState("");
  const [saving, setSaving] = useState(false);

  const openSessions = useMemo(
    () => sessions.filter((s) => s.status !== "Cancelled"),
    [sessions]
  );

  async function submit() {
    if (!sessionId) {
      toast("Pick a session first");
      return;
    }
    if (saving) return;
    const cls = classById(sessions.find((s) => s.id === sessionId)!.classId);
    setSaving(true);
    const ok = await logCancellation(sessionId, cancelledBy, reason, reschedule || null);
    setSaving(false);
    // On failure the form stays open with what was picked.
    if (!ok) return;
    toast(`${cls?.className ?? "Session"} cancellation logged`);
    setOpen(false);
    setSessionId("");
    setReschedule("");
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon="cancel"
        right={
          <PrimaryButton icon="plus" onClick={() => setOpen((v) => !v)}>
            Log cancellation
          </PrimaryButton>
        }
      >
        Cancellations
      </SectionTitle>

      {open && (
        <Card className="animate-fade-up p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Session">
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="k-field"
              >
                <option value="">Select session…</option>
                {openSessions.map((s) => {
                  const cls = classById(s.classId);
                  return (
                    <option key={s.id} value={s.id}>
                      {cls ? schoolName(cls.schoolId) : ""}, {cls?.className}, {s.date}
                    </option>
                  );
                })}
              </select>
            </Field>
            <Field label="Cancelled by">
              <select
                value={cancelledBy}
                onChange={(e) => setCancelledBy(e.target.value as CancelledBy)}
                className="k-field"
              >
                <option value="School">School</option>
                <option value="KLUTCH">KLUTCH</option>
              </select>
            </Field>
            <Field label="Reason">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="k-field"
              >
                {CANCEL_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Rescheduled date (optional)">
              <input
                type="date"
                value={reschedule}
                onChange={(e) => setReschedule(e.target.value)}
                className="k-field"
              />
            </Field>
          </div>
          <div className="mt-3">
            <PrimaryButton icon="check" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save cancellation"}
            </PrimaryButton>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <Th>Date</Th>
            <Th>School</Th>
            <Th>Class</Th>
            <Th>Cancelled by</Th>
            <Th>Reason</Th>
            <Th>Rescheduled</Th>
          </THead>
          <tbody>
            {cancellationRows.map((r, i) => (
              <Tr key={r.id} i={i}>
                <Td className="font-mono text-[13px]">{r.date}</Td>
                <Td className="font-semibold text-content">
                  {r.schoolId ? schoolName(r.schoolId) : "—"}
                </Td>
                <Td>{r.className}</Td>
                <Td>
                  <StatusTag value={r.cancelledBy} />
                </Td>
                <Td>{r.reason}</Td>
                <Td>
                  {r.rescheduledDate ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[13px] text-good">
                      <Icon name="check" size={13} /> {r.rescheduledDate}
                    </span>
                  ) : (
                    <span className="text-faint">No</span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <p className="text-xs text-faint">
        Cancellations in {monthLabel(todayISO())} are counted on the Admin dashboard.
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-content">
        {label}
      </span>
      {children}
    </label>
  );
}
