import { Insight } from "@/lib/types";

const SEVERITY_LABEL: Record<Insight["severity"], string> = {
  info: "Info",
  warning: "Atenção",
  critical: "Crítico",
};

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className={`insight-ticket ${insight.severity}`}>
      <div className="bar" />
      <div className="body">
        <span className="tag">{SEVERITY_LABEL[insight.severity]}</span>
        <span className="message">{insight.message}</span>
      </div>
    </div>
  );
}
