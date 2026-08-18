import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";

interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  total: number;
}

const PALETTE = [
  "#1f6f5c",
  "#2f9c74",
  "#c97a1f",
  "#b3402f",
  "#5c7fa6",
  "#8a6ba1",
  "#a3855a",
  "#4f8fa3",
];

export function CategoryBreakdownChart({ data }: { data: CategoryBreakdownItem[] }) {
  if (data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="card" style={{ height: 320 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Despesas por categoria</h3>
      <ResponsiveContainer width="100%" height="88%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="categoryName"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.categoryId} fill={PALETTE[index % PALETTE.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${formatCurrency(value)} (${Math.round((value / total) * 100)}%)`,
              name,
            ]}
            contentStyle={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
