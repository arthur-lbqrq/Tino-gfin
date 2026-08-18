import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Account, ImportBatch } from "@/lib/types";
import { ImportUploadForm } from "@/components/ImportUploadForm";
import { ImportBatchList } from "@/components/ImportBatchList";
import { PageLoader } from "@/components/PageLoader";
import { UpgradeRequired } from "@/components/UpgradeRequired";

export function Imports() {
  const navigate = useNavigate();
  const { plan } = useAuth();
  const locked = plan?.plan === "FREE";
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (locked) {
      setLoading(false);
      return;
    }
    async function loadData() {
      try {
        const [batchesData, accountsData] = await Promise.all([
          api.get<ImportBatch[]>("/imports"),
          api.get<Account[]>("/accounts"),
        ]);
        setBatches(batchesData);
        setAccounts(accountsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [locked]);

  function handleCreated(batch: ImportBatch) {
    navigate(`/importar/${batch.id}`);
  }

  async function handleDelete(batchId: string) {
    await api.delete(`/imports/${batchId}`);
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Importar extrato</h1>
        <p>Suba um extrato do banco e concilie com o que você já lançou, sem duplicar nada.</p>
      </div>

      {locked ? (
        <UpgradeRequired feature="Importação de extrato" minPlan="PRO" />
      ) : (
        <>
          <ImportUploadForm accounts={accounts} onCreated={handleCreated} />
          <ImportBatchList batches={batches} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
}
