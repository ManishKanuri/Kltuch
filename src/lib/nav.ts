import type { IconName } from "@/components/icons";
import type { Role } from "./types";

export type ModuleKey =
  | "dashboard"
  | "sports-analytics"
  | "coach-management"
  | "coach-attendance"
  | "session-tracker"
  | "cancellation-log"
  | "curriculum-tracker"
  | "student-assessment"
  | "equipment-log"
  | "school-portal"
  | "coach-mobile";

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
    items: [
      { key: "dashboard", label: "Dashboard", icon: "dashboard" },
      { key: "sports-analytics", label: "Sports Analytics", icon: "analytics" },
    ],
  },
  {
    label: "Coaches",
    items: [
      { key: "coach-management", label: "Coach Management", icon: "coaches" },
      { key: "coach-attendance", label: "Coach Attendance", icon: "attendance" },
    ],
  },
  {
    label: "Sessions",
    items: [
      { key: "session-tracker", label: "Session Tracker", icon: "session" },
      { key: "cancellation-log", label: "Cancellation Log", icon: "cancel" },
      { key: "curriculum-tracker", label: "Curriculum Tracker", icon: "curriculum" },
    ],
  },
  {
    label: "Students & Equipment",
    items: [
      { key: "student-assessment", label: "Student Assessment", icon: "assessment" },
      { key: "equipment-log", label: "Equipment Log", icon: "equipment" },
    ],
  },
  {
    label: "Portals",
    items: [
      { key: "school-portal", label: "School Portal", icon: "school" },
      { key: "coach-mobile", label: "Coach Mobile View", icon: "mobile" },
    ],
  },
];

export const PAGE_TITLES: Record<ModuleKey, string> = {
  dashboard: "Admin Dashboard",
  "sports-analytics": "Sports Analytics",
  "coach-management": "Coach Management",
  "coach-attendance": "Coach Attendance",
  "session-tracker": "Session Tracker",
  "cancellation-log": "Cancellation Log",
  "curriculum-tracker": "Curriculum Tracker",
  "student-assessment": "Student Assessment",
  "equipment-log": "Equipment Log",
  "school-portal": "School Portal",
  "coach-mobile": "Coach Mobile View",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  coach: "Coach",
  school: "School",
};

export const ROLE_HOME: Record<Role, ModuleKey> = {
  admin: "dashboard",
  coach: "coach-mobile",
  school: "school-portal",
};
