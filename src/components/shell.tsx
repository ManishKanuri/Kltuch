"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  ADMIN_NAV,
  PAGE_TITLES,
  ROLE_HOME,
  ROLE_LABEL,
  type ModuleKey,
} from "@/lib/nav";
import type { StartupStatus } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Icon } from "./icons";
import { Logo, LogoMark } from "./Logo";
import { ThemeToggle } from "./theme";
import { OutlineButton, PrimaryButton, ToastHost } from "./ui";

import Dashboard from "@/modules/Dashboard";
import SportsAnalytics from "@/modules/SportsAnalytics";
import FitnessAnalytics from "@/modules/FitnessAnalytics";
import CoachManagement from "@/modules/CoachManagement";
import CoachAttendance from "@/modules/CoachAttendance";
import SessionTracker from "@/modules/SessionTracker";
import Timetable from "@/modules/Timetable";
import CancellationLog from "@/modules/CancellationLog";
import CurriculumTracker from "@/modules/CurriculumTracker";
import StudentAssessment from "@/modules/StudentAssessment";
import EquipmentLog from "@/modules/EquipmentLog";
import SchoolPortal from "@/modules/SchoolPortal";
import CoachMobile from "@/modules/CoachMobile";
import TeamAccess from "@/modules/TeamAccess";

function ModuleView({ m }: { m: ModuleKey }) {
  switch (m) {
    case "dashboard":
      return <Dashboard />;
    case "sports-analytics":
      return <SportsAnalytics />;
    case "fitness-analytics":
      return <FitnessAnalytics />;
    case "coach-management":
      return <CoachManagement />;
    case "coach-attendance":
      return <CoachAttendance />;
    case "timetable":
      return <Timetable />;
    case "session-tracker":
      return <SessionTracker />;
    case "cancellation-log":
      return <CancellationLog />;
    case "curriculum-tracker":
      return <CurriculumTracker />;
    case "student-assessment":
      return <StudentAssessment />;
    case "equipment-log":
      return <EquipmentLog />;
    case "school-portal":
      return <SchoolPortal />;
    case "coach-mobile":
      return <CoachMobile />;
    case "team-access":
      return <TeamAccess />;
  }
}

