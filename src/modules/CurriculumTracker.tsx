"use client";

import { useStore } from "@/lib/store";
import { Card, Meter, SectionTitle, SportBadge } from "@/components/ui";

export default function CurriculumTracker() {
  const { curriculum, sessions, schoolName, classById } = useStore();

  return (
    <div className="space-y-4">
      <SectionTitle icon="curriculum">Curriculum Tracker</SectionTitle>
      <p className="-mt-2 text-sm text-muted">
        Which curriculum week each class has reached — so coaches resume from the
        right place. Weeks tick up as sessions are marked Done.
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
                  <div className="font-display text-2xl font-extrabold text-content">
                    Wk {liveWeek}
                  </div>
                  <div className="text-xs text-faint">of {cw.totalWeeks}</div>
                </div>
              </div>
              <div className="mt-3">
                <Meter value={pctVal} tone="gradient" />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-faint">
                <span>{pctVal}% delivered</span>
                <span>Last: {cw.lastDelivered}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
