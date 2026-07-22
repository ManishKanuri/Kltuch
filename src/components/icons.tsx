import type { CSSProperties } from "react";

export type IconName =
  | "dashboard"
  | "coaches"
  | "attendance"
  | "session"
  | "cancel"
  | "curriculum"
  | "assessment"
  | "equipment"
  | "school"
  | "mobile"
  | "analytics"
  | "check"
  | "check-circle"
  | "plus"
  | "download"
  | "sun"
  | "moon"
  | "menu"
  | "bell"
  | "chevron-right"
  | "chevron-down"
  | "x"
  | "trophy"
  | "flame"
  | "whistle"
  | "calendar"
  | "clock"
  | "target"
  | "trend-up"
  | "trend-down"
  | "sparkle"
  | "star"
  | "filter"
  | "wave"
  | "football"
  | "basketball"
  | "tennis";

const P: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  coaches: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M2 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
      <path d="M17 7.5a3 3 0 0 1 0 5" />
      <path d="M20 21v-1a4 4 0 0 0-3-3.8" />
    </>
  ),
  attendance: (
    <>
      <circle cx="9" cy="7" r="3.2" />
      <path d="M3.5 20v-1a5 5 0 0 1 5-5h1.5" />
      <path d="m14.5 17.5 2 2 4-4" />
    </>
  ),
  session: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="m9 13 2 2 4-4" />
    </>
  ),
  cancel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
  curriculum: (
    <>
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v16H5.5A2.5 2.5 0 0 0 3 21.5z" />
      <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v16h5.5a2.5 2.5 0 0 1 2.5 2.5z" />
    </>
  ),
  assessment: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="m12 6 1.2 2.5 2.8.3-2 1.9.5 2.8L12 14l-2.5 1.5.5-2.8-2-1.9 2.8-.3z" />
      <path d="M8.5 14.5 7 22l5-2.5L17 22l-1.5-7.5" />
    </>
  ),
  equipment: (
    <>
      <path d="M6.5 6.5 17.5 17.5" />
      <rect x="2.2" y="6.4" width="4" height="7" rx="1.3" transform="rotate(-45 4.2 9.9)" />
      <rect x="17.8" y="10.6" width="4" height="7" rx="1.3" transform="rotate(-45 19.8 14.1)" />
    </>
  ),
  school: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M6 10v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
    </>
  ),
  mobile: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  analytics: (
    <>
      <path d="M3 21h18" />
      <rect x="5" y="11" width="3.5" height="7" rx="1" />
      <rect x="10.2" y="6" width="3.5" height="12" rx="1" />
      <rect x="15.5" y="13.5" width="3.5" height="4.5" rx="1" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M9 20h6M12 14v6" />
    </>
  ),
  flame: (
    <path d="M12 3s5 3.5 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s0 2 1.5 2.5C10 12 9 8 12 3Z" />
  ),
  whistle: (
    <>
      <path d="M13 8h8v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V8Z" />
      <circle cx="6.5" cy="12.5" r="0" />
      <path d="M13 10 4 7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  "trend-up": <path d="m3 17 6-6 4 4 8-8M15 7h6v6" />,
  "trend-down": <path d="m3 7 6 6 4-4 8 8M15 17h6v-6" />,
  sparkle: (
    <path d="M12 3c.6 3.8 1.7 4.9 5.5 5.5C13.7 9.1 12.6 10.2 12 14c-.6-3.8-1.7-4.9-5.5-5.5C10.3 7.9 11.4 6.8 12 3ZM18.5 14c.3 1.9.8 2.4 2.7 2.7-1.9.3-2.4.8-2.7 2.7-.3-1.9-.8-2.4-2.7-2.7 1.9-.3 2.4-.8 2.7-2.7Z" />
  ),
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9z" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />,
  wave: (
    <path d="M7 11V4a1.5 1.5 0 0 1 3 0v6m0-.5V3.2a1.5 1.5 0 0 1 3 0V10m0-.5V4.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 8-6.5 8S6 18 5 16l-1.5-3a1.6 1.6 0 0 1 2.8-1.5L7 13" />
  ),
  football: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3 2.2-1.1 3.5h-3.8L9 9.2 12 7Z" />
      <path d="m12 7 .1-4M15 9.2l3.6-1.4M13.9 12.7l2.4 3M10.1 12.7l-2.4 3M9 9.2 5.4 7.8" />
    </>
  ),
  basketball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
      <path d="M5.6 5.6C9 8 9 16 5.6 18.4M18.4 5.6C15 8 15 16 18.4 18.4" />
    </>
  ),
  tennis: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M4.5 6.5C8 9 8 15 4.5 17.5M19.5 6.5C16 9 16 15 19.5 17.5" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className = "",
  strokeWidth = 1.8,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}

// Small filled star for ratings (crisp at small sizes)
export function StarGlyph({
  filled,
  size = 16,
  className = "",
}: {
  filled: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9z" />
    </svg>
  );
}
