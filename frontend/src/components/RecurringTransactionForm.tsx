import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Account, Category, RecurringTransaction, TransactionType } from "@/lib/types";

interface RecurringTransactionFormProps {
  categories: Category[];
  onCreated: (recurring: RecurringTransaction) => void;
}

const FREQUENCY_LABEL: Record<string, string> = {
  DIARIA: "Diária",
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
  ANUAL: "Anual",
};

export function RecurringTransactionForm({ categories, onCreated }: RecurringTransactionFormProps) {
  const [type, setType] = useState<TransactionType>("DESPESA");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"DIARIA" | "SEMANAL" | "MENSAL" | "ANUAL">("MENSAL");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    api.get<Account[]>("/accounts").then((data) => {
      setAccounts(data);
      setAccountId((current) => current || data[0]?.id || "");
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Selecione uma categoria.");
      return;
    }
    if (!accountId) {
      setError("Selecione uma conta.");
      return;
    }
    if (!description.trim()) {
      setError("Descreva o compromisso.");
      return;
    }

    setSubmitting(true);
    try {
      const recurring = await api.post<RecurringTransaction>("/recurring-transactions", {
        type,
        categoryId,
        accountId,
        amount: Number(amount),
        description: description.trim(),
        frequency,
        startDate,
      });
      onCreated(recurring);
      setAmount("");
      setDescription("");
      setCategoryId("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar compromisso.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Novo compromisso fixo</h3>

      <div className="type-toggle">
        <button
          type="button"
          className={type === "RECEITA" ? "active-receita" : ""}
          onClick={() => {
            setType("RECEITA");
            setCategoryId("");
          }}
        >
          Receita
        </button>
        <button
          type="button"
          className={type === "DESPESA" ? "active-despesa" : ""}
          onClick={() => {
            setType("DESPESA");
            setCategoryId("");
          }}
        >
          Despesa
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="description">Descrição</label>
        <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="amount">Valor (R$)</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="frequency">Frequência</label>
          <select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)}>
            {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Categoria</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Selecione...</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="account">Conta</label>
          <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
            {accounts.length === 0 && <option value="">Nenhuma conta cadastrada</option>}
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="startDate">Primeira ocorrência</label>
        <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Salvando..." : "Adicionar compromisso"}
      </button>
    </form>
  );
}
