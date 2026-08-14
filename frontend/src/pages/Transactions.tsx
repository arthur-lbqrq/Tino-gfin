import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Category, Transaction } from "@/lib/types";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [transactionsData, categoriesData] = await Promise.all([
          api.get<Transaction[]>("/transactions"),
          api.get<Category[]>("/categories"),
        ]);
        setTransactions(transactionsData);
        setCategories(categoriesData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleCreated(transaction: Transaction) {
    setTransactions((prev) => [transaction, ...prev]);
  }

  async function handleDelete(id: string) {
    await api.delete(`/transactions/${id}`);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return <p style={{ color: "var(--ink-faint)" }}>Carregando...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Transações</h1>
        <p>Registre receitas e despesas pra manter seu fluxo de caixa sempre atualizado.</p>
      </div>

      <TransactionForm categories={categories} onCreated={handleCreated} />
      <TransactionList transactions={transactions} onDelete={handleDelete} />
    </div>
  );
}
