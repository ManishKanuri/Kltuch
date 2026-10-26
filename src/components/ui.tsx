"use client";

import { forwardRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/store";
import { Icon, StarGlyph, type IconName } from "./icons";
import { SPORT_COLOR, SPORT_ICON, type Sport } from "@/lib/types";

// ---------------- Modal ----------------
// Rendered via a portal to document.body. Without this, a `position: fixed`
// overlay nested under <main> (which has a transform-based animation class)
// gets pinned relative to <main> instead of the viewport — a CSS quirk where
// any ancestor `transform` creates a new containing block for fixed
// descendants. Portaling to <body> sidesteps that entirely.
export const Modal = forwardRef<
  HTMLDivElement,
  { onClose: () => void; children: React.ReactNode; className?: string }
>(function Modal({ onClose, children, className = "" }, ref) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-klutch-ink/70 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={ref}
        className={`animate-fade-up scrollbar-thin max-h-[90vh] w-full overflow-y-auto rounded-lg border border-line bg-surface shadow-modal ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
});

// ---------------- Status tags ----------------
// Neutral mono word + a colored square marker, the same treatment as the
// status words on the site's report card. Keeping the text in the content
// color (not the hue) keeps lime/amber legible on paper.
const STATUS_MARKER: Record<string, string> = {
  Done: "bg-hue-lime",
  Present: "bg-hue-lime",
  Active: "bg-hue-lime",
  Postponed: "bg-hue-amber",
  "Not Done": "bg-hue-orange",
  Cancelled: "bg-hue-orange",
  Missed: "bg-hue-orange",
  Absent: "bg-hue-orange",
  "Not reported": "bg-faint",
  Upcoming: "bg-line",
  Inactive: "bg-faint",
  School: "bg-hue-blue",
  KLUTCH: "bg-hue-orange",
};

export function StatusTag({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-content">
      <span className={`h-[7px] w-[7px] shrink-0 rounded-[1px] ${STATUS_MARKER[value] ?? "bg-faint"}`} />
      {value}
    </span>
  );
}

// ---------------- Card ----------------
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-line bg-surface ${className}`}>
      {children}
    </div>
  );
}

// ---------------- Stat grid + stat card ----------------
// Stats sit in one hairline-joined strip (like the site's offer grid) rather
// than as separate floating cards. StatCard is a cell; StatGrid is the frame.
export function StatGrid({
  cols,
  children,
}: {
  cols: 3 | 4;
  children: React.ReactNode;
}) {
  const layout = cols === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3";
  return (
    <div className={`grid gap-px overflow-hidden rounded-lg border border-line bg-line ${layout}`}>
      {children}
    </div>
  );
}

const STAT_ICON_TONE = {
  blue: "text-accent",
  orange: "text-bad",
  tennis: "text-good",
  neutral: "text-faint",
} as const;

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: IconName;
  tone?: keyof typeof STAT_ICON_TONE;
}) {
  return (
    <div className="bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon && <Icon name={icon} size={16} className={STAT_ICON_TONE[tone]} />}
      </div>
      <div className="mt-3 font-display text-[2.5rem] font-black leading-none tracking-[-0.035em] tabular-nums text-content">
        {value}
      </div>
      {sub ? <div className="mt-2 text-[13px] text-muted">{sub}</div> : null}
    </div>
  );
}

// ---------------- Section title ----------------
export function SectionTitle({
  children,
  icon,
  right,
}: {
  children: React.ReactNode;
  icon?: IconName;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-[1.1875rem] font-extrabold tracking-[-0.02em] text-content">
        {icon && <Icon name={icon} size={17} className="text-accent" />}
        {children}
      </h2>
      {right}
    </div>
  );
}

