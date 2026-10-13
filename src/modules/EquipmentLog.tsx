"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/dates";
import type { EquipmentCondition, EquipmentStatus } from "@/lib/types";
import {
  Card,
  PrimaryButton,
  SectionTitle,
  StatCard,
  StatGrid,
  StatusTag,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

export default function EquipmentLog() {
  const {
    equipment,
    schools,
    schoolName,
    addEquipment,
    updateEquipmentStatus,
    toast,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [item, setItem] = useState("");
  const [qty, setQty] = useState(1);
  // schools loads asynchronously from Supabase — starts empty.
  const [schoolId, setSchoolId] = useState("");

  useEffect(() => {
    if (!schoolId && schools.length) setSchoolId(schools[0].id);
  }, [schoolId, schools]);

  const needsReplace = equipment.filter((e) => e.status === "Replace").length;

  function submit() {
    if (!item.trim()) return;
    addEquipment({
      itemName: item.trim(),
      qty,
      schoolId,
      condition: "Good",
      dateIssued: todayISO(),
      status: "Active",
    });
    toast(`${item.trim()} added to inventory`);
    setItem("");
    setQty(1);
    setOpen(false);
  }

  function cycleCondition(id: string, current: EquipmentCondition) {
    const next: EquipmentCondition =
      current === "Good" ? "Fair" : current === "Fair" ? "Damaged" : "Good";
    const status: EquipmentStatus = next === "Damaged" ? "Replace" : "Active";
    updateEquipmentStatus(id, next, status);
    toast(`Condition set to ${next}`);
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon="equipment"
        right={
          <PrimaryButton icon="plus" onClick={() => setOpen((v) => !v)}>
            Add equipment
          </PrimaryButton>
        }
      >
        Equipment
      </SectionTitle>

      <StatGrid cols={3}>
        <StatCard
          label="Total items"
          icon="equipment"
          tone="blue"
          value={equipment.reduce((s, e) => s + e.qty, 0)}
          sub={`${equipment.length} line items`}
        />
        <StatCard
          label="Needs replacing"
          icon="cancel"
          tone="orange"
          value={needsReplace}
          sub="Damaged items"
        />
        <StatCard
          label="Schools covered"
          icon="school"
          tone="neutral"
          value={new Set(equipment.map((e) => e.schoolId)).size}
          sub="With equipment issued"
        />
      </StatGrid>

      {open && (
        <Card className="animate-fade-up p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Item name"
              aria-label="Item name"
              className="k-field"
            />
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              aria-label="Quantity"
              className="k-field"
            />
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              aria-label="School"
              className="k-field"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <PrimaryButton icon="check" onClick={submit}>
              Save item
            </PrimaryButton>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <Th>Item</Th>
            <Th>Qty</Th>
            <Th>School</Th>
            <Th>Date issued</Th>
            <Th>Condition</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {equipment.map((e, i) => (
              <Tr key={e.id} i={i}>
                <Td className="font-semibold text-content">{e.itemName}</Td>
                <Td className="font-mono">{e.qty}</Td>
                <Td>{schoolName(e.schoolId)}</Td>
                <Td className="font-mono text-[13px]">{e.dateIssued}</Td>
                <Td>
                  <button
                    onClick={() => cycleCondition(e.id, e.condition)}
                    aria-label={`Change condition, currently ${e.condition}`}
                    className="rounded-sm border border-line px-2 py-1 transition-colors hover:border-accent"
                  >
                    <StatusTag value={e.condition} />
                  </button>
                </Td>
                <Td>
                  <StatusTag value={e.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <div className="border-t border-line px-4 py-3 text-xs text-faint">
          Click a condition to step it from Good to Fair to Damaged. Damaged
          items are flagged for replacement.
        </div>
      </Card>
    </div>
  );
}
