import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Account, AccountType } from "@/lib/types";

interface AccountFormProps {
  onCreated: (account: Account) => void;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CORRENTE: "Conta corrente",
  CARTEIRA: "Carteira (dinheiro)",
  CARTAO_CREDITO: "Cartão de crédito",
  POUPANCA: "Poupança",
};

export function AccountForm({ onCreated }: AccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CORRENTE");
  const [initialBalance, setInitialBalance] = useState("0");
  const [creditLimit, setCreditLimit] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isCard = type === "CARTAO_CREDITO";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (isCard && (!creditLimit || !closingDay || !dueDay)) {
      setError("Preencha limite, dia de fechamento e dia de vencimento pro cartão.");
      return;
    }

    setSubmitting(true);
    try {
      const account = await api.post<Account>("/accounts", {
        name,
        type,
        initialBalance: Number(initialBalance || 0),
        ...(isCard && {
          creditLimit: Number(creditLimit),
          closingDay: Number(closingDay),
          dueDay: Number(dueDay),
        }),
      });
      onCreated(account);
      setName("");
      setInitialBalance("0");
      setCreditLimit("");
      setClosingDay("");
      setDueDay("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar conta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Nova conta</h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="account-name">Nome</label>
          <input
            id="account-name"
            placeholder="Ex: Nubank, Carteira, Itaú Cartão"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="account-type">Tipo</label>
          <select id="account-type" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isCard && (
        <div className="form-group">
          <label htmlFor="initial-balance">Saldo inicial (R$)</label>
          <input
            id="initial-balance"
            type="number"
            step="0.01"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
          />
        </div>
      )}

      {isCard && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="credit-limit">Limite (R$)</label>
            <input
              id="credit-limit"
              type="number"
              step="0.01"
              min="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="closing-day">Dia de fechamento</label>
            <input
              id="closing-day"
              type="number"
              min="1"
              max="31"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="due-day">Dia de vencimento</label>
            <input
              id="due-day"
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
            />
          </div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Salvando..." : "Adicionar conta"}
      </button>
    </form>
  );
}
