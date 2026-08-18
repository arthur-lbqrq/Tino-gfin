import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PeriodComparisonPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export function PeriodComparisonChart({ data }: { data: PeriodComparisonPoint[] }) {
  return (
    <div className="card" style={{ height: 320 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Comparativo de períodos</h3>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--ink-faint)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--ink-faint)" }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#2f9c74" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#b3402f" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="resultado" name="Resultado" stroke="#1f6f5c" strokeWidth={2} strokeDasharray="4 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
