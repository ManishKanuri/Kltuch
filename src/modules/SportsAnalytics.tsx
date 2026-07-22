"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { TODAY } from "@/lib/seed";
import {
  attendanceRate,
  coachLeaderboard,
  completionRate,
  skillAverages,
  sportBreakdown,
} from "@/lib/stats";
import {
  SKILL_LABELS,
  SPORT_COLOR,
  SPORT_ICON,
  type SkillKey,
} from "@/lib/types";
import { Icon } from "@/components/icons";
import {
  Card,
  Meter,
  SectionTitle,
  StarRating,
  StatCard,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

const SKILLS: SkillKey[] = ["motorSkills", "coordination", "fitness", "attitude"];

// Sessions-by-status uses reserved status colors (never a categorical series).
const STATUS_META = [
  { key: "Done", color: "#10b981" },
  { key: "Pending", color: "#f59e0b" },
  { key: "Cancelled", color: "#f43f5e" },
] as const;

export default function SportsAnalytics() {
  const { sessions, classes, coaches, assessments, attendance } = useStore();

  const comp = useMemo(() => completionRate(sessions), [sessions]);
  const att = useMemo(
    () => attendanceRate(attendance, coaches.length, TODAY),
    [attendance, coaches.length]
  );
  const sports = useMemo(
    () => sportBreakdown(classes, sessions),
    [classes, sessions]
  );
  const skills = useMemo(() => skillAverages(assessments), [assessments]);
  const board = useMemo(
    () => coachLeaderboard(coaches, sessions),
    [coaches, sessions]
  );
  const teamAvg = useMemo(() => {
    const vals = SKILLS.map((s) => skills[s]);
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }, [skills]);

  const statusCounts = STATUS_META.map((m) => ({
    ...m,
    n: sessions.filter((s) => s.status === m.key).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Session Completion"
          icon="target"
          tone="blue"
          value={`${comp.rate}%`}
          sub={`${comp.done}/${comp.total} delivered`}
        />
        <StatCard
          label="Coach Attendance"
          icon="attendance"
          tone="tennis"
          value={`${att.rate}%`}
          sub={`${att.present}/${att.total} present today`}
        />
        <StatCard
          label="Avg Skill Rating"
          icon="star"
          tone="orange"
          value={`${teamAvg}`}
          sub="Across all assessed skills"
        />
        <StatCard
          label="Active Classes"
          icon="curriculum"
          tone="neutral"
          value={classes.length}
          sub={`${coaches.length} coaches`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion by sport (categorical + icon + label + value) */}
        <div>
          <SectionTitle icon="trophy">Completion by Sport</SectionTitle>
          <Card className="space-y-4 p-5">
            {sports.map((sp) => (
              <div key={sp.sport}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span
                    className="inline-flex items-center gap-2 font-semibold"
                    style={{ color: SPORT_COLOR[sp.sport] }}
                  >
                    <Icon name={SPORT_ICON[sp.sport]} size={16} />
                    {sp.sport}
                  </span>
                  <span className="font-semibold text-content">
                    {sp.rate}%{" "}
                    <span className="text-xs font-normal text-faint">
                      ({sp.done}/{sp.sessions})
                    </span>
                  </span>
                </div>
                <div className="meter">
                  <div
                    className="h-full origin-left rounded-full animate-grow-bar"
                    style={{
                      width: `${sp.rate}%`,
                      backgroundColor: SPORT_COLOR[sp.sport],
                    }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Skill averages (sequential single hue = magnitude) */}
        <div>
          <SectionTitle icon="analytics">Team Skill Averages</SectionTitle>
          <Card className="space-y-4 p-5">
            {SKILLS.map((sk) => (
              <div key={sk}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-content">
                    {SKILL_LABELS[sk]}
                  </span>
                  <span className="font-semibold text-klutch-blue-bright">
                    {skills[sk]} / 5
                  </span>
                </div>
                <Meter value={(skills[sk] / 5) * 100} tone="blue" />
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Sessions by status */}
      <div>
        <SectionTitle icon="session">Sessions by Status</SectionTitle>
        <Card className="p-5">
          <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full">
            {statusCounts.map((s) =>
              s.n > 0 ? (
                <div
                  key={s.key}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${(s.n / sessions.length) * 100}%`,
                    backgroundColor: s.color,
                  }}
                  title={`${s.key}: ${s.n}`}
                />
              ) : null
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {statusCounts.map((s) => (
              <span key={s.key} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-muted">{s.key}</span>
                <span className="font-semibold text-content">{s.n}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Coach leaderboard */}
      <div>
        <SectionTitle icon="trophy">Coach Leaderboard</SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <Th>Rank</Th>
              <Th>Coach</Th>
              <Th>Sessions Done</Th>
              <Th>Completion</Th>
              <Th>Rating</Th>
            </THead>
            <tbody>
              {board.map((c, i) => (
                <Tr key={c.coachId} i={i}>
                  <Td>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-klutch-orange/15 text-klutch-orange"
                          : "bg-content/8 text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </Td>
                  <Td className="font-semibold text-content">{c.name}</Td>
                  <Td>
                    {c.done}/{c.total}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <Meter value={c.rate} tone="gradient" />
                      </div>
                      <span className="text-xs font-medium text-muted">
                        {c.rate}%
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <StarRating value={c.rating} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
