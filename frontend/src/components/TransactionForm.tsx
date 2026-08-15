import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Account, Category, Transaction, TransactionType } from "@/lib/types";

interface TransactionFormProps {
  categories: Category[];
  onCreated: (transaction: Transaction) => void;
  onCreatedMany?: (transactions: Transaction[]) => void;
}

export function TransactionForm({ categories, onCreated, onCreatedMany }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>("DESPESA");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [installments, setInstallments] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isCardAccount = selectedAccount?.type === "CARTAO_CREDITO";

  useEffect(() => {
    api.get<Account[]>("/accounts").then(setAccounts);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Selecione uma categoria.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type,
        categoryId,
        amount: Number(amount),
        description: description || undefined,
        date,
        accountId: accountId || undefined,
        installments: isCardAccount && Number(installments) > 1 ? Number(installments) : undefined,
      };

      if (payload.installments) {
        const result = await api.post<{ installments: Transaction[] }>("/transactions", payload);
        onCreatedMany?.(result.installments);
        result.installments.forEach(onCreated);
      } else {
        const transaction = await api.post<Transaction>("/transactions", payload);
        onCreated(transaction);
      }

      setAmount("");
      setDescription("");
      setCategoryId("");
      setInstallments("1");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar transação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Nova transação</h3>

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
          <label htmlFor="date">Data</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
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
          <label htmlFor="account">Conta (opcional)</label>
          <select
            id="account"
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setInstallments("1");
            }}
          >
            <option value="">Sem conta específica</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isCardAccount && type === "DESPESA" && (
        <div className="form-group">
          <label htmlFor="installments">Parcelas</label>
          <select id="installments" value={installments} onChange={(e) => setInstallments(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "À vista" : `${n}x`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="description">Descrição (opcional)</label>
        <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Salvando..." : "Adicionar transação"}
      </button>
    </form>
  );
}
