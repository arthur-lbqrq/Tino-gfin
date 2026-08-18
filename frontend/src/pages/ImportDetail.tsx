import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { Category, ImportBatch } from "@/lib/types";
import { ImportItemsTable } from "@/components/ImportItemsTable";
import { PageLoader } from "@/components/PageLoader";

export function ImportDetail() {
  const { batchId } = useParams<{ batchId: string }>();
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;

    async function loadData() {
      try {
        const [batchData, categoriesData] = await Promise.all([
          api.get<ImportBatch>(`/imports/${batchId}`),
          api.get<Category[]>("/categories"),
        ]);
        setBatch(batchData);
        setCategories(categoriesData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [batchId]);

  async function refresh() {
    if (!batchId) return;
    const batchData = await api.get<ImportBatch>(`/imports/${batchId}`);
    setBatch(batchData);
  }

  async function handleAcceptMatch(itemId: string) {
    setError(null);
    try {
      await api.post(`/imports/items/${itemId}/accept-match`, {});
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao confirmar vínculo.");
    }
  }

  async function handleConfirm(itemId: string, categoryId: string) {
    setError(null);
    try {
      await api.post(`/imports/items/${itemId}/confirm`, { categoryId });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar transação.");
    }
  }

  async function handleIgnore(itemId: string) {
    setError(null);
    try {
      await api.post(`/imports/items/${itemId}/ignore`, {});
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao ignorar item.");
    }
  }

  if (loading || !batch) {
    return <PageLoader />;
  }

  const items = batch.items ?? [];
  const pendingCount = items.filter((i) => i.status === "PENDENTE" || i.status === "SUGERIDO").length;

  return (
    <div>
      <div className="page-header">
        <Link to="/importar" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>
          ← Importações
        </Link>
        <h1 style={{ marginTop: 8 }}>{batch.fileName}</h1>
        <p>
          {batch.account?.name} · {items.length} linha(s)
          {pendingCount > 0 ? ` · ${pendingCount} aguardando conciliação` : " · tudo conciliado"}
        </p>
      </div>

      {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

      <ImportItemsTable
        items={items}
        categories={categories}
        onAcceptMatch={handleAcceptMatch}
        onConfirm={handleConfirm}
        onIgnore={handleIgnore}
      />
    </div>
  );
}
