import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Account, Goal } from "@/lib/types";

interface GoalFormProps {
  accounts: Account[];
  onCreated: (goal: Goal) => void;
}

export function GoalForm({ accounts, onCreated }: GoalFormProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!accountId) {
      setError("Selecione uma conta pra vincular à meta.");
      return;
    }

    setSubmitting(true);
    try {
      const goal = await api.post<Goal>("/goals", {
        name,
        targetAmount: Number(targetAmount),
        targetDate: targetDate || undefined,
        accountId,
      });
      onCreated(goal);
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setAccountId("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar meta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Nova meta</h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="goal-name">Nome da meta</label>
          <input
            id="goal-name"
            type="text"
            placeholder="Ex: Viagem, Reserva de emergência"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="goal-account">Conta vinculada</label>
          <select
            id="goal-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="goal-amount">Valor alvo (R$)</label>
          <input
            id="goal-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="goal-date">Prazo (opcional)</label>
          <input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Salvando..." : "Criar meta"}
      </button>
    </form>
  );
}
