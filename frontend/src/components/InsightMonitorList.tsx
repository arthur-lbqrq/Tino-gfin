import type { ReactNode } from "react";
import { Account, Commitment, DashboardSummary, Insight } from "@/lib/types";

type MonitorStatus = "ativo" | "sem-risco" | "aguardando";

interface MonitorContext {
  accounts: Account[];
  commitments: Commitment[];
  summary: DashboardSummary;
}

interface MonitorRule {
  id: string;
  label: string;
  icon: JSX.Element;
  matches: (insight: Insight) => boolean;
  hasEnoughData: (ctx: MonitorContext) => boolean;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

// As 5 regras do motor (ver checkExpenseAverage, checkCashflowProjection,
// checkBudgetStatus, checkUpcomingFixedCommitments e checkConsolidatedBalance
// em insight.service.ts) — mantidas em sincronia manualmente, já que o backend
// não expõe hoje um catálogo de regras registradas.
const RULES: MonitorRule[] = [
  {
    id: "expense_above_average",
    label: "Gastos acima da média",
    icon: <Icon><path d="M3 17l6-6 4 4 8-8M21 7v6M21 7h-6" /></Icon>,
    matches: (insight) => insight.type === "expense_above_average",
    hasEnoughData: (ctx) => ctx.summary.despesas > 0,
  },
  {
    id: "cashflow_projection",
    label: "Projeção de caixa",
    icon: <Icon><path d="M3 12h4l3-8 4 16 3-8h4" /></Icon>,
    matches: (insight) => insight.type === "cashflow_projection",
    hasEnoughData: () => true,
  },
  {
    id: "budgets",
    label: "Orçamentos",
    icon: <Icon><circle cx="12" cy="12" r="9" /><path d="M12 3v9l6 3" /></Icon>,
    matches: (insight) => insight.type === "budget_over_limit" || insight.type === "budget_near_limit",
    hasEnoughData: () => true,
  },
  {
    id: "upcoming_fixed_commitments",
    label: "Compromissos fixos",
    icon: <Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>,
    matches: (insight) => insight.type === "upcoming_fixed_commitments",
    hasEnoughData: (ctx) => ctx.commitments.length > 0,
  },
  {
    id: "low_balance_offset_by_other_accounts",
    label: "Saldo entre contas",
    icon: <Icon><path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16" /></Icon>,
    matches: (insight) => insight.type === "low_balance_offset_by_other_accounts",
    hasEnoughData: (ctx) => ctx.accounts.length > 1,
  },
];

const STATUS_META: Record<MonitorStatus, { label: string; className: string }> = {
  ativo: { label: "Ativo agora", className: "active" },
  "sem-risco": { label: "Sem risco no momento", className: "ok" },
  aguardando: { label: "Aguardando dados", className: "pending" },
};

function statusFor(rule: MonitorRule, insights: Insight[], ctx: MonitorContext): MonitorStatus {
  if (insights.some(rule.matches)) return "ativo";
  if (!rule.hasEnoughData(ctx)) return "aguardando";
  return "sem-risco";
}

interface InsightMonitorListProps {
  insights: Insight[];
  accounts: Account[];
  commitments: Commitment[];
  summary: DashboardSummary;
}

export function InsightMonitorList({ insights, accounts, commitments, summary }: InsightMonitorListProps) {
  const ctx: MonitorContext = { accounts, commitments, summary };

  return (
    <div className="dash-monitor">
      <div className="mono dash-monitor-kicker">O que o Faro está monitorando</div>
      <ul className="dash-monitor-list">
        {RULES.map((rule) => {
          const status = statusFor(rule, insights, ctx);
          const meta = STATUS_META[status];
          return (
            <li key={rule.id} className="dash-monitor-item">
              <span className={`dash-monitor-icon ${meta.className}`}>{rule.icon}</span>
              <span className="dash-monitor-name">{rule.label}</span>
              <span className={`mono dash-monitor-status ${meta.className}`}>{meta.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