// ---------------- Buttons ----------------
// Primary = the site's solid orange CTA. No gradients, no glow.
export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-sm bg-klutch-cta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-klutch-cta-hover active:translate-y-px disabled:cursor-not-allowed disabled:bg-content/[0.08] disabled:text-faint"
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: IconName;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-3.5 py-2 text-sm font-medium text-content transition-colors hover:border-accent hover:text-accent"
    >
      {icon && <Icon name={icon} size={16} className="text-accent" />}
      {children}
    </button>
  );
}

// ---------------- Star rating ----------------
export function StarRating({
  value,
  onChange,
  size = 16,
  onDark = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  // On the fixed navy report panel, theme colors would vanish in light mode.
  onDark?: boolean;
}) {
  const on = onDark ? "text-klutch-orange-bright" : "text-hue-orange";
  const off = onDark ? "text-white/25" : "text-content/20";
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`${n <= value ? on : off} ${
            onChange ? "cursor-pointer transition-opacity hover:opacity-75" : "cursor-default"
          }`}
          aria-label={`${n} star`}
        >
          <StarGlyph filled={n <= value} size={size} />
        </button>
      ))}
    </div>
  );
}

export function RatingPill({ n }: { n: number }) {
  const color = n >= 4 ? "text-good" : n === 3 ? "text-warn" : "text-bad";
  return <span className={`font-mono text-sm font-bold tabular-nums ${color}`}>{n}/5</span>;
}

// ---------------- Meter ----------------
const METER_FILL = {
  blue: "bg-hue-blue",
  orange: "bg-hue-orange",
  tennis: "bg-hue-lime",
} as const;

export function Meter({
  value,
  tone = "blue",
}: {
  value: number; // 0-100
  tone?: keyof typeof METER_FILL;
}) {
  return (
    <div className="meter">
      <div
        className={`h-full origin-left rounded-full ${METER_FILL[tone]} animate-grow-bar`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// ---------------- Sport badge ----------------
// Icon carries the sport hue; the label stays in the content color so the
// lime Tennis badge is still readable on paper.
export function SportBadge({
  sport,
  showLabel = true,
}: {
  sport: Sport | null;
  showLabel?: boolean;
}) {
  if (!sport) {
    return (
      <span className="inline-flex items-center rounded-sm border border-dashed border-line px-1.5 py-0.5 text-[12px] font-medium text-muted">
        Sport to confirm
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-elevated px-1.5 py-0.5 text-[12px] font-medium text-content">
      <Icon name={SPORT_ICON[sport]} size={13} style={{ color: SPORT_COLOR[sport] }} />
      {showLabel && sport}
    </span>
  );
}

// ---------------- Table ----------------
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line bg-elevated">{children}</tr>
    </thead>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold text-muted">
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 text-muted ${className}`}>
      {children}
    </td>
  );
}

export function Tr({
  children,
  i,
}: {
  children: React.ReactNode;
  i: number;
}) {
  return (
    <tr
      className={`border-b border-line/70 transition-colors last:border-b-0 hover:bg-accent/[0.05] ${
        i % 2 === 1 ? "row-alt" : ""
      }`}
    >
      {children}
    </tr>
  );
}

export function Empty({
  children,
  cols,
}: {
  children: React.ReactNode;
  cols: number;
}) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center text-sm text-faint">
        {children}
      </td>
    </tr>
  );
}

// ---------------- Toasts ----------------
export function ToastHost() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} text={t.text} onDone={dismissToast} />
      ))}
    </div>
  );
}

function ToastItem({
  id,
  text,
  onDone,
}: {
  id: number;
  text: string;
  onDone: (id: number) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDone(id), 2600);
    return () => clearTimeout(t);
  }, [id, onDone]);
  return (
    <div
      role="status"
      className="animate-fade-up pointer-events-auto flex items-center gap-3 rounded-lg border border-white/10 bg-klutch-ink px-4 py-3 text-sm text-white shadow-modal"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-klutch-lime-bright text-klutch-ink">
        <Icon name="check" size={14} strokeWidth={2.4} />
      </span>
      <span className="flex-1">{text}</span>
    </div>
  );
}
