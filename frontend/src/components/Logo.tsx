interface LogoProps {
  size?: number;
  wordmarkFontSize?: number;
  color?: string;
  textColor?: string;
  className?: string;
}

// Marca do Faro: glifo de pulso (o farejar do problema antes de ele chegar) + wordmark.
export function Logo({
  size = 16,
  wordmarkFontSize = 22,
  color = "var(--brand)",
  textColor = "var(--ink)",
  className,
}: LogoProps) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <svg
        width={size * 1.625}
        height={size}
        viewBox="0 0 26 16"
        style={{ display: "block", flexShrink: 0 }}
        aria-hidden="true"
      >
        <polyline
          points="0,9 5,9 8,3 11,14 14,6 17,9 26,9"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: wordmarkFontSize,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: textColor,
        }}
      >
        Faro
      </div>
    </div>
  );
}
