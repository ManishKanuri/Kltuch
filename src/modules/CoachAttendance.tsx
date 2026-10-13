"use client";

import { useStore } from "@/lib/store";
import { TODAY } from "@/lib/seed";
import { Icon } from "@/components/icons";
import { Card, SectionTitle, StatCard, StatGrid, StatusTag } from "@/components/ui";

export default function CoachAttendance() {
  const { coaches, attendance, toggleAttendance, schoolName, toast } =
    useStore();

  const presentCount = coaches.filter(
    (c) =>
      attendance.find((a) => a.coachId === c.id && a.date === TODAY)?.present
  ).length;

  return (
    <div className="space-y-4">
      <SectionTitle icon="attendance" right={<span className="font-mono text-[12px] text-faint">{TODAY}</span>}>Coach attendance</SectionTitle>

      <StatGrid cols={3}>
        <StatCard
          label="Present"
          icon="check-circle"
          tone="tennis"
          value={presentCount}
          sub="Tapped in today"
        />
        <StatCard
          label="Absent"
          icon="x"
          tone="orange"
          value={coaches.length - presentCount}
          sub="Not marked"
        />
        <StatCard
          label="Total coaches"
          icon="coaches"
          tone="neutral"
          value={coaches.length}
          sub="Across all schools"
        />
      </StatGrid>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.map((c) => {
          const present =
            attendance.find((a) => a.coachId === c.id && a.date === TODAY)
              ?.present ?? false;
          return (
            <Card key={c.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold text-content">{c.name}</div>
                <div className="text-xs text-faint">
                  {schoolName(c.assignedSchoolId)}
                </div>
                <div className="mt-2">
                  <StatusTag value={present ? "Present" : "Absent"} />
                </div>
              </div>
              <button
                onClick={() => {
                  toggleAttendance(c.id);
                  toast(
                    present ? `${c.name} marked absent` : `${c.name} marked present`
                  );
                }}
                className={`relative h-9 w-16 rounded-full transition-colors ${
                  present ? "bg-klutch-field" : "bg-content/20"
                }`}
                aria-label={`Toggle ${c.name}`}
                aria-pressed={present}
              >
                <span
                  className={`absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow transition-[left] duration-200 ease-brand-out ${
                    present ? "left-8" : "left-1"
                  }`}
                >
                  {present && (
                    <Icon
                      name="check"
                      size={14}
                      className="text-klutch-field"
                      strokeWidth={2.6}
                    />
                  )}
                </span>
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
