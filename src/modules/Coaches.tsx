"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { tally } from "@/lib/analytics";
import { todayISO } from "@/lib/dates";
import type { Coach } from "@/lib/types";
import { Card, OutlineButton, PrimaryButton, SectionTitle, StatusTag } from "@/components/ui";

export default function Coaches() {
  const { coaches, addCoach, toast } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const n = name.replace(/\s+/g, " ").trim();
    if (!n) return toast("Enter the coach's name.");
    if (saving) return;
    setSaving(true);
    const ok = await addCoach({ name: n, phone: phone.trim() });
    setSaving(false);
    if (!ok) return;
    toast(`${n} added`);
    setName("");
    setPhone("");
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon="coaches"
        right={
          <PrimaryButton icon="plus" onClick={() => setOpen((v) => !v)}>
            Add coach
          </PrimaryButton>
        }
      >
        Coaches
      </SectionTitle>
      <p className="-mt-1 max-w-2xl text-sm text-muted">
        Coach 1 to Coach 4 are placeholders. Rename them to your coaches and add their numbers. Assign them to classes on
        the Timetable screen.
      </p>

      {open && (
        <Card className="animate-fade-up p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="k-field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">Phone</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} inputMode="tel" className="k-field font-mono" />
            </label>
            <PrimaryButton icon="check" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save coach"}
            </PrimaryButton>
          </div>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {coaches.map((c) => (
          <CoachCard key={c.id} coach={c} />
        ))}
      </div>
    </div>
  );
}

function CoachCard({ coach }: { coach: Coach }) {
  const { updateCoach, slots, sessions, toast } = useStore();
  const [name, setName] = useState(coach.name);
  const [phone, setPhone] = useState(coach.phone);
  const [saving, setSaving] = useState(false);
  const changed = name.trim() !== coach.name || phone.trim() !== coach.phone;
  const t = tally(sessions.filter((s) => s.coachId === coach.id), todayISO());
  const slotCount = slots.filter((s) => s.coachId === coach.id).length;

  async function save() {
    const n = name.replace(/\s+/g, " ").trim();
    if (!n) return toast("A coach needs a name.");
    setSaving(true);
    const ok = await updateCoach(coach.id, { name: n, phone: phone.trim() });
    setSaving(false);
    if (ok) toast(`${n} saved`);
  }

  async function toggleStatus() {
    const status = coach.status === "Active" ? "Inactive" : "Active";
    if (await updateCoach(coach.id, { status })) toast(`${coach.name} is now ${status.toLowerCase()}`);
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-muted">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="k-field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-muted">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              inputMode="tel"
              placeholder="Not added"
              className="k-field font-mono"
            />
          </label>
        </div>
        <StatusTag value={coach.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] text-muted">
          {slotCount} weekly slot{slotCount === 1 ? "" : "s"}, {t.Done} session{t.Done === 1 ? "" : "s"} delivered
        </span>
        <div className="flex gap-2">
          <OutlineButton onClick={toggleStatus}>{coach.status === "Active" ? "Mark inactive" : "Mark active"}</OutlineButton>
          {changed && (
            <PrimaryButton icon="check" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </Card>
  );
}
