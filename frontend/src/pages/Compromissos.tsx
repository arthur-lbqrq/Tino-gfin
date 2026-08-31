import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Category, Commitment, RecurringTransaction } from "@/lib/types";
import { RecurringTransactionForm } from "@/components/RecurringTransactionForm";
import { RecurringTransactionList } from "@/components/RecurringTransactionList";
import { CommitmentsList } from "@/components/CommitmentsList";
import { DeferModal } from "@/components/DeferModal";
import { PageLoader } from "@/components/PageLoader";
import { UpgradeRequired } from "@/components/UpgradeRequired";

export function Compromissos() {
  const { plan } = useAuth();
  const locked = plan?.plan === "FREE";
  const [recurrences, setRecurrences] = useState<RecurringTransaction[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deferTarget, setDeferTarget] = useState<Commitment | null>(null);

  async function loadAll() {
    const [recurrencesData, commitmentsData, categoriesData] = await Promise.all([
      api.get<RecurringTransaction[]>("/recurring-transactions"),
      api.get<Commitment[]>("/dashboard/commitments"),
      api.get<Category[]>("/categories"),
    ]);
    setRecurrences(recurrencesData);
    setCommitments(commitmentsData);
    setCategories(categoriesData);
  }

  useEffect(() => {
    if (locked) {
      setLoading(false);
      return;
    }
    loadAll().finally(() => setLoading(false));
  }, [locked]);

  function handleCreated(recurring: RecurringTransaction) {
    setRecurrences((prev) => [...prev, recurring]);
    api.get<Commitment[]>("/dashboard/commitments").then(setCommitments);
  }

  async function handleDelete(id: string) {
    await api.delete(`/recurring-transactions/${id}`);
    setRecurrences((prev) => prev.filter((r) => r.id !== id));
    setCommitments((prev) => prev.filter((c) => c.recurringId !== id));
  }

  async function handleToggleActive(recurring: RecurringTransaction) {
    const updated = await api.put<RecurringTransaction>(`/recurring-transactions/${recurring.id}`, {
      active: !recurring.active,
    });
    setRecurrences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    api.get<Commitment[]>("/dashboard/commitments").then(setCommitments);
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Compromissos</h1>
        <p>Suas despesas e receitas fixas — o que o Faro usa pra projetar seu caixa e avisar antes do aperto.</p>
      </div>

      {locked ? (
        <UpgradeRequired feature="Compromissos fixos" minPlan="PRO" />
      ) : (
        <>
          <CommitmentsList commitments={commitments} onAdiar={setDeferTarget} />
          <div style={{ height: 24 }} />
          <RecurringTransactionForm categories={categories} onCreated={handleCreated} />
          <RecurringTransactionList recurrences={recurrences} onDelete={handleDelete} onToggleActive={handleToggleActive} />
        </>
      )}

      {deferTarget && (
        <DeferModal
          commitment={deferTarget}
          onClose={() => setDeferTarget(null)}
          onDeferred={() => api.get<Commitment[]>("/dashboard/commitments").then(setCommitments)}
        />
      )}
    </div>
  );
}
