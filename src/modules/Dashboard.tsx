"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { bySchedule, monthLabel, timeLabel, todayISO } from "@/lib/dates";
import { sportBreakdown } from "@/lib/stats";
import { SPORT_COLOR, SPORT_ICON } from "@/lib/types";
import { Icon } from "@/components/icons";
import {
  Card,
  Empty,
  Meter,
  OutlineButton,
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

export default function Dashboard() {
  const {
    sessions,
    coaches,
    attendance,
    assessments,
    fitnessAssessments,
    classes,
    cancellationRows,
    coachName,
    classById,
    schoolName,
    setActive,
    live,
  } = useStore();
  const today = todayISO();

  const stats = useMemo(() => {
    const todaySessions = sessions.filter((s) => s.date === today);
    const doneToday = todaySessions.filter((s) => s.status === "Done").length;
    const pendingToday = todaySessions.filter((s) => s.status === "Pending").length;
    const presentToday = attendance.filter(
      (a) => a.date === today && a.present
    ).length;
    const assessedClassIds = new Set(assessments.map((a) => a.classId));
    const pendingAssessments = classes.filter(
      (c) => !assessedClassIds.has(c.id)
    ).length;
    const cancelMTD = cancellationRows.filter((r) =>
      r.date.startsWith(today.slice(0, 7))
    ).length;
    return {
      doneToday,
      totalToday: todaySessions.length,
      pendingToday,
      presentToday,
      totalCoaches: coaches.length,
      absentToday: coaches.length - presentToday,
      pendingAssessments,
      cancelMTD,
      fitnessAssessed: fitnessAssessments.length,
    };
  }, [today, sessions, coaches, attendance, assessments, classes, cancellationRows, fitnessAssessments]);

  // Completion counts sessions up to today; future ones from the timetable aren't due yet.
  const sports = useMemo(
    () => sportBreakdown(classes, sessions.filter((s) => s.date <= today)),
    [classes, sessions, today]
  );
  const fitnessEngagement = useMemo(() => {
    const scheduled = fitnessAssessments.reduce((sum, record) => sum + record.sessionsScheduled, 0);
    const finished = fitnessAssessments.reduce((sum, record) => sum + record.sessionsFinished, 0);
    const missed = fitnessAssessments.reduce((sum, record) => sum + record.sessionsMissed, 0);
    const attendanceRate = scheduled ? Math.round((finished / scheduled) * 100) : 0;
    return { finished, missed, attendanceRate };
  }, [fitnessAssessments]);

  const activity = useMemo(() => {
    return sessions
      .filter((s) => s.date === today)
      .sort(bySchedule)
      .map((s) => {
        const cls = classById(s.classId);
        return {
          key: s.id,
          time: timeLabel(s.startTime) || "—",
          coach: coachName(s.coachId),
          school: cls ? schoolName(cls.schoolId) : "—",
          sport: cls?.sport,
          action:
            s.status === "Cancelled"
              ? "Session cancelled"
              : `${cls?.className ?? ""}, curriculum week ${s.curriculumWeek}`,
          status: s.status,
        };
      });
  }, [today, sessions, classById, coachName, schoolName]);

  return (
    <div className="space-y-7">
      <StatGrid cols={4}>
        <StatCard
          label="Sessions today"
          icon="session"
          tone="blue"
          value={
            <>
              {stats.doneToday}
              <span className="text-xl text-faint">/{stats.totalToday}</span>
            </>
          }
          sub={`${stats.pendingToday} still pending`}
        />
        <StatCard
          label="Coaches present"
          icon="attendance"
          tone="tennis"
          value={
            <>
              {stats.presentToday}
              <span className="text-xl text-faint">/{stats.totalCoaches}</span>
            </>
          }
          sub={`${stats.absentToday} absent today`}
        />
        <StatCard
          label="Fitness baselines"
          icon="assessment"
          tone="orange"
          value={stats.fitnessAssessed.toLocaleString()}
          sub={`${stats.pendingAssessments} classes still need skill ratings`}
        />
        <StatCard
          label="Cancellations this month"
          icon="cancel"
          tone="neutral"
          value={stats.cancelMTD}
          sub={monthLabel(today)}
        />
      </StatGrid>

      <div className="flex flex-wrap gap-2">
        <OutlineButton icon="attendance" onClick={() => setActive("coach-attendance")}>
          Mark attendance
        </OutlineButton>
        <OutlineButton icon="session" onClick={() => setActive("session-tracker")}>
          Log session
        </OutlineButton>
        <OutlineButton icon="cancel" onClick={() => setActive("cancellation-log")}>
          Log cancellation
        </OutlineButton>
        <OutlineButton icon="assessment" onClick={() => setActive("student-assessment")}>
          Add assessment
        </OutlineButton>
      </div>

      <div>
        <SectionTitle icon="attendance">Fitness engagement</SectionTitle>
        <StatGrid cols={3}>
          <StatCard label="Student attendance" icon="attendance" tone="tennis" value={`${fitnessEngagement.attendanceRate}%`} sub="Across recorded fitness sessions" />
          <StatCard label="Sessions finished" icon="check-circle" tone="blue" value={fitnessEngagement.finished.toLocaleString()} sub="Student session completions" />
          <StatCard label="Sessions missed" icon="cancel" tone="orange" value={fitnessEngagement.missed.toLocaleString()} sub="Worth a follow-up with the school" />
        </StatGrid>
      </div>

      <div>
        <SectionTitle icon="trophy">Sports at a glance</SectionTitle>
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {sports.map((sp) => (
            <div key={sp.sport} className="bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-display text-[1.0625rem] font-extrabold tracking-[-0.015em] text-content">
                  <Icon name={SPORT_ICON[sp.sport]} size={19} style={{ color: SPORT_COLOR[sp.sport] }} />
                  {sp.sport}
                </span>
                <span className="font-mono text-sm font-bold text-content">{sp.rate}%</span>
              </div>
              <div className="mt-3">
                <Meter
                  value={sp.rate}
                  tone={
                    sp.sport === "Football"
                      ? "blue"
                      : sp.sport === "Basketball"
                        ? "orange"
                        : "tennis"
                  }
                />
              </div>
              <div className="mt-2.5 flex justify-between text-[12.5px] text-muted">
                <span>{sp.classes} classes</span>
                <span className="font-mono">
                  {sp.done}/{sp.sessions} sessions done
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle
          icon="clock"
          right={
            <span role="status" className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse-dot bg-hue-lime" : "bg-faint"}`} />
              {live ? "Live" : "Connecting"}
            </span>
          }
        >
          Today’s sessions
        </SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <Th>Time</Th>
              <Th>Coach</Th>
              <Th>School</Th>
              <Th>Activity</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {activity.map((r, i) => (
                <Tr key={r.key} i={i}>
                  <Td className="font-mono text-[13px] text-faint">{r.time}</Td>
                  <Td className="font-semibold text-content">{r.coach}</Td>
                  <Td>{r.school}</Td>
                  <Td>{r.action}</Td>
                  <Td>
                    <StatusTag value={r.status} />
                  </Td>
                </Tr>
              ))}
              {activity.length === 0 && <Empty cols={5}>No sessions scheduled today.</Empty>}
            </tbody>
          </Table>
          <div className="border-t border-line px-4 py-3 text-[12.5px] text-faint">
            Coaches log attendance and sessions from their phones, and changes show up here as they happen.
          </div>
        </Card>
      </div>
    </div>
  );
}
