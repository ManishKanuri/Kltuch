import type { IconName } from "@/components/icons";
import { OPEN_ACCESS } from "./access";
import type { Role } from "./types";

export type ModuleKey =
  | "dashboard"
  | "sessions"
  | "timetable"
  | "coaches"
  | "attendance"
  | "school-view"
  | "coach-view"
  | "team-access";

export interface NavItem {
  key: ModuleKey;
  label: string;
  icon: IconName;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavSection[] = [
  {
    label: "Overview",
    items: [{ key: "dashboard", label: "Dashboard", icon: "dashboard" }],
  },
  {
    label: "Sessions",
    items: [
      { key: "sessions", label: "Session tracking", icon: "session" },
      { key: "timetable", label: "Timetable", icon: "calendar" },
    ],
  },
  {
    label: "Coaches",
    items: [
      { key: "attendance", label: "Coach attendance", icon: "attendance" },
      { key: "coaches", label: "Coaches", icon: "coaches" },
    ],
  },
  {
    label: "Other views",
    items: [
      { key: "school-view", label: "School view", icon: "school" },
      { key: "coach-view", label: "Coach view", icon: "mobile" },
    ],
  },
  // Invites only matter once sign-in is back on.
  ...(OPEN_ACCESS
    ? []
    : [{ label: "Admin", items: [{ key: "team-access" as const, label: "Team access", icon: "coaches" as const }] }]),
];

export const PAGE_TITLES: Record<ModuleKey, string> = {
  dashboard: "Programme Dashboard",
  sessions: "Session Tracking",
  timetable: "Timetable",
  coaches: "Coaches",
  attendance: "Coach Attendance",
  "school-view": "School View",
  "coach-view": "Coach View",
  "team-access": "Team Access",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  coach: "Coach",
  school: "School",
};

export const ROLE_HOME: Record<Role, ModuleKey> = {
  admin: "dashboard",
  coach: "coach-view",
  school: "school-view",
};
