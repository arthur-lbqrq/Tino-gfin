import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  DashboardSummary,
  CashflowPoint,
  Insight,
  CashProjection,
  Commitment,
  MeiStatus,
  Goal,
} from "@/lib/types";
import { PageLoader } from "@/components/PageLoader";
import { CashProjectionChart } from "@/components/CashProjectionChart";
import { CommitmentsList } from "@/components/CommitmentsList";
import { DeferModal } from "@/components/DeferModal";
import { formatCurrency, formatDateBR } from "@/lib/format";
import "./Dashboard.css";

function pct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

function monthOverMonthDelta(cashflow: CashflowPoint[], key: "receitas" | "despesas" | "resultado"): number | null {
  if (cashflow.length < 2) return null;
  const current = cashflow[cashflow.length - 1][key];
  const previous = cashflow[cashflow.length - 2][key];
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function sparklineHeights(cashflow: CashflowPoint[], key: "receitas" | "despesas" | "resultado"): number[] {
  const values = cashflow.map((p) => Math.abs(p[key]));
  const max = Math.max(...values, 1);
  return values.map((v) => Math.max(10, Math.round((v / max) * 100)));
}

function Sparkline({ heights, tone }: { heights: number[]; tone: "neutral" | "positive" | "negative" | "warning" }) {
  return (
    <div className="kpi-sparkline">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`kpi-sparkline-bar ${i === heights.length - 1 ? `last-${tone}` : ""}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function Dashboard() {
  const { user, plan } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflow, setCashflow] = useState<CashflowPoint[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [projection, setProjection] = useState<CashProjection | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [meiStatus, setMeiStatus] = useState<MeiStatus | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deferTarget, setDeferTarget] = useState<Commitment | null>(null);

  const isPro = plan?.plan === "PRO" || plan?.plan === "BUSINESS";

  async function loadCommitments() {
    const data = await api.get<Commitment[]>("/dashboard/commitments");
    setCommitments(data);
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, cashflowData, insightsData, projectionData, commitmentsData] = await Promise.all([
          api.get<DashboardSummary>("/dashboard/summary"),
          api.get<CashflowPoint[]>("/dashboard/cashflow?months=4"),
          api.get<Insight[]>("/insights"),
          api.get<CashProjection>("/dashboard/cash-projection"),
          api.get<Commitment[]>("/dashboard/commitments"),
        ]);
        setSummary(summaryData);
        setCashflow(cashflowData);
        setInsights(insightsData);
        setProjection(projectionData);
        setCommitments(commitmentsData);

        if (isPro) {
          const [meiData, goalsData] = await Promise.allSettled([
            api.get<MeiStatus>("/mei/status"),
            api.get<Goal[]>("/goals"),
          ]);
          if (meiData.status === "fulfilled") setMeiStatus(meiData.value);
          if (goalsData.status === "fulfilled" && goalsData.value.length > 0) {
            setGoal(goalsData.value.find((g) => !g.achieved) ?? goalsData.value[0]);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  if (loading) {
    return <PageLoader />;
  }

  const despesasInsight = insights.find((i) => i.type === "expense_above_average");
  const receitasDelta = monthOverMonthDelta(cashflow, "receitas");
  const despesasDelta = despesasInsight
    ? Math.round(Number(despesasInsight.data.percentage))
    : monthOverMonthDelta(cashflow, "despesas");
  const resultadoDelta = monthOverMonthDelta(cashflow, "resultado");
  const margem = summary && summary.receitas > 0 ? Math.round((summary.resultado / summary.receitas) * 1000) / 10 : null;

  const causingCommitment = commitments.find((c) => c.severity === "critical" && c.deferrable);
  // "cashflow_projection" já é o conteúdo do cartão principal (via /cash-projection) —
  // listar de novo na trilha lateral seria repetir o mesmo alerta duas vezes.
  const secondaryInsights = insights
    .filter((i) => i.severity !== "critical" && i.type !== "cashflow_projection")
    .slice(0, 2);

  const monthLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <div className="mono dash-kicker">{user?.name} · MEI</div>
          <h1>Dashboard</h1>
          <p className="dash-subtitle">Aqui está o que seus números significam.</p>
        </div>
        <div className="dash-header-actions">
          <span className="mono dash-chip">{monthLabel} ▾</span>
          <Link to="/relatorios" className="mono dash-chip">
            Exportar
          </Link>
          <Link to="/transactions" className="btn-primary dash-btn-launch mono">
            Lançar transação
          </Link>
        </div>
      </div>

      {summary && (
        <div className="dash-kpi-grid">
          <div className="card dash-kpi">
            <div className="mono dash-kpi-label">Saldo atual</div>
            <div className="mono dash-kpi-value">{formatCurrency(summary.saldoAtual)}</div>
            <div className="dash-kpi-footer">
              <span className="mono dash-kpi-note">saldo consolidado</span>
              <Sparkline heights={sparklineHeights(cashflow, "resultado")} tone="neutral" />
            </div>
          </div>

          <div className="card dash-kpi">
            <div className="mono dash-kpi-label">Receitas</div>
            <div className="mono dash-kpi-value positive">{formatCurrency(summary.receitas)}</div>
            <div className="dash-kpi-footer">
              {receitasDelta !== null && (
                <span className="mono dash-kpi-delta positive">{pct(receitasDelta)} vs mês anterior</span>
              )}
              <Sparkline heights={sparklineHeights(cashflow, "receitas")} tone="positive" />
            </div>
          </div>

          <div className={`card dash-kpi ${despesasDelta !== null && despesasDelta >= 15 ? "alert" : ""}`}>
            <div className="mono dash-kpi-label">Despesas</div>
            <div className="mono dash-kpi-value negative">{formatCurrency(summary.despesas)}</div>
            <div className="dash-kpi-footer">
              {despesasDelta !== null && (
                <span className="mono dash-kpi-delta negative">
                  {pct(despesasDelta)} {despesasInsight ? "acima da média" : "vs mês anterior"}
                </span>
              )}
              <Sparkline heights={sparklineHeights(cashflow, "despesas")} tone="negative" />
            </div>
          </div>

          <div className="card dash-kpi">
            <div className="mono dash-kpi-label">Resultado</div>
            <div className="mono dash-kpi-value">{formatCurrency(summary.resultado)}</div>
            <div className="dash-kpi-footer">
              <span className="mono dash-kpi-note warning">
                {margem !== null ? `margem ${margem}%` : "—"}
                {resultadoDelta !== null && resultadoDelta < 0 ? " · caindo" : ""}
              </span>
              <Sparkline heights={sparklineHeights(cashflow, "resultado")} tone="warning" />
            </div>
          </div>
        </div>
      )}

      {projection && (
        <div className="dash-insights-panel">
          <div className="dash-insights-header">
            <div className="dash-insights-title">
              <span className={`estado-agora-dot ${projection.daysToNegative !== null ? "pulse" : ""}`} />
              <span className="mono">Central de insights</span>
            </div>
            <span className="mono dash-insights-meta">
              {insights.length} {insights.length === 1 ? "insight" : "insights"} · gerado hoje{" "}
              {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="dash-insights-body">
            <div className="dash-alert-card">
              {projection.daysToNegative !== null ? (
                <>
                  <div className="dash-alert-grid">
                    <div className="dash-alert-copy">
                      <div className="mono dash-alert-kicker">Alerta · o que vai acontecer</div>
                      <div className="dash-alert-headline">Seu caixa fica negativo em {projection.daysToNegative} dias.</div>
                      <p className="dash-alert-text">
                        Faltam <strong className="mono">{formatCurrency(Math.abs(projection.troughBalance))}</strong> no dia{" "}
                        {projection.negativeDate && formatDateBR(projection.negativeDate)}
                        {causingCommitment ? `, quando vence ${causingCommitment.description}.` : "."}
                      </p>
                      <div className="dash-alert-metrics">
                        <div>
                          <div className="mono dash-alert-metric-label">Data prevista</div>
                          <div className="mono dash-alert-metric-value">
                            {projection.negativeDate && formatDateBR(projection.negativeDate)}
                          </div>
                        </div>
                        <div>
                          <div className="mono dash-alert-metric-label">Saldo no fundo</div>
                          <div className="mono dash-alert-metric-value negative">
                            {formatCurrency(projection.troughBalance)}
                          </div>
                        </div>
                        <div>
                          <div className="mono dash-alert-metric-label">Confiança</div>
                          <div className="mono dash-alert-metric-value">{projection.confidence}%</div>
                        </div>
                      </div>
                    </div>
                    <CashProjectionChart series={projection.series} zeroCrossingIndex={projection.zeroCrossingIndex} variant="full" />
                  </div>

                  {causingCommitment && (
                    <div className="dash-alert-action">
                      <div>
                        <div className="mono dash-alert-action-kicker">O que fazer agora</div>
                        <div className="dash-alert-action-text">
                          Adie {causingCommitment.description.toLowerCase()} do dia {formatDateBR(causingCommitment.date)} — vale
                          conferir se o mês fecha positivo.
                        </div>
                      </div>
                      <div className="dash-alert-action-buttons">
                        <button className="dash-alert-btn-primary mono" onClick={() => setDeferTarget(causingCommitment)}>
                          Adiar boleto
                        </button>
                        <a href="#compromissos" className="dash-alert-btn-ghost mono">
                          Outras saídas
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="dash-alert-grid">
                  <div className="dash-alert-copy">
                    <div className="mono dash-alert-kicker safe">Tudo em dia</div>
                    <div className="dash-alert-headline">Seu caixa não deve ficar negativo nos próximos 45 dias.</div>
                    <p className="dash-alert-text">
                      Saldo projetado se mantém positivo considerando seus compromissos já agendados e seu padrão de gastos.
                    </p>
                  </div>
                  <CashProjectionChart series={projection.series} zeroCrossingIndex={projection.zeroCrossingIndex} variant="full" />
                </div>
              )}
            </div>

            <div className="dash-insights-rail">
              {secondaryInsights.length > 0 ? (
                secondaryInsights.map((insight, i) => (
                  <div key={i} className={`insight-ticket ${insight.severity} dash-rail-ticket`}>
                    <span className="bar" />
                    <div className="body">
                      <span className="tag">{insight.severity === "warning" ? "Atenção" : "Normal"}</span>
                      <span className="message">{insight.message}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dash-rail-empty">Nenhum outro alerta no momento.</div>
              )}
              <div className="dash-learned-card">
                <div className="mono dash-learned-kicker">O Faro aprendeu</div>
                <div className="dash-learned-text">
                  Ainda estamos aprendendo o padrão do seu caixa — quanto mais lançamentos, mais precisas ficam as previsões.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dash-footer-grid" id="compromissos">
        <CommitmentsList commitments={commitments} onAdiar={setDeferTarget} />

        <div className="dash-side-cards">
          {meiStatus && (
            <div className="card dash-side-card">
              <div className="dash-side-card-header">
                <div className="dash-side-card-title">Teto MEI {meiStatus.year}</div>
                <span className="mono dash-side-card-percent">{meiStatus.usagePercent}%</span>
              </div>
              <div className="limit-bar-track">
                <div
                  className={`limit-bar-fill ${meiStatus.overLimit ? "critical" : meiStatus.usagePercent >= 80 ? "warning" : ""}`}
                  style={{ width: `${Math.min(meiStatus.usagePercent, 100)}%` }}
                />
              </div>
              <div className="dash-side-card-row mono">
                <span>{formatCurrency(meiStatus.currentRevenue)} faturados</span>
                <span>{formatCurrency(meiStatus.revenueLimit)}</span>
              </div>
              <div className="dash-side-card-note">
                {meiStatus.overLimit
                  ? "Faturamento já passou do teto anual."
                  : meiStatus.projectedOverLimit
                    ? `No ritmo atual você fecha o ano em ${formatCurrency(meiStatus.projectedRevenue)} — acima do teto.`
                    : `No ritmo atual você fecha o ano em ${formatCurrency(meiStatus.projectedRevenue)} — dentro do teto.`}
              </div>
            </div>
          )}

          {goal && (
            <div className="card dash-side-card">
              <div className="dash-side-card-title">Meta · {goal.name}</div>
              <div className="dash-goal-amount">
                <span className="mono dash-goal-current">{formatCurrency(goal.currentAmount)}</span>
                <span className="mono dash-goal-target">de {formatCurrency(goal.targetAmount)}</span>
              </div>
              <div className="limit-bar-track">
                <div className="limit-bar-fill" style={{ width: `${Math.min(goal.progressPercent, 100)}%` }} />
              </div>
              {goal.achieved && <div className="mono dash-side-card-note positive">meta atingida</div>}
            </div>
          )}
        </div>
      </div>

      {deferTarget && (
        <DeferModal
          commitment={deferTarget}
          onClose={() => setDeferTarget(null)}
          onDeferred={() => {
            loadCommitments();
            api.get<CashProjection>("/dashboard/cash-projection").then(setProjection);
            api.get<DashboardSummary>("/dashboard/summary").then(setSummary);
          }}
        />
      )}
    </div>
  );
}
