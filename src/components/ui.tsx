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
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={ref}
        className={`animate-fade-up scrollbar-thin max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
});

// ---------------- Status tags ----------------
const STATUS_STYLES: Record<string, string> = {
  Done: "bg-emerald-500/12 text-emerald-500 ring-emerald-500/25",
  Present: "bg-emerald-500/12 text-emerald-500 ring-emerald-500/25",
  Active: "bg-emerald-500/12 text-emerald-500 ring-emerald-500/25",
  Good: "bg-emerald-500/12 text-emerald-500 ring-emerald-500/25",
  Pending: "bg-amber-500/14 text-amber-500 ring-amber-500/25",
  Fair: "bg-amber-500/14 text-amber-500 ring-amber-500/25",
  Absent: "bg-rose-500/12 text-rose-500 ring-rose-500/25",
  Cancelled: "bg-rose-500/12 text-rose-500 ring-rose-500/25",
  Damaged: "bg-rose-500/12 text-rose-500 ring-rose-500/25",
  Replace: "bg-rose-500/12 text-rose-500 ring-rose-500/25",
  Inactive: "bg-content/10 text-muted ring-content/15",
  School: "bg-klutch-blue/15 text-klutch-blue-bright ring-klutch-blue/30",
  KLUTCH: "bg-klutch-orange/15 text-klutch-orange-bright ring-klutch-orange/30",
};

export function StatusTag({ value }: { value: string }) {
  const cls = STATUS_STYLES[value] ?? "bg-content/8 text-muted ring-content/15";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ${cls}`}
    >
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
    <div
      className={`rounded-2xl border border-line bg-surface shadow-card dark:shadow-card-dark ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------- Stat card ----------------
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
  tone?: "blue" | "orange" | "tennis" | "neutral";
}) {
  const bar =
    tone === "orange"
      ? "before:bg-klutch-orange"
      : tone === "tennis"
        ? "before:bg-klutch-tennis-deep"
        : tone === "neutral"
          ? "before:bg-line"
          : "before:bg-klutch-blue";
  const iconTone =
    tone === "orange"
      ? "bg-klutch-orange/12 text-klutch-orange"
      : tone === "tennis"
        ? "bg-klutch-tennis-deep/12 text-klutch-tennis-deep"
        : tone === "neutral"
          ? "bg-content/8 text-faint"
          : "bg-klutch-blue/12 text-klutch-blue-bright";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-card dark:shadow-card-dark before:absolute before:inset-x-0 before:top-0 before:h-[3px] ${bar}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          {label}
        </div>
        {icon && (
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
            <Icon name={icon} size={15} />
          </div>
        )}
      </div>
      <div className="mt-2 font-display text-4xl font-extrabold leading-none tracking-tight text-content">
        {value}
      </div>
      {sub ? <div className="mt-1.5 text-xs text-muted">{sub}</div> : null}
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
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-display text-base font-bold text-content">
        <span className="h-5 w-1.5 rounded-full bg-brand-gradient" />
        {icon && <Icon name={icon} size={18} className="text-klutch-blue-bright" />}
        {children}
      </h2>
      {right}
    </div>
  );
}

// ---------------- Buttons ----------------
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
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
      className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-content transition hover:border-klutch-blue-bright hover:text-klutch-blue-bright"
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          className="text-klutch-blue-bright transition group-hover:scale-110"
        />
      )}
      {children}
    </button>
  );
}

// ---------------- Star rating ----------------
export function StarRating({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`${
            n <= value ? "text-klutch-orange" : "text-content/20"
          } ${onChange ? "cursor-pointer transition hover:scale-125" : "cursor-default"}`}
          aria-label={`${n} star`}
        >
          <StarGlyph filled={n <= value} size={size} />
        </button>
      ))}
    </div>
  );
}

export function RatingPill({ n }: { n: number }) {
  const color =
    n >= 4 ? "text-emerald-500" : n === 3 ? "text-amber-500" : "text-rose-500";
  return <span className={`text-sm font-semibold ${color}`}>{n}/5</span>;
}

// ---------------- Meter ----------------
export function Meter({
  value,
  tone = "blue",
}: {
  value: number; // 0-100
  tone?: "blue" | "orange" | "tennis" | "gradient";
}) {
  const fill =
    tone === "orange"
      ? "bg-klutch-orange"
      : tone === "tennis"
        ? "bg-klutch-tennis-deep"
        : tone === "gradient"
          ? "bg-brand-gradient"
          : "bg-klutch-blue";
  return (
    <div className="meter">
      <div
        className={`h-full origin-left rounded-full ${fill} animate-grow-bar`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// ---------------- Sport badge ----------------
export function SportBadge({
  sport,
  showLabel = true,
}: {
  sport: Sport;
  showLabel?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1"
      style={{
        color: SPORT_COLOR[sport],
        backgroundColor: `${SPORT_COLOR[sport]}1f`,
        boxShadow: `inset 0 0 0 1px ${SPORT_COLOR[sport]}40`,
      }}
    >
      <Icon name={SPORT_ICON[sport]} size={13} />
      {showLabel && sport}
    </span>
  );
}

// ---------------- Table ----------------
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
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
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-klutch-blue-bright">
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
      className={`border-b border-line/60 transition hover:bg-klutch-blue/[0.04] ${
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
    <div className="animate-fade-up pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-content shadow-card dark:shadow-card-dark">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white">
        <Icon name="check" size={14} strokeWidth={2.4} />
      </span>
      <span className="flex-1">{text}</span>
    </div>
  );
}
