import { CreditLimitStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export function CreditLimitBar({ status }: { status: CreditLimitStatus }) {
  const fillClass = status.overLimit ? "critical" : status.usagePercent >= 80 ? "warning" : "";
  const width = Math.min(status.usagePercent, 100);

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>Limite usado</span>
        <span className="mono">
          {formatCurrency(status.used)} de {formatCurrency(status.limit)}
        </span>
      </div>
      <div className="limit-bar-track">
        <div className={`limit-bar-fill ${fillClass}`} style={{ width: `${width}%` }} />
      </div>
      {status.overLimit ? (
        <p className="error-text" style={{ marginTop: 8 }}>
          Você ultrapassou o limite do cartão em {formatCurrency(status.used - status.limit)}.
        </p>
      ) : status.usagePercent >= 80 ? (
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--signal-amber)" }}>
          Você já usou {status.usagePercent}% do limite disponível.
        </p>
      ) : (
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--ink-faint)" }}>
          {formatCurrency(status.available)} disponíveis.
        </p>
      )}
    </div>
  );
}
