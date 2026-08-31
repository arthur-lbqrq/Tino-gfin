import { CashProjectionPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface CashProjectionChartProps {
  series: CashProjectionPoint[];
  zeroCrossingIndex: number | null;
  variant?: "mini" | "full";
}

// Travessia verde -> coral: elemento-assinatura do produto. Mapeia a série real
// (saldo projetado por dia) num viewBox fixo, sempre incluindo o zero no range
// pra que a linha-zero tracejada apareça de forma consistente.
export function CashProjectionChart({ series, zeroCrossingIndex, variant = "full" }: CashProjectionChartProps) {
  if (series.length < 2) return null;

  const width = variant === "mini" ? 190 : 420;
  const height = variant === "mini" ? 34 : 210;
  const padTop = variant === "mini" ? 2 : 16;
  const padBottom = variant === "mini" ? 2 : 14;

  const values = series.map((p) => p.balance);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const usableH = height - padTop - padBottom;

  const x = (i: number) => (i / (series.length - 1)) * width;
  const y = (v: number) => padTop + usableH - ((v - min) / range) * usableH;
  const zeroY = y(0);

  const hasCrossing = zeroCrossingIndex !== null && zeroCrossingIndex < series.length;
  const splitIndex = hasCrossing ? zeroCrossingIndex! : series.length - 1;

  const toPoints = (start: number, end: number) =>
    series
      .slice(start, end + 1)
      .map((p, idx) => `${x(start + idx)},${y(p.balance)}`)
      .join(" ");

  const safePoints = toPoints(0, splitIndex);
  const riskPoints = hasCrossing ? toPoints(splitIndex, series.length - 1) : "";

  const strokeWidth = variant === "mini" ? 2 : 2.8;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
      role="img"
      aria-label="Projeção de saldo com travessia da zona de risco"
    >
      {variant === "full" && hasCrossing && (
        <rect x={0} y={zeroY} width={width} height={height - zeroY} fill="var(--brand-soft)" />
      )}
      <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="var(--brand)" strokeWidth={1} strokeDasharray="4 4" opacity={variant === "mini" ? 0.45 : 1} />
      {variant === "full" && hasCrossing && (
        <text x={4} y={zeroY + 16} fontFamily="var(--font-mono)" fontSize="10" fill="var(--brand-strong)">
          zona de risco
        </text>
      )}
      {variant === "full" && (
        <>
          <text x={0} y={12} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--ink-faint)">
            {formatCurrency(series[0].balance)}
          </text>
          {hasCrossing && (
            <text x={width - 4} y={height - 4} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--brand-strong)" textAnchor="end">
              {formatCurrency(series[series.length - 1].balance)}
            </text>
          )}
        </>
      )}
      <polyline points={safePoints} fill="none" stroke="var(--signal-mint)" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      {hasCrossing && (
        <>
          <polyline
            points={riskPoints}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={strokeWidth}
            strokeDasharray={variant === "mini" ? undefined : "7 5"}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx={x(splitIndex)} cy={zeroY} r={variant === "mini" ? 3.2 : 5} fill={variant === "mini" ? "var(--brand)" : "var(--surface)"} stroke="var(--brand)" strokeWidth={variant === "mini" ? 0 : 2.5} />
        </>
      )}
    </svg>
  );
}
