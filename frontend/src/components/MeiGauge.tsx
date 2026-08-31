import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { MeiStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

function gaugeColor(status: MeiStatus): string {
  if (status.overLimit) return "#e04a32";
  if (status.usagePercent >= 80 || status.projectedOverLimit) return "#c97a16";
  return "#0e7a52";
}

export function MeiGauge({ status }: { status: MeiStatus }) {
  const displayPercent = Math.min(status.usagePercent, 100);
  const color = gaugeColor(status);
  const data = [{ name: "uso", value: displayPercent, fill: color }];

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 24 }}>
      <h3 style={{ fontSize: 16, alignSelf: "flex-start", marginBottom: 8 }}>Teto anual do MEI — {status.year}</h3>

      <div style={{ position: "relative", width: 220, height: 140 }}>
        <RadialBarChart
          width={220}
          height={140}
          cx="50%"
          cy="100%"
          innerRadius="120%"
          outerRadius="180%"
          barSize={18}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={9} />
        </RadialBarChart>
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 400,
            color,
          }}
        >
          {status.usagePercent}%
        </div>
      </div>

      <p style={{ fontSize: 13, textAlign: "center", marginTop: 8 }}>
        <span className="mono">{formatCurrency(status.currentRevenue)}</span> de{" "}
        <span className="mono">{formatCurrency(status.revenueLimit)}</span>
      </p>

      {status.overLimit ? (
        <p className="error-text" style={{ marginTop: 4, textAlign: "center" }}>
          Faturamento já passou do teto anual do MEI.
        </p>
      ) : status.projectedOverLimit ? (
        <p style={{ marginTop: 4, fontSize: 13, color: "var(--signal-amber)", textAlign: "center" }}>
          No ritmo atual, projeção pro ano fecha em {formatCurrency(status.projectedRevenue)} — acima do teto.
        </p>
      ) : (
        <p style={{ marginTop: 4, fontSize: 13, color: "var(--ink-faint)", textAlign: "center" }}>
          Projeção pro fim do ano: {formatCurrency(status.projectedRevenue)}
        </p>
      )}
    </div>
  );
}
