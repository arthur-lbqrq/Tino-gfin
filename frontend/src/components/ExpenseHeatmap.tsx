import { DailyExpensePoint } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

function intensity(total: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(1, total / max);
}

function cellColor(ratio: number): string {
  if (ratio === 0) return "var(--surface-alt)";
  // interpola de verde claro (primary-soft) até o pine-green forte (primary-dark)
  // — tons fixos, não seguem a inversão de tema, por isso o texto da célula
  // também usa uma cor invariante (ver cellTextColor) em vez de --ink-soft.
  const stops = ["#e3f0ec", "#bcdcd1", "#7fbba7", "#3f8a72", "#154d40"];
  const index = Math.min(stops.length - 1, Math.floor(ratio * (stops.length - 1)));
  return stops[index];
}

function cellTextColor(ratio: number): string {
  if (ratio === 0) return "var(--ink-soft)";
  return ratio > 0.6 ? "#fff" : "var(--ink-on-tint)";
}

export function ExpenseHeatmap({ data, monthLabel }: { data: DailyExpensePoint[]; monthLabel: string }) {
  const max = Math.max(...data.map((d) => d.total), 0);

  return (
    <div className="card">
      <h3 style={{ fontSize: 16, marginBottom: 4 }}>Gastos por dia — {monthLabel}</h3>
      <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 16 }}>
        Quanto mais escuro, maior o total gasto naquele dia.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {data.map((point) => (
          <div
            key={point.day}
            title={`Dia ${point.day}: ${formatCurrency(point.total)}`}
            style={{
              aspectRatio: "1",
              borderRadius: 6,
              background: cellColor(intensity(point.total, max)),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: cellTextColor(intensity(point.total, max)),
              fontWeight: 600,
            }}
          >
            {point.day}
          </div>
        ))}
      </div>
    </div>
  );
}
