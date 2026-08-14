import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CashflowPoint } from "@/lib/types";
import { formatCurrency, formatMonthLabel } from "@/lib/format";

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatMonthLabel(point.month),
  }));

  return (
    <div className="card" style={{ height: 300 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Fluxo de caixa</h3>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={chartData} barGap={4}>
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
          <Bar dataKey="receitas" name="Receitas" fill="#2f9c74" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" name="Despesas" fill="#b3402f" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
