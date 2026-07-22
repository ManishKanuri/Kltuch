import { useId } from "react";

// Vector interpretation of the KLUTCH SportsEd mark:
// blue tennis-court left bar + orange basketball K-arms + tennis ball.
export function LogoMark({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const barClip = `bar-${uid}`;
  const armClip = `arm-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-label="KLUTCH SportsEd"
      role="img"
    >
      <defs>
        <clipPath id={barClip}>
          <polygon points="20,12 36,12 36,80 30,88 20,88" />
        </clipPath>
        <clipPath id={armClip}>
          <polygon points="36,42 86,12 62,40 36,58" />
          <polygon points="36,58 62,60 86,88 66,88 36,74" />
        </clipPath>
      </defs>

      {/* Blue court bar */}
      <polygon points="20,12 36,12 36,80 30,88 20,88" fill="#2244db" />
      {/* court net lines */}
      <g clipPath={`url(#${barClip})`} stroke="#dfe8ff" strokeWidth="1.4" opacity="0.9">
        <line x1="28" y1="10" x2="28" y2="90" />
        <line x1="16" y1="50" x2="40" y2="50" />
        <line x1="24" y1="26" x2="24" y2="74" strokeWidth="0.8" opacity="0.6" />
        <line x1="32" y1="26" x2="32" y2="74" strokeWidth="0.8" opacity="0.6" />
      </g>

      {/* Orange basketball arms */}
      <g fill="#f26b1d">
        <polygon points="36,42 86,12 62,40 36,58" />
        <polygon points="36,58 62,60 86,88 66,88 36,74" />
      </g>
      {/* basketball seams */}
      <g clipPath={`url(#${armClip})`} stroke="#0a0b0d" strokeWidth="1.6" opacity="0.85" fill="none">
        <path d="M40 40 C 60 46, 70 30, 84 16" />
        <path d="M40 76 C 60 66, 72 74, 84 86" />
      </g>

      {/* Tennis ball */}
      <circle cx="73" cy="21" r="8.5" fill="#c7ee3e" stroke="#0a0b0d" strokeWidth="0.8" />
      <path
        d="M66 17 C 70 20, 70 22, 66 25 M80 17 C 76 20, 76 22, 80 25"
        stroke="#ffffff"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  size = 34,
  showWordmark = true,
  className = "",
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <div className="leading-none">
          <div
            className="font-display font-extrabold tracking-tight"
            style={{ fontSize: size * 0.5 }}
          >
            KLUTCH
          </div>
          <div
            className="font-display font-semibold uppercase text-klutch-orange"
            style={{ fontSize: size * 0.24, letterSpacing: size * 0.05 }}
          >
            Sports.ed
          </div>
        </div>
      )}
    </div>
  );
}
