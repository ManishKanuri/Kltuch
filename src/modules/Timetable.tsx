"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { addDays, rangeLabel, shortDay, timeLabel, WEEKDAYS } from "@/lib/dates";
import { GRADES, PERIODS, PROGRAMME, ROTATION, classLabel, weekStart } from "@/lib/programme";
import { SPORT_COLOR, SPORT_ICON, type TimetableSlot } from "@/lib/types";
import { Icon } from "@/components/icons";
import { Card, Modal, OutlineButton, PrimaryButton, SectionTitle } from "@/components/ui";

const DAYS = [1, 2, 3, 4, 5, 6];
const PERIOD_NUMBERS = Object.keys(PERIODS).map(Number);

export default function Timetable() {
  const { slots, sessions, coaches, coachName, assignCoach, addSessions, toast } = useStore();
  const [editing, setEditing] = useState<TimetableSlot | null>(null);

  const byClass = useMemo(() => {
    const groups = new Map<string, TimetableSlot[]>();
    for (const slot of slots) {
      const label = classLabel(slot.grade, slot.groupLabel);
      groups.set(label, [...(groups.get(label) ?? []), slot]);
    }
    return [...groups].sort(([a], [b]) => (a.startsWith("Mixed") ? 1 : b.startsWith("Mixed") ? -1 : a.localeCompare(b, undefined, { numeric: true })));
  }, [slots]);

  const lastSession = sessions.reduce<string>((max, s) => (s.date > max ? s.date : max), PROGRAMME.startDate);
  const [from, setFrom] = useState(addDays(lastSession, 1));
  const [to, setTo] = useState<string>(PROGRAMME.endDate);
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runAdd() {
    if (to < from) return toast("The end date is before the start date.");
    setAdding(true);
    setResult(null);
    const outcome = await addSessions(from, to);
    setAdding(false);
    if (!outcome) return;
    setResult(
      outcome.created
        ? `Added ${outcome.created} sessions${outcome.skipped ? ` (${outcome.skipped} already existed)` : ""}.`
        : outcome.skipped
          ? `Nothing new: all ${outcome.skipped} sessions in those dates already exist.`
          : "No timetable slots fall in those dates inside the 24 weeks."
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon="calendar">Master PET timetable</SectionTitle>
        <p className="-mt-1 mb-3 max-w-3xl text-sm text-muted">
          From the school&rsquo;s timetable for Classes 8–12. A slash pair such as 10J/10L is one session. Tap a group to
          change its coach.
        </p>
        <Card className="hidden overflow-hidden md:block">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-elevated">
                  <th className="w-16 px-3 py-2.5 text-left text-[12px] font-semibold text-muted">Day</th>
                  {PERIOD_NUMBERS.map((p) => (
                    <th key={p} className={`px-2 py-2.5 text-left ${p === 6 ? "border-l-4 border-l-hue-amber/40" : ""}`}>
                      <div className="text-[12px] font-semibold text-content">P{p}</div>
                      <div className="font-mono text-[11px] font-normal text-faint">
                        {timeLabel(PERIODS[p].start)}–{timeLabel(PERIODS[p].end)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d) => (
                  <tr key={d} className="border-b border-line last:border-0">
                    <th className="px-3 py-2 text-left text-[13px] font-semibold text-content">{WEEKDAYS[d - 1]}</th>
                    {PERIOD_NUMBERS.map((p) => (
                      <td key={p} className={`px-1.5 py-1.5 align-top ${p === 6 ? "border-l-4 border-l-hue-amber/40" : ""}`}>
                        <div className="flex flex-col gap-1">
                          {slots
                            .filter((s) => s.weekday === d && s.period === p)
                            .map((s) => (
                              <SlotChip key={s.id} slot={s} coach={coachName(s.coachId)} onClick={() => setEditing(s)} />
                            ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-3 py-2 text-[12px] text-faint">Lunch 12:55–1:25 pm falls between P5 and P6.</p>
        </Card>

        {/* Phones: one list per day. */}
        <div className="space-y-3 md:hidden">
          {DAYS.map((d) => (
            <Card key={d} className="p-4">
              <h3 className="text-[13px] font-semibold text-content">{WEEKDAYS[d - 1]}</h3>
              <ul className="mt-2 space-y-1.5">
                {slots
                  .filter((s) => s.weekday === d)
                  .sort((a, b) => a.period - b.period)
                  .map((s) => (
                    <li key={s.id} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 font-mono text-[12px] text-faint">
                        P{s.period} {timeLabel(s.startTime)}
                      </span>
                      <SlotChip slot={s} coach={coachName(s.coachId)} onClick={() => setEditing(s)} />
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle icon="coaches">Coaches by class</SectionTitle>
        <Card className="divide-y divide-line">
          {byClass.map(([label, list]) => (
            <ClassAssignRow
              key={label}
              label={label}
              slots={list}
              summary={summarize(list, coachName)}
              coaches={coaches.filter((c) => c.status === "Active")}
              onAssign={async (coachId) => {
                if (await assignCoach(list.map((s) => s.id), coachId)) {
                  toast(`${label}: ${list.length} slots assigned to ${coachName(coachId)}`);
                }
              }}
            />
          ))}
        </Card>
        <p className="mt-2 text-[12.5px] text-faint">
          Assigning a coach also updates that slot&rsquo;s sessions that haven&rsquo;t been reported. Reported sessions keep
          the coach who delivered them.
        </p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[3fr_2fr]">
        <Card className="p-5">
          <h2 className="font-display text-[1.0625rem] font-extrabold tracking-[-0.015em] text-content">Sports rotation</h2>
          <p className="mt-0.5 text-[13px] text-muted">Four blocks of six weeks. Each block restarts the curriculum at week 1.</p>
          <div className="scrollbar-thin mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-[12px] text-muted">
                  <th className="py-2 pr-2 font-semibold">Block</th>
                  {GRADES.map((g) => (
                    <th key={g} className="px-1.5 py-2 font-semibold">
                      Class {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((b) => (
                  <tr key={b} className="border-b border-line/60 last:border-0">
                    <td className="py-2 pr-2">
                      <div className="font-semibold text-content">Block {b}</div>
                      <div className="whitespace-nowrap text-[11.5px] text-faint">
                        {rangeLabel(weekStart((b - 1) * 6 + 1), addDays(weekStart(b * 6), 5))}
                      </div>
                    </td>
                    {GRADES.map((g) => {
                      const sport = ROTATION[b][g];
                      return (
                        <td key={g} className="px-1.5 py-2">
                          <span className="inline-flex items-center gap-1 text-content">
                            <Icon name={SPORT_ICON[sport]} size={13} style={{ color: SPORT_COLOR[sport] }} />
                            {sport}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-[1.0625rem] font-extrabold tracking-[-0.015em] text-content">Add later weeks</h2>
          <p className="mt-1 text-sm text-muted">
            Sessions are loaded to {shortDay(lastSession)}, the end of the working period in the tracker. Add more once the
            school confirms its calendar. Each gets its sport and lesson from the rotation. Holidays aren&rsquo;t skipped:
            mark closures on Session tracking.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">From</span>
              <input
                type="date"
                value={from}
                min={PROGRAMME.startDate}
                max={PROGRAMME.endDate}
                onChange={(e) => setFrom(e.target.value)}
                className="k-field w-auto"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">To</span>
              <input
                type="date"
                value={to}
                min={from}
                max={PROGRAMME.endDate}
                onChange={(e) => setTo(e.target.value)}
                className="k-field w-auto"
              />
            </label>
            <PrimaryButton icon="plus" onClick={runAdd} disabled={adding}>
              {adding ? "Adding…" : "Add sessions"}
            </PrimaryButton>
          </div>
          <p role="status" className="mt-3 min-h-5 text-sm text-content">
            {result}
          </p>
        </Card>
      </div>

      {editing && (
        <SlotDialog
          slot={editing}
          onClose={() => setEditing(null)}
          onSave={async (coachId) => {
            if (await assignCoach([editing.id], coachId)) {
              toast(`${editing.groupLabel} on ${WEEKDAYS[editing.weekday - 1]} assigned to ${coachName(coachId)}`);
              setEditing(null);
            }
          }}
        />
      )}
    </div>
  );
}

function summarize(list: TimetableSlot[], coachName: (id: string | null) => string) {
  const counts = new Map<string, number>();
  for (const s of list) counts.set(coachName(s.coachId), (counts.get(coachName(s.coachId)) ?? 0) + 1);
  return [...counts].map(([name, n]) => `${name} (${n})`).join(", ");
}

function SlotChip({ slot, coach, onClick }: { slot: TimetableSlot; coach: string; onClick: () => void }) {
  const unassigned = !slot.coachId;
  return (
    <button
      onClick={onClick}
      aria-label={`${slot.groupLabel}, ${WEEKDAYS[slot.weekday - 1]} P${slot.period}: ${coach}. Change coach`}
      className={`w-full rounded-sm border px-2 py-1 text-left transition-colors hover:border-accent ${
        unassigned ? "border-dashed border-line" : "border-line bg-elevated"
      }`}
    >
      <div className="text-[13px] font-semibold text-content">{slot.groupLabel}</div>
      <div className={`truncate text-[11.5px] ${unassigned ? "text-faint" : "text-muted"}`}>{coach}</div>
    </button>
  );
}

function ClassAssignRow({
  label,
  slots,
  summary,
  coaches,
  onAssign,
}: {
  label: string;
  slots: TimetableSlot[];
  summary: string;
  coaches: { id: string; name: string }[];
  onAssign: (coachId: string | null) => Promise<void>;
}) {
  const [choice, setChoice] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="font-semibold text-content">
          {label} <span className="font-normal text-faint">{slots.length} weekly slots</span>
        </div>
        <div className="mt-0.5 text-[13px] text-muted">{summary}</div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          aria-label={`Coach for every ${label} slot`}
          className="k-field w-auto"
        >
          <option value="">Pick a coach…</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="none">Nobody (unassign)</option>
        </select>
        <OutlineButton
          onClick={async () => {
            if (!choice || saving) return;
            setSaving(true);
            await onAssign(choice === "none" ? null : choice);
            setSaving(false);
            setChoice("");
          }}
        >
          {saving ? "Saving…" : "Assign all"}
        </OutlineButton>
      </div>
    </div>
  );
}

function SlotDialog({
  slot,
  onClose,
  onSave,
}: {
  slot: TimetableSlot;
  onClose: () => void;
  onSave: (coachId: string | null) => Promise<void>;
}) {
  const { coaches } = useStore();
  const [coachId, setCoachId] = useState(slot.coachId ?? "");
  const [saving, setSaving] = useState(false);
  return (
    <Modal onClose={onClose} className="max-w-sm">
      <div className="p-5">
        <h2 className="font-display text-xl font-black tracking-[-0.02em] text-content">{slot.groupLabel}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {classLabel(slot.grade, slot.groupLabel)}, every {WEEKDAYS[slot.weekday - 1]} P{slot.period},{" "}
          {timeLabel(slot.startTime)}–{timeLabel(slot.endTime)}
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-semibold text-content">Coach</span>
          <select value={coachId} onChange={(e) => setCoachId(e.target.value)} className="k-field">
            <option value="">Unassigned</option>
            {coaches
              .filter((c) => c.status === "Active" || c.id === slot.coachId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton
            icon="check"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(coachId || null);
              setSaving(false);
            }}
          >
            {saving ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
