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
  // Wordmark matches the site header: "KLUTCH" heavy, "SportsEd" lighter.
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className="whitespace-nowrap font-display leading-none tracking-[-0.02em]"
          style={{ fontSize: size * 0.56 }}
        >
          <span className="font-black">KLUTCH</span>{" "}
          <span className="font-semibold opacity-70">SportsEd</span>
        </span>
      )}
    </div>
  );
}