export default function Shell() {
  const {
    status,
    role,
    actualRole,
    setRole,
    active,
    setActive,
    coachName,
    currentCoachId,
    userEmail,
    signOut,
  } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // actualRole gates what's real; `role` (possibly a "view as" override) only
  // controls what's rendered, and setRole already refuses to override unless
  // actualRole is admin — see store.tsx.
  const canSwitchRole = actualRole === "admin";

  function switchRole(r: Role) {
    setRole(r);
    setActive(ROLE_HOME[r]);
    setSidebarOpen(false);
  }
  function go(m: ModuleKey) {
    setActive(m);
    setSidebarOpen(false);
  }

  if (status !== "ready") return <StartupScreen status={status} onSignOut={signOut} />;

  const isAdmin = role === "admin";
  const shownModule = isAdmin ? active : ROLE_HOME[role];

  return (
    <div className="flex min-h-screen">
      {isAdmin && <Sidebar active={active} onGo={go} open={sidebarOpen} />}
      {isAdmin && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-klutch-ink/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={PAGE_TITLES[shownModule]}
          role={role}
          userName={role === "coach" ? coachName(currentCoachId) : userEmail ?? "Klutch Admin"}
          onSwitchRole={canSwitchRole ? switchRole : undefined}
          onSignOut={signOut}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          showBurger={isAdmin}
          showLogo={!isAdmin}
        />

        <main key={shownModule} className="animate-fade-up min-w-0 flex-1 p-4 md:p-6">
          <ModuleView m={shownModule} />
        </main>

        <footer className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 text-[12px] text-faint md:px-6">
          <span>KLUTCH SportsEd internal ERP</span>
          <span>{ROLE_LABEL[role]} view</span>
        </footer>
      </div>

      <ToastHost />
    </div>
  );
}

// Shown until the user's role and data have loaded, so nobody sees another
// role's screens or empty tables first; and in place of the app if they can't load.
function StartupScreen({
  status,
  onSignOut,
}: {
  status: Exclude<StartupStatus, "ready">;
  onSignOut: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <LogoMark size={44} />
      {status === "loading" ? (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent motion-reduce:animate-none" />
          Loading your dashboard…
        </p>
      ) : (
        <div role="alert" className="mt-6 max-w-sm">
          <h1 className="font-display text-xl font-extrabold tracking-[-0.015em] text-content">
            {status === "no-profile" ? "This account isn’t set up yet" : "Couldn’t load your data"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {status === "no-profile"
              ? "Ask a KLUTCH admin to invite you again."
              : "Check your connection, then try again."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {status === "error" && (
              <PrimaryButton onClick={() => window.location.reload()}>
                Try again
              </PrimaryButton>
            )}
            <OutlineButton icon="log-out" onClick={onSignOut}>
              Sign out
            </OutlineButton>
          </div>
        </div>
      )}
    </main>
  );
}

function Sidebar({
  active,
  onGo,
  open,
}: {
  active: ModuleKey;
  onGo: (m: ModuleKey) => void;
  open: boolean;
}) {
  // The sidebar is the brand's "field": the site's royal blue. It's the one
  // saturated surface in the app; content stays quiet. (No court-line texture
  // here — it ran behind nav labels and read as noise.)
  return (
    <aside
      className={`fixed z-30 flex h-screen w-64 flex-col overflow-hidden bg-klutch-field-deep text-white transition-transform duration-300 ease-brand-out md:sticky md:top-0 md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="relative px-5 pb-3 pt-5">
        <Logo size={30} className="text-white" />
        <div className="mt-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/55">
          Internal ERP
        </div>
      </div>

      <nav className="scrollbar-thin relative flex-1 overflow-y-auto px-3 pb-6">
        {ADMIN_NAV.map((section) => (
          <div key={section.label} className="mt-4 first:mt-2">
            <div className="px-3 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/50">
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onGo(item.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={`mb-px flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-[14px] transition-colors ${
                    isActive
                      ? "bg-klutch-field font-semibold text-white"
                      : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size={17}
                    className={isActive ? "text-white" : "text-white/55"}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="relative border-t border-white/10 px-5 py-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/45">
        Sport. Structure. Science.
      </div>
    </aside>
  );
}

function TopBar({
  title,
  role,
  userName,
  onSwitchRole,
  onSignOut,
  onToggleSidebar,
  showBurger,
  showLogo,
}: {
  title: string;
  role: Role;
  userName: string;
  onSwitchRole?: (r: Role) => void;
  onSignOut: () => void;
  onToggleSidebar: () => void;
  showBurger: boolean;
  showLogo: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {showBurger && (
          <button
            onClick={onToggleSidebar}
            className="rounded-sm border border-line p-2 text-content md:hidden"
            aria-label="Toggle menu"
          >
            <Icon name="menu" size={18} />
          </button>
        )}
        {showLogo && <LogoMark size={30} className="shrink-0" />}
        <h1 className="truncate font-display text-[1.375rem] font-black uppercase leading-none tracking-[-0.025em] text-content">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Phone headers have no room for it; the sidebar still links to the coach and school screens. */}
        {onSwitchRole && (
          <div className="hidden sm:block">
            <RoleSwitcher role={role} onSwitchRole={onSwitchRole} />
          </div>
        )}
        <ThemeToggle />
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-klutch-field text-[11px] font-semibold text-white">
            {userName
              .split(/[@\s.]/)
              .filter(Boolean)
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <span className="max-w-[12rem] truncate text-sm font-medium text-content">{userName}</span>
        </div>
        <button
          onClick={onSignOut}
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:border-accent hover:text-accent"
          aria-label="Sign out"
          title="Sign out"
        >
          <Icon name="log-out" size={16} />
        </button>
      </div>
    </header>
  );
}

function RoleSwitcher({
  role,
  onSwitchRole,
}: {
  role: Role;
  onSwitchRole: (r: Role) => void;
}) {
  const roles: Role[] = ["admin", "coach", "school"];
  return (
    <div
      role="group"
      aria-label="View as"
      className="flex items-center rounded-sm border border-line bg-elevated p-0.5"
    >
      {roles.map((r) => (
        <button
          key={r}
          onClick={() => onSwitchRole(r)}
          aria-pressed={role === r}
          className={`rounded-[1px] px-3 py-1 text-xs font-semibold capitalize transition-colors ${
            role === r
              ? "bg-klutch-field text-white"
              : "text-muted hover:text-content"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
