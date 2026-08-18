import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Category, Transaction } from "@/lib/types";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { PageLoader } from "@/components/PageLoader";

export function Transactions() {
  const { plan } = useAuth();
  const canExport = plan?.plan === "BUSINESS";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

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

  async function handleExport(format: "csv" | "pdf") {
    setExporting(format);
    setExportError(null);
    try {
      await api.download(`/reports/transactions.${format}`, `tino-transacoes.${format}`);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Erro ao exportar.");
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <h1>Transações</h1>
          <p>Registre receitas e despesas pra manter seu fluxo de caixa sempre atualizado.</p>
        </div>
        {canExport ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={() => handleExport("csv")} disabled={exporting !== null}>
              {exporting === "csv" ? "Exportando..." : "Exportar CSV"}
            </button>
            <button className="btn-secondary" onClick={() => handleExport("pdf")} disabled={exporting !== null}>
              {exporting === "pdf" ? "Exportando..." : "Exportar PDF"}
            </button>
          </div>
        ) : (
          <Link to="/planos" className="btn-secondary" style={{ textDecoration: "none" }}>
            Exportar (Business)
          </Link>
        )}
      </div>

      {exportError && <p className="error-text">{exportError}</p>}

      <TransactionForm categories={categories} onCreated={handleCreated} />
      <TransactionList transactions={transactions} onDelete={handleDelete} />
    </div>
  );
}
