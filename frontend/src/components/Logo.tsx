import { FaroMark } from "@/components/FaroMark";

interface LogoProps {
  size?: number;
  wordmarkFontSize?: number;
  tone?: "ink" | "paper";
  className?: string;
}

// Lockup da marca: símbolo Bloco + wordmark "Faro", gap 11px. `tone` escolhe
// entre o par pra papel claro ("ink") ou fundo escuro ("paper") — ver FaroMark.
export function Logo({ size = 30, wordmarkFontSize = 26, tone = "ink", className }: LogoProps) {
  const textColor = tone === "paper" ? "var(--on-dark-text)" : "var(--ink)";

  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <FaroMark size={size} tone={tone} />
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: wordmarkFontSize,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: textColor,
        }}
      >
        Faro
      </div>
    </div>
  );
}
