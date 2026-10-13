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
import type { Role } from "@/lib/types";
import { Icon } from "./icons";
import { Logo, LogoMark } from "./Logo";
import { ThemeToggle } from "./theme";
import { ToastHost } from "./ui";

import Dashboard from "@/modules/Dashboard";
import SportsAnalytics from "@/modules/SportsAnalytics";
import FitnessAnalytics from "@/modules/FitnessAnalytics";
import CoachManagement from "@/modules/CoachManagement";
import CoachAttendance from "@/modules/CoachAttendance";
import SessionTracker from "@/modules/SessionTracker";
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

  const isAdmin = role === "admin";
  const shownModule = isAdmin ? active : ROLE_HOME[role];

  return (
    <div className="flex min-h-screen">
      {isAdmin && <Sidebar active={active} onGo={go} open={sidebarOpen} />}
      {isAdmin && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
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

        <footer className="border-t border-line px-6 py-3 text-[11px] text-faint">
          KLUTCH SportsEd · Internal ERP · {ROLE_LABEL[role]} view
        </footer>
      </div>

      <ToastHost />
    </div>
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
  return (
    <aside
      className={`fixed z-30 flex h-screen w-64 flex-col bg-klutch-ink bg-sidebar-glow text-slate-300 transition-transform md:sticky md:top-0 md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="px-5 py-5">
        <Logo size={34} className="text-white" />
        <div className="mt-1.5 pl-[44px] text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Internal ERP
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-6">
        {ADMIN_NAV.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onGo(item.key)}
                  className={`group relative mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isActive
                      ? "bg-white/[0.06] font-semibold text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient" />
                  )}
                  <Icon
                    name={item.icon}
                    size={18}
                    className={
                      isActive
                        ? "text-klutch-orange-bright"
                        : "text-slate-500 group-hover:text-klutch-blue-bright"
                    }
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-white/5 px-5 py-4 text-[11px] text-slate-500">
        <span className="h-2 w-2 shrink-0 animate-pulse-dot rounded-full bg-klutch-tennis" />
        Rs.0 infra · React + Supabase-ready
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
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {showBurger && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg border border-line p-2 text-content md:hidden"
            aria-label="Toggle menu"
          >
            <Icon name="menu" size={18} />
          </button>
        )}
        {showLogo && <LogoMark size={30} className="shrink-0" />}
        <h1 className="truncate font-display text-lg font-bold text-content md:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {onSwitchRole && <RoleSwitcher role={role} onSwitchRole={onSwitchRole} />}
        <ThemeToggle />
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            {userName
              .split(/[@\s]/)
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <span className="max-w-[12rem] truncate text-sm font-medium text-content">{userName}</span>
        </div>
        <button
          onClick={onSignOut}
          className="rounded-lg border border-line p-2 text-muted transition hover:border-klutch-blue-bright hover:text-content"
          aria-label="Sign out"
          title="Sign out"
        >
          <Icon name="x" size={16} />
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
    <div className="flex items-center rounded-full border border-line bg-elevated p-0.5">
      {roles.map((r) => (
        <button
          key={r}
          onClick={() => onSwitchRole(r)}
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
            role === r
              ? "bg-brand-gradient text-white shadow-brand"
              : "text-muted hover:text-content"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
