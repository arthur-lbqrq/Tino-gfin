import { formatCurrency } from "@/lib/format";

interface SummaryCardProps {
  label: string;
  value: number;
  tone?: "positive" | "negative" | "neutral";
}

export function SummaryCard({ label, value, tone = "neutral" }: SummaryCardProps) {
  const toneClass = tone === "positive" ? "positive" : tone === "negative" ? "negative" : "";

  return (
    <div className={`card summary-card ${toneClass}`}>
      <div className="label">{label}</div>
      <div className="value">{formatCurrency(value)}</div>
    </div>
  );
}
