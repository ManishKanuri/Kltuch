"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  Card,
  PrimaryButton,
  SectionTitle,
  StarRating,
  StatusTag,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

export default function CoachManagement() {
  const {
    coaches,
    schools,
    classes,
    schoolName,
    addCoach,
    setCoachRating,
    toast,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  // schools loads asynchronously from Supabase — starts empty.
  const [schoolId, setSchoolId] = useState("");

  useEffect(() => {
    if (!schoolId && schools.length) setSchoolId(schools[0].id);
  }, [schoolId, schools]);

  function submit() {
    if (!name.trim()) return;
    addCoach({
      name: name.trim(),
      phone: phone.trim() || "+91 —",
      assignedSchoolId: schoolId,
      status: "Active",
      rating: 3,
    });
    toast(`Coach ${name.trim()} added`);
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

      {open && (
        <Card className="animate-fade-up p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Coach name"
              aria-label="Coach name"
              className="k-field"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              aria-label="Phone"
              className="k-field"
            />
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              aria-label="Assigned school"
              className="k-field"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <PrimaryButton icon="check" onClick={submit}>
              Save coach
            </PrimaryButton>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <Th>Coach</Th>
            <Th>Phone</Th>
            <Th>Assigned school</Th>
            <Th>Classes</Th>
            <Th>Status</Th>
            <Th>Performance</Th>
          </THead>
          <tbody>
            {coaches.map((c, i) => {
              const classCount = classes.filter(
                (cl) => cl.coachId === c.id
              ).length;
              return (
                <Tr key={c.id} i={i}>
                  <Td className="font-semibold text-content">{c.name}</Td>
                  <Td className="font-mono text-[13px]">{c.phone}</Td>
                  <Td>{schoolName(c.assignedSchoolId)}</Td>
                  <Td>{classCount}</Td>
                  <Td>
                    <StatusTag value={c.status} />
                  </Td>
                  <Td>
                    <StarRating
                      value={c.rating}
                      onChange={(v) => {
                        setCoachRating(c.id, v);
                        toast(`${c.name} rated ${v}/5`);
                      }}
                    />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
