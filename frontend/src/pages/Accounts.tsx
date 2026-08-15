import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Account } from "@/lib/types";
import { AccountForm } from "@/components/AccountForm";
import { AccountList } from "@/components/AccountList";

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Account[]>("/accounts")
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(account: Account) {
    setAccounts((prev) => [...prev, account]);
  }

  async function handleDelete(id: string) {
    await api.delete(`/accounts/${id}`);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return <p style={{ color: "var(--ink-faint)" }}>Carregando...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Contas</h1>
        <p>Separe carteira, conta corrente e cartão de crédito pra saber exatamente de onde seu dinheiro sai.</p>
      </div>

      <AccountForm onCreated={handleCreated} />
      <AccountList accounts={accounts} onDelete={handleDelete} />
    </div>
  );
}
