"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { WEEKDAYS, addDays, timeLabel, todayISO } from "@/lib/dates";
import type { ClassSlot } from "@/lib/types";
import { Icon } from "@/components/icons";
import { Card, Empty, PrimaryButton, SectionTitle, SportBadge, Table, Td, Th, THead, Tr } from "@/components/ui";

const MAX_RANGE_DAYS = 183;

export default function Timetable() {
  const { classes, schools, schedule, coachName, schoolName, createSessions, addSession, toast } = useStore();
  const today = todayISO();

  const [schoolFilter, setSchoolFilter] = useState("all");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 27));
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [oneClass, setOneClass] = useState("");
  const [oneDate, setOneDate] = useState(today);
  const [oneTime, setOneTime] = useState("09:00");
  const [adding, setAdding] = useState(false);

  const shownClasses = useMemo(
    () =>
      classes
        .filter((c) => schoolFilter === "all" || c.schoolId === schoolFilter)
        .sort(
          (a, b) =>
            schoolName(a.schoolId).localeCompare(schoolName(b.schoolId)) ||
            a.className.localeCompare(b.className, undefined, { numeric: true })
        ),
    [classes, schoolFilter, schoolName]
  );

  const slotsByClass = useMemo(() => {
    const map = new Map<string, ClassSlot[]>();
    for (const slot of schedule) map.set(slot.classId, [...(map.get(slot.classId) ?? []), slot]);
    for (const slots of map.values()) {
      slots.sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [schedule]);

  async function runCreate() {
    if (to < from) return toast("The end date is before the start date.");
    if ((Date.parse(to) - Date.parse(from)) / 86_400_000 > MAX_RANGE_DAYS) {
      return toast("Pick a range of six months or less.");
    }
    if (!schedule.length) return toast("Add weekly slots to the timetable first.");
    setCreating(true);
    setResult(null);
    const outcome = await createSessions(from, to);
    setCreating(false);
    if (!outcome) return;
    const { created, skipped } = outcome;
    setResult(
      created + skipped === 0
        ? "No timetable slots fall between those dates."
        : created === 0
          ? `Nothing new to add: all ${skipped} sessions already exist.`
          : `Created ${created} session${created === 1 ? "" : "s"}${skipped ? ` (${skipped} already existed)` : ""}.`
    );
  }

  async function runAddOne() {
    const classId = oneClass || classes[0]?.id;
    if (!classId || !oneDate) return;
    setAdding(true);
    const ok = await addSession(classId, oneDate, oneTime || null);
    setAdding(false);
    if (ok) toast(`Session added for ${classes.find((c) => c.id === classId)?.className} on ${oneDate}`);
  }

  const classesWithSlots = slotsByClass.size;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-[1.0625rem] font-extrabold tracking-[-0.015em] text-content">Create sessions</h2>
          <p className="mt-1 text-sm text-muted">
            Adds a Pending session for every weekly slot between these dates. Sessions that already
            exist are left alone, so you can safely run it again.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="k-field w-auto" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">To</span>
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="k-field w-auto" />
            </label>
            <PrimaryButton icon="calendar" onClick={runCreate} disabled={creating}>
              {creating ? "Creating…" : "Create sessions"}
            </PrimaryButton>
          </div>
          <p role="status" className="mt-3 min-h-5 text-sm text-content">
            {result ?? (
              <span className="text-faint">
                {schedule.length} weekly slot{schedule.length === 1 ? "" : "s"} across {classesWithSlots} class
                {classesWithSlots === 1 ? "" : "es"}.
              </span>
            )}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-[1.0625rem] font-extrabold tracking-[-0.015em] text-content">Add a one-off session</h2>
          <p className="mt-1 text-sm text-muted">For an extra session or event outside the weekly timetable.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">Class</span>
              <select value={oneClass || classes[0]?.id || ""} onChange={(e) => setOneClass(e.target.value)} className="k-field">
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className}, {schoolName(c.schoolId)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">Date</span>
              <input type="date" value={oneDate} onChange={(e) => setOneDate(e.target.value)} className="k-field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-content">Time</span>
              <input type="time" value={oneTime} onChange={(e) => setOneTime(e.target.value)} className="k-field font-mono" />
            </label>
          </div>
          <div className="mt-4">
            <PrimaryButton icon="plus" onClick={runAddOne} disabled={adding || !classes.length}>
              {adding ? "Adding…" : "Add session"}
            </PrimaryButton>
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle
          icon="calendar"
          right={
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              aria-label="Filter by school"
              className="k-field w-auto"
            >
              <option value="all">All schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          }
        >
          Weekly timetable
        </SectionTitle>
        <Card className="hidden overflow-hidden md:block">
          <Table>
            <THead>
              <Th>Class</Th>
              <Th>School</Th>
              <Th>Sport</Th>
              <Th>Coach</Th>
              <Th>Weekly slots</Th>
              <Th>Add a slot</Th>
            </THead>
            <tbody>
              {shownClasses.map((cls, i) => (
                <Tr key={cls.id} i={i}>
                  <Td className="font-semibold text-content">{cls.className}</Td>
                  <Td>{schoolName(cls.schoolId)}</Td>
                  <Td>
                    <SportBadge sport={cls.sport} />
                  </Td>
                  <Td>{coachName(cls.coachId)}</Td>
                  <Td>
                    <SlotChips classLabel={cls.className} slots={slotsByClass.get(cls.id) ?? []} />
                  </Td>
                  <Td>
                    <SlotAdder classId={cls.id} classLabel={cls.className} />
                  </Td>
                </Tr>
              ))}
              {shownClasses.length === 0 && <Empty cols={6}>No classes yet.</Empty>}
            </tbody>
          </Table>
        </Card>

        {/* On phones, one card per class so the slots and the add control stay in view. */}
        <ul className="space-y-2 md:hidden">
          {shownClasses.map((cls) => (
            <li key={cls.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-content">{cls.className}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">
                    {schoolName(cls.schoolId)}, coached by {coachName(cls.coachId)}
                  </div>
                </div>
                <SportBadge sport={cls.sport} />
              </div>
              <div className="mt-3">
                <SlotChips classLabel={cls.className} slots={slotsByClass.get(cls.id) ?? []} />
              </div>
              <div className="mt-3">
                <SlotAdder classId={cls.id} classLabel={cls.className} />
              </div>
            </li>
          ))}
          {shownClasses.length === 0 && (
            <li className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-faint">No classes yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function SlotChips({ slots, classLabel }: { slots: ClassSlot[]; classLabel: string }) {
  const { removeSlot } = useStore();
  if (!slots.length) return <span className="text-faint">None yet</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {slots.map((slot) => {
        const label = `${WEEKDAYS[slot.weekday - 1]} ${timeLabel(slot.startTime)}`;
        return (
          <span
            key={slot.id}
            className="inline-flex items-center gap-1 rounded-sm border border-line bg-elevated py-0.5 pl-2 pr-0.5 font-mono text-[12px] text-content"
          >
            {label}
            <button
              onClick={() => removeSlot(slot.id)}
              aria-label={`Remove ${label} for ${classLabel}`}
              className="rounded-[1px] p-0.5 text-faint transition-colors hover:bg-bad/10 hover:text-bad"
            >
              <Icon name="x" size={12} />
            </button>
          </span>
        );
      })}
    </div>
  );
}

function SlotAdder({ classId, classLabel }: { classId: string; classLabel: string }) {
  const { addSlot } = useStore();
  const [weekday, setWeekday] = useState(1);
  const [time, setTime] = useState("09:00");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!time) return;
    setSaving(true);
    await addSlot(classId, weekday, time);
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={weekday}
        onChange={(e) => setWeekday(Number(e.target.value))}
        aria-label={`Day for a new ${classLabel} slot`}
        className="rounded-sm border border-line bg-surface px-1.5 py-1 text-xs text-content"
      >
        {WEEKDAYS.map((day, index) => (
          <option key={day} value={index + 1}>
            {day}
          </option>
        ))}
      </select>
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        aria-label={`Time for a new ${classLabel} slot`}
        className="rounded-sm border border-line bg-surface px-1.5 py-1 font-mono text-xs text-content"
      />
      <button
        onClick={save}
        disabled={saving}
        className="rounded-sm border border-line px-2 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent disabled:opacity-50"
      >
        {saving ? "Adding…" : "Add"}
      </button>
    </div>
  );
}
