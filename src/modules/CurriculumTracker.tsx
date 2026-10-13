"use client";

import { useStore } from "@/lib/store";
import { Card, Meter, SectionTitle, SportBadge } from "@/components/ui";

export default function CurriculumTracker() {
  const { curriculum, sessions, schoolName, classById } = useStore();

  return (
    <div className="space-y-4">
      <SectionTitle icon="curriculum">Curriculum tracker</SectionTitle>
      <p className="-mt-2 text-sm text-muted">
        The curriculum week each class has reached, so coaches pick up in the
        right place. Weeks advance as sessions are marked Done.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {curriculum.map((cw) => {
          const cls = classById(cw.classId);
          const liveWeek = Math.max(
            cw.currentWeek,
            ...sessions
              .filter((s) => s.classId === cw.classId)
              .map((s) => s.curriculumWeek)
          );
          const pctVal = Math.round((liveWeek / cw.totalWeeks) * 100);
          return (
            <Card key={cw.classId} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-content">
                    {cls?.className}
                  </div>
                  <div className="mt-0.5 text-xs text-faint">
                    {cls ? schoolName(cls.schoolId) : ""}
                  </div>
                  {cls && (
                    <div className="mt-1.5">
                      <SportBadge sport={cls.sport} />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-display text-[1.75rem] font-black leading-none tracking-[-0.03em] text-content">
                    Wk {liveWeek}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-faint">of {cw.totalWeeks}</div>
                </div>
              </div>
              <div className="mt-3">
                <Meter value={pctVal} tone="blue" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-faint">
                <span>{pctVal}% delivered</span>
                <span>Last {cw.lastDelivered}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
