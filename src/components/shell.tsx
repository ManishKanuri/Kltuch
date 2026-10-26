"use client";

import { useState } from "react";
import { useStore, type StartupStatus } from "@/lib/store";
import { ADMIN_NAV, PAGE_TITLES, ROLE_HOME, ROLE_LABEL, type ModuleKey } from "@/lib/nav";
import { PROGRAMME } from "@/lib/programme";
import type { Role } from "@/lib/types";
import { Icon } from "./icons";
import { Logo, LogoMark } from "./Logo";
import { ThemeToggle } from "./theme";
import { OutlineButton, PrimaryButton, ToastHost } from "./ui";

import Dashboard from "@/modules/Dashboard";
import Sessions from "@/modules/Sessions";
import Timetable from "@/modules/Timetable";
import Coaches from "@/modules/Coaches";
import Attendance from "@/modules/Attendance";
import SchoolView from "@/modules/SchoolView";
import CoachView from "@/modules/CoachView";
import TeamAccess from "@/modules/TeamAccess";

function ModuleView({ m }: { m: ModuleKey }) {
  switch (m) {
    case "dashboard":
      return <Dashboard />;
    case "sessions":
      return <Sessions />;
    case "timetable":
      return <Timetable />;
    case "coaches":
      return <Coaches />;
    case "attendance":
      return <Attendance />;
    case "school-view":
      return <SchoolView />;
    case "coach-view":
      return <CoachView />;
    case "team-access":
      return <TeamAccess />;
  }
}

export default function Shell() {
  const { status, role, actualRole, setRole, openAccess, active, setActive, coachName, currentCoachId, school, userEmail, signOut } =
    useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // With sign-in on, actualRole gates what's real and `role` (an admin's
  // "view as") only changes what's rendered; setRole refuses otherwise.
  const canSwitchRole = !openAccess && actualRole === "admin";

  function switchRole(r: Role) {
    setRole(r);
    setActive(ROLE_HOME[r]);
    setSidebarOpen(false);
  }
  function go(m: ModuleKey) {
    setActive(m);
    setSidebarOpen(false);
  }

  if (status === "choose") return <ViewChooser />;
  if (status !== "ready") return <StartupScreen status={status} onSignOut={signOut} />;

  const isAdmin = role === "admin";
  const shownModule = isAdmin ? active : ROLE_HOME[role];
  const userName =
    role === "coach" ? coachName(currentCoachId) : role === "school" ? (school?.name ?? "School") : (userEmail ?? "KLUTCH admin");

  return (
    <div className="flex min-h-screen">
      {isAdmin && <Sidebar active={active} onGo={go} open={sidebarOpen} openAccess={openAccess} />}
      {isAdmin && sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-klutch-ink/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={PAGE_TITLES[shownModule]}
          role={role}
          userName={userName}
          onSwitchRole={canSwitchRole ? switchRole : undefined}
          onSignOut={signOut}
          openAccess={openAccess}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          showBurger={isAdmin}
          showLogo={!isAdmin}
        />

        <main key={shownModule} className="animate-fade-up min-w-0 flex-1 p-4 md:p-6">
          <ModuleView m={shownModule} />
        </main>

        <footer className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 text-[12px] text-faint md:px-6">
          <span>KLUTCH SportsEd, {PROGRAMME.schoolName}</span>
          <span>{ROLE_LABEL[role]} view</span>
        </footer>
      </div>

      <ToastHost />
    </div>
  );
}

// With sign-in off, each device picks who is using it (remembered until
// "Switch view"). This is a convenience, not security: anyone can pick any view.
function ViewChooser() {
  const { chooseView, coaches, school } = useStore();
  const active = coaches.filter((c) => c.status === "Active");
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <LogoMark size={44} />
      <h1 className="mt-6 font-display text-[2rem] font-black leading-tight tracking-[-0.03em] text-content">
        Who&rsquo;s using the dashboard?
      </h1>
      <p className="mt-2 text-sm text-muted">{PROGRAMME.schoolName}, PET programme for Classes 8–12.</p>

      <div className="mt-6 space-y-3">
        <ChoiceButton
          title="KLUTCH admin"
          body="Programme dashboard, session tracking, timetable, coaches and attendance."
          onClick={() => chooseView("admin")}
        />
        <div className="rounded-lg border border-line bg-surface p-4">
          <div className="font-semibold text-content">Coach</div>
          <div className="mt-0.5 text-[13px] text-muted">Your sessions for the day, reports and attendance.</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {active.map((c) => (
              <button
                key={c.id}
                onClick={() => chooseView("coach", c.id)}
                className="rounded-sm border border-line px-3 py-2.5 text-left text-sm font-semibold text-content transition-colors hover:border-accent"
              >
                {c.name}
              </button>
            ))}
            {active.length === 0 && <p className="col-span-2 text-[13px] text-faint">No coaches yet. The admin adds them.</p>}
          </div>
        </div>
        <ChoiceButton
          title={school?.name ?? "School"}
          body="How the programme is going: sessions delivered, by class and sport, and this week's schedule."
          onClick={() => chooseView("school")}
        />
      </div>

      <p className="mt-6 rounded-sm bg-hue-amber/15 px-3 py-2 text-[12.5px] text-content">
        Sign-in is off for the pilot. Anyone with this link can open any view and record sessions.
      </p>
    </main>
  );
}

