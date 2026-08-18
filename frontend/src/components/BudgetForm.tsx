import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Budget, Category } from "@/lib/types";

interface BudgetFormProps {
  categories: Category[];
  referenceMonth: string;
  onCreated: (budget: Budget) => void;
}

export function BudgetForm({ categories, referenceMonth, onCreated }: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "DESPESA");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Selecione uma categoria.");
      return;
    }

    setSubmitting(true);
    try {
      const budget = await api.post<Budget>("/budgets", {
        categoryId,
        amount: Number(amount),
        referenceMonth,
      });
      onCreated(budget);
      setCategoryId("");
      setAmount("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar orçamento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Novo orçamento</h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="budget-category">Categoria</label>
          <select
            id="budget-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="budget-amount">Limite (R$)</label>
          <input
            id="budget-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Salvando..." : "Definir orçamento"}
      </button>
    </form>
  );
}
