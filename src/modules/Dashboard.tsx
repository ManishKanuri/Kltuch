"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { TODAY } from "@/lib/seed";
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
  } = useStore();

  const stats = useMemo(() => {
    const today = sessions.filter((s) => s.date === TODAY);
    const doneToday = today.filter((s) => s.status === "Done").length;
    const pendingToday = today.filter((s) => s.status === "Pending").length;
    const presentToday = attendance.filter(
      (a) => a.date === TODAY && a.present
    ).length;
    const assessedClassIds = new Set(assessments.map((a) => a.classId));
    const pendingAssessments = classes.filter(
      (c) => !assessedClassIds.has(c.id)
    ).length;
    const cancelMTD = cancellationRows.filter((r) =>
      r.date.startsWith(TODAY.slice(0, 7))
    ).length;
    return {
      doneToday,
      totalToday: today.length,
      pendingToday,
      presentToday,
      totalCoaches: coaches.length,
      absentToday: coaches.length - presentToday,
      pendingAssessments,
      cancelMTD,
      fitnessAssessed: fitnessAssessments.length,
    };
  }, [sessions, coaches, attendance, assessments, classes, cancellationRows, fitnessAssessments]);

  const sports = useMemo(
    () => sportBreakdown(classes, sessions),
    [classes, sessions]
  );
  const fitnessEngagement = useMemo(() => {
    const scheduled = fitnessAssessments.reduce((sum, record) => sum + record.sessionsScheduled, 0);
    const finished = fitnessAssessments.reduce((sum, record) => sum + record.sessionsFinished, 0);
    const missed = fitnessAssessments.reduce((sum, record) => sum + record.sessionsMissed, 0);
    const attendanceRate = scheduled ? Math.round((finished / scheduled) * 100) : 0;
    return { finished, missed, attendanceRate };
  }, [fitnessAssessments]);

  const activity = useMemo(() => {
    const times = [
      "09:15 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
    ];
    return sessions
      .filter((s) => s.date === TODAY)
      .map((s, i) => {
        const cls = classById(s.classId);
        return {
          key: s.id,
          time: times[i % times.length],
          coach: coachName(s.coachId),
          school: cls ? schoolName(cls.schoolId) : "—",
          sport: cls?.sport,
          action:
            s.status === "Cancelled"
              ? "Session cancelled"
              : `${cls?.className ?? ""} · Curriculum Wk ${s.curriculumWeek}`,
          status: s.status,
        };
      });
  }, [sessions, classById, coachName, schoolName]);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Sessions Today"
          icon="session"
          tone="blue"
          value={
            <>
              {stats.doneToday}
              <span className="text-lg text-faint"> / {stats.totalToday}</span>
            </>
          }
          sub={`${stats.pendingToday} still pending`}
        />
        <StatCard
          label="Coaches Present"
          icon="attendance"
          tone="tennis"
          value={
            <>
              {stats.presentToday}
              <span className="text-lg text-faint"> / {stats.totalCoaches}</span>
            </>
          }
          sub={`${stats.absentToday} absent today`}
        />
        <StatCard
          label="Fitness Baselines"
          icon="assessment"
          tone="orange"
          value={stats.fitnessAssessed}
          sub={`${stats.pendingAssessments} classes pending skills`}
        />
        <StatCard
          label="Cancellations MTD"
          icon="cancel"
          tone="neutral"
          value={stats.cancelMTD}
          sub="June 2025"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2.5">
        <OutlineButton icon="attendance" onClick={() => setActive("coach-attendance")}>
          Mark Attendance
        </OutlineButton>
        <OutlineButton icon="session" onClick={() => setActive("session-tracker")}>
          Log Session
        </OutlineButton>
        <OutlineButton icon="cancel" onClick={() => setActive("cancellation-log")}>
          Log Cancellation
        </OutlineButton>
        <OutlineButton icon="assessment" onClick={() => setActive("student-assessment")}>
          Add Assessment
        </OutlineButton>
        <OutlineButton icon="analytics" onClick={() => setActive("sports-analytics")}>
          Sports Analytics
        </OutlineButton>
        <OutlineButton icon="assessment" onClick={() => setActive("fitness-analytics")}>
          Fitness Analytics
        </OutlineButton>
      </div>

      {/* Sports at a glance */}
      <div>
        <SectionTitle icon="attendance">Fitness Engagement</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Student Attendance" icon="attendance" tone="tennis" value={`${fitnessEngagement.attendanceRate}%`} sub="Across recorded fitness sessions" />
          <StatCard label="Sessions Finished" icon="check-circle" tone="blue" value={fitnessEngagement.finished.toLocaleString()} sub="Student session completions" />
          <StatCard label="Sessions Missed" icon="cancel" tone="orange" value={fitnessEngagement.missed.toLocaleString()} sub="Follow-up opportunities" />
        </div>
      </div>

      {/* Sports at a glance */}
      <div>
        <SectionTitle icon="trophy">Sports at a Glance</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {sports.map((sp) => (
            <Card key={sp.sport} className="p-4">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-2 font-display font-bold"
                  style={{ color: SPORT_COLOR[sp.sport] }}
                >
                  <Icon name={SPORT_ICON[sp.sport]} size={20} />
                  {sp.sport}
                </span>
                <span className="text-sm font-semibold text-content">
                  {sp.rate}%
                </span>
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
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>{sp.classes} classes</span>
                <span>
                  {sp.done}/{sp.sessions} sessions done
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <SectionTitle
          icon="clock"
          right={
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-klutch-tennis" />
              Live
            </span>
          }
        >
          Recent Activity
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
                  <Td className="font-medium text-faint">{r.time}</Td>
                  <Td className="font-semibold text-content">{r.coach}</Td>
                  <Td>{r.school}</Td>
                  <Td>{r.action}</Td>
                  <Td>
                    <StatusTag value={r.status} />
                  </Td>
                </Tr>
              ))}
              {activity.length === 0 && <Empty cols={5}>No activity today.</Empty>}
            </tbody>
          </Table>
          <div className="border-t border-line px-4 py-3 text-xs text-faint">
            Coaches mark attendance and sessions from their mobile screen — the
            admin sees live updates here.
          </div>
        </Card>
      </div>
    </div>
  );
}
