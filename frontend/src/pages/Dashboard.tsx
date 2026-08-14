import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DashboardSummary, CashflowPoint, Insight } from "@/lib/types";
import { SummaryCard } from "@/components/SummaryCard";
import { InsightCard } from "@/components/InsightCard";
import { CashflowChart } from "@/components/CashflowChart";

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflow, setCashflow] = useState<CashflowPoint[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, cashflowData, insightsData] = await Promise.all([
          api.get<DashboardSummary>("/dashboard/summary"),
          api.get<CashflowPoint[]>("/dashboard/cashflow"),
          api.get<Insight[]>("/insights"),
        ]);
        setSummary(summaryData);
        setCashflow(cashflowData);
        setInsights(insightsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <p style={{ color: "var(--ink-faint)" }}>Carregando...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Aqui está o que seus números significam.</p>
      </div>

      {summary && (
        <div className="summary-grid">
          <SummaryCard
            label="Saldo atual"
            value={summary.saldoAtual}
            tone={summary.saldoAtual >= 0 ? "positive" : "negative"}
          />
          <SummaryCard label="Receitas" value={summary.receitas} />
          <SummaryCard label="Despesas" value={summary.despesas} />
          <SummaryCard
            label="Resultado"
            value={summary.resultado}
            tone={summary.resultado >= 0 ? "positive" : "negative"}
          />
        </div>
      )}

      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Insights</h3>
      <div className="insight-list">
        {insights.length === 0 ? (
          <div className="card empty-state">
            Nenhum alerta por enquanto. Continue lançando suas transações — assim que houver
            histórico suficiente, o Tino começa a avisar o que importa.
          </div>
        ) : (
          insights.map((insight, i) => <InsightCard key={i} insight={insight} />)
        )}
      </div>

      {cashflow.length > 0 && <CashflowChart data={cashflow} />}
    </div>
  );
}
