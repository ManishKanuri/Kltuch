import Image from "next/image";

// Real brand mark (public/logo-mark.png): blue tennis-court K bar + orange
// basketball-textured K arm + tennis ball.
export function LogoMark({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo-mark.png"
      alt="KLUTCH SportsEd"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      priority
    />
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
