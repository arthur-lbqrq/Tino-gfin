import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BudgetStatus, Category } from "@/lib/types";
import { BudgetForm } from "@/components/BudgetForm";
import { BudgetList } from "@/components/BudgetList";
import { PageLoader } from "@/components/PageLoader";
import { UpgradeRequired } from "@/components/UpgradeRequired";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function shiftMonth(month: string, delta: number) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function Budgets() {
  const { plan } = useAuth();
  const locked = plan?.plan === "FREE";
  const [referenceMonth, setReferenceMonth] = useState(currentMonth);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (locked) return;
    api.get<Category[]>("/categories").then(setCategories);
  }, [locked]);

  useEffect(() => {
    if (locked) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<BudgetStatus[]>(`/budgets/status?month=${referenceMonth}`)
      .then(setBudgets)
      .finally(() => setLoading(false));
  }, [referenceMonth, locked]);

  function handleCreated(budget: { id: string; categoryId: string; category: Category; amount: string }) {
    setBudgets((prev) => [
      ...prev,
      {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        limit: Number(budget.amount),
        spent: 0,
        remaining: Number(budget.amount),
        usagePercent: 0,
        overBudget: false,
      },
    ]);
  }

  async function handleDelete(budgetId: string) {
    await api.delete(`/budgets/${budgetId}`);
    setBudgets((prev) => prev.filter((b) => b.budgetId !== budgetId));
  }

  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id));

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>Orçamentos</h1>
          <p>Defina um limite de gasto por categoria e acompanhe o quanto já foi consumido no mês.</p>
        </div>

        {!locked && <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="logout-btn"
            style={{ width: "auto", padding: "8px 12px" }}
            onClick={() => setReferenceMonth((m) => shiftMonth(m, -1))}
            aria-label="Mês anterior"
          >
            ←
          </button>
          <span className="mono" style={{ fontSize: 14, minWidth: 150, textAlign: "center" }}>
            {monthLabel(referenceMonth)}
          </span>
          <button
            type="button"
            className="logout-btn"
            style={{ width: "auto", padding: "8px 12px" }}
            onClick={() => setReferenceMonth((m) => shiftMonth(m, 1))}
            aria-label="Próximo mês"
          >
            →
          </button>
        </div>}
      </div>

      {locked ? (
        <UpgradeRequired feature="Orçamentos" minPlan="PRO" />
      ) : (
        <>
          <BudgetForm categories={availableCategories} referenceMonth={referenceMonth} onCreated={handleCreated} />
          {loading ? <PageLoader /> : <BudgetList budgets={budgets} onDelete={handleDelete} />}
        </>
      )}
    </div>
  );
}