function ChoiceButton({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:border-accent"
    >
      <span>
        <span className="block font-semibold text-content">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted">{body}</span>
      </span>
      <Icon name="chevron-right" size={18} className="shrink-0 text-muted" />
    </button>
  );
}

// Shown until the user's role and data have loaded, so nobody sees another
// role's screens or empty tables first; and in place of the app if they can't load.
function StartupScreen({
  status,
  onSignOut,
}: {
  status: Exclude<StartupStatus, "ready" | "choose">;
  onSignOut: () => void;
}) {
  const { openAccess } = useStore();
  const message = {
    "no-profile": ["This account isn’t set up yet", "Ask a KLUTCH admin to invite you again."],
    "no-programme": ["The programme isn’t loaded yet", "Load the JGS timetable and sessions with scripts/seed-jgs.ts."],
    error: ["Couldn’t load your data", "Check your connection, then try again."],
  } as const;
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
          <h1 className="font-display text-xl font-extrabold tracking-[-0.015em] text-content">{message[status][0]}</h1>
          <p className="mt-2 text-sm text-muted">{message[status][1]}</p>
          <div className="mt-5 flex justify-center gap-2">
            {status !== "no-profile" && <PrimaryButton onClick={() => window.location.reload()}>Try again</PrimaryButton>}
            {!openAccess && (
              <OutlineButton icon="log-out" onClick={onSignOut}>
                Sign out
              </OutlineButton>
            )}
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
  openAccess,
}: {
  active: ModuleKey;
  onGo: (m: ModuleKey) => void;
  open: boolean;
  openAccess: boolean;
}) {
  // The sidebar is the brand's "field": the site's royal blue. It's the one
  // saturated surface in the app; content stays quiet.
  return (
    <aside
      className={`fixed z-30 flex h-screen w-64 flex-col overflow-hidden bg-klutch-field-deep text-white transition-transform duration-300 ease-brand-out md:sticky md:top-0 md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="relative px-5 pb-3 pt-5">
        <Logo size={30} className="text-white" />
        <div className="mt-2.5 text-[12px] text-white/60">{PROGRAMME.schoolName}</div>
      </div>

      <nav className="scrollbar-thin relative flex-1 overflow-y-auto px-3 pb-6">
        {ADMIN_NAV.map((section) => (
          <div key={section.label} className="mt-4 first:mt-2">
            <div className="px-3 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/50">{section.label}</div>
            {section.items.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onGo(item.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={`mb-px flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-[14px] transition-colors ${
                    isActive ? "bg-klutch-field font-semibold text-white" : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} size={17} className={isActive ? "text-white" : "text-white/55"} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {openAccess && (
        <p className="mx-3 mb-3 rounded-sm bg-white/[0.08] px-3 py-2 text-[12px] leading-snug text-white/75">
          Sign-in is off for the pilot. Anyone with the link can use this.
        </p>
      )}
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
  openAccess,
  onToggleSidebar,
  showBurger,
  showLogo,
}: {
  title: string;
  role: Role;
  userName: string;
  onSwitchRole?: (r: Role) => void;
  onSignOut: () => void;
  openAccess: boolean;
  onToggleSidebar: () => void;
  showBurger: boolean;
  showLogo: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {showBurger && (
          <button onClick={onToggleSidebar} className="rounded-sm border border-line p-2 text-content md:hidden" aria-label="Toggle menu">
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
        <span className="hidden max-w-[14rem] truncate text-sm font-medium text-content sm:block">{userName}</span>
        {openAccess ? (
          <button
            onClick={onSignOut}
            className="flex h-9 items-center gap-1.5 rounded-sm border border-line px-2.5 text-[13px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Switch view
          </button>
        ) : (
          <button
            onClick={onSignOut}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:border-accent hover:text-accent"
            aria-label="Sign out"
            title="Sign out"
          >
            <Icon name="log-out" size={16} />
          </button>
        )}
      </div>
    </header>
  );
}

function RoleSwitcher({ role, onSwitchRole }: { role: Role; onSwitchRole: (r: Role) => void }) {
  const roles: Role[] = ["admin", "coach", "school"];
  return (
    <div role="group" aria-label="View as" className="flex items-center rounded-sm border border-line bg-elevated p-0.5">
      {roles.map((r) => (
        <button
          key={r}
          onClick={() => onSwitchRole(r)}
          aria-pressed={role === r}
          className={`rounded-[1px] px-3 py-1 text-xs font-semibold capitalize transition-colors ${
            role === r ? "bg-klutch-field text-white" : "text-muted hover:text-content"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
