import { BudgetStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface BudgetListProps {
  budgets: BudgetStatus[];
  onDelete: (budgetId: string) => void;
}

export function BudgetList({ budgets, onDelete }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <div className="card empty-state">Nenhum orçamento definido nesse mês ainda.</div>
    );
  }

  return (
    <div className="summary-grid">
      {budgets.map((budget) => {
        const fillClass = budget.overBudget ? "critical" : budget.usagePercent >= 80 ? "warning" : "";
        const width = Math.min(budget.usagePercent, 100);

        return (
          <div key={budget.budgetId} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, letterSpacing: "0.01em" }}>
                {budget.categoryName}
              </div>
              <button
                className="delete-btn"
                onClick={() => onDelete(budget.budgetId)}
                aria-label="Excluir orçamento"
              >
                Excluir
              </button>
            </div>

            <p style={{ marginTop: 10, fontSize: 13 }}>
              <span className="mono">{formatCurrency(budget.spent)}</span> de{" "}
              <span className="mono">{formatCurrency(budget.limit)}</span>
            </p>

            <div className="limit-bar-track">
              <div className={`limit-bar-fill ${fillClass}`} style={{ width: `${width}%` }} />
            </div>

            {budget.overBudget ? (
              <p className="error-text" style={{ marginTop: 8 }}>
                Estourou o orçamento em {formatCurrency(budget.spent - budget.limit)}.
              </p>
            ) : budget.usagePercent >= 80 ? (
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--signal-amber)" }}>
                Já usou {budget.usagePercent}% do orçamento.
              </p>
            ) : (
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--ink-faint)" }}>
                {formatCurrency(budget.remaining)} restantes.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
