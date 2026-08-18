import { Goal } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface GoalListProps {
  goals: Goal[];
  onDelete: (goalId: string) => void;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function GoalList({ goals, onDelete }: GoalListProps) {
  if (goals.length === 0) {
    return <div className="card empty-state">Nenhuma meta criada ainda.</div>;
  }

  return (
    <div className="summary-grid">
      {goals.map((goal) => {
        const remainingDays = goal.targetDate ? daysUntil(goal.targetDate) : null;
        const overdue = remainingDays !== null && remainingDays < 0 && !goal.achieved;
        const fillClass = goal.achieved ? "" : overdue ? "critical" : goal.progressPercent < 40 ? "warning" : "";

        return (
          <div key={goal.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>
                {goal.name}
              </div>
              <button className="delete-btn" onClick={() => onDelete(goal.id)} aria-label="Excluir meta">
                Excluir
              </button>
            </div>

            <p style={{ marginTop: 10, fontSize: 13 }}>
              <span className="mono">{formatCurrency(goal.currentAmount)}</span> de{" "}
              <span className="mono">{formatCurrency(goal.targetAmount)}</span>
              <span style={{ color: "var(--ink-faint)" }}> · {goal.accountName}</span>
            </p>

            <div className="limit-bar-track">
              <div className={`limit-bar-fill ${fillClass}`} style={{ width: `${goal.progressPercent}%` }} />
            </div>

            {goal.achieved ? (
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--primary)" }}>Meta atingida! 🎉</p>
            ) : overdue ? (
              <p className="error-text" style={{ marginTop: 8 }}>
                Prazo encerrado há {Math.abs(remainingDays!)} dia(s), faltam{" "}
                {formatCurrency(goal.targetAmount - goal.currentAmount)}.
              </p>
            ) : (
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--ink-faint)" }}>
                {goal.progressPercent}% guardado
                {goal.targetDate && remainingDays !== null
                  ? ` · ${remainingDays} dia(s) até o prazo`
                  : ""}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
