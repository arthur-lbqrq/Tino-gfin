import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Account, Goal } from "@/lib/types";
import { GoalForm } from "@/components/GoalForm";
import { GoalList } from "@/components/GoalList";
import { PageLoader } from "@/components/PageLoader";
import { UpgradeRequired } from "@/components/UpgradeRequired";

export function Goals() {
  const { plan } = useAuth();
  const locked = plan?.plan === "FREE";
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (locked) {
      setLoading(false);
      return;
    }
    async function loadData() {
      try {
        const [goalsData, accountsData] = await Promise.all([
          api.get<Goal[]>("/goals"),
          api.get<Account[]>("/accounts"),
        ]);
        setGoals(goalsData);
        setAccounts(accountsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [locked]);

  function handleCreated(goal: Goal) {
    setGoals((prev) => [...prev, goal]);
  }

  async function handleDelete(goalId: string) {
    await api.delete(`/goals/${goalId}`);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Metas</h1>
        <p>Defina um valor alvo, vincule a uma conta e acompanhe o progresso conforme guarda dinheiro nela.</p>
      </div>

      {locked ? (
        <UpgradeRequired feature="Metas" minPlan="PRO" />
      ) : (
        <>
          <GoalForm accounts={accounts} onCreated={handleCreated} />
          <GoalList goals={goals} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
}
