import { Plan, RecurrenceFrequency } from "@prisma/client";
import { FREE_INSIGHT_TYPES } from "@/billing/plan-limits";
import { prisma } from "@/lib/prisma";
import { addInterval } from "@/lib/recurrence";
import { computeCashProjection } from "@/dashboard/projection.service";
import { getBudgetStatus } from "@/budgets/budget.service";
import { listGoalsWithProgress } from "@/goals/goals.service";
import { getCreditLimitStatus } from "@/invoices/invoice.service";
import { DAS_DUE_DAY, getMeiStatus } from "@/mei/mei.service";

export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  type: string;
  severity: InsightSeverity;
  message: string;
  data: Record<string, number | string>;
}

function toNumber(value: unknown): number {
  return value ? Number(value) : 0;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function referenceMonthOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function sumExpenses(userId: string, start: Date, end: Date) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type: "DESPESA", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}

async function sumByType(userId: string, type: "RECEITA" | "DESPESA", where: { gte?: Date; lte?: Date }) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type, date: where },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}

async function getSaldoAtual(userId: string, now: Date) {
  const [receitasTotais, despesasTotais] = await Promise.all([
    sumByType(userId, "RECEITA", { lte: now }),
    sumByType(userId, "DESPESA", { lte: now }),
  ]);
  return receitasTotais - despesasTotais;
}

// Junta os valores de uma regra que pode disparar 0, 1 ou N insights (ex: um por
// categoria estourada) com regras que só disparam 0 ou 1, pra achatar tudo no final.
function toArray<T>(value: T | T[] | null): T[] {
  if (value === null) return [];
  return Array.isArray(value) ? value : [value];
}

const EXPENSE_ALERT_THRESHOLD = 0.15; // 15% acima da média já dispara alerta

// Regra 1: compara despesas do mês atual com a média dos 3 meses anteriores.
export async function checkExpenseAverage(userId: string, now: Date): Promise<Insight | null> {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const currentExpenses = await sumExpenses(userId, currentStart, currentEnd);

  const monthlyTotals: number[] = [];
  for (let i = 1; i <= 3; i++) {
    const reference = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = startOfMonth(reference);
    const end = endOfMonth(reference);
    monthlyTotals.push(await sumExpenses(userId, start, end));
  }

  const monthsWithData = monthlyTotals.filter((total) => total > 0).length;
  if (monthsWithData === 0 || currentExpenses === 0) {
    return null; // dados insuficientes pra comparar com confiança
  }

  const average = monthlyTotals.reduce((sum, value) => sum + value, 0) / 3;
  if (average === 0) return null;

  const variation = (currentExpenses - average) / average;

  if (variation >= EXPENSE_ALERT_THRESHOLD) {
    const percentage = Math.round(variation * 100);
    const monthLabel = currentStart.toLocaleDateString("pt-BR", { month: "long" });

    return {
      type: "expense_above_average",
      severity: percentage >= 30 ? "critical" : "warning",
      message: `Suas despesas em ${monthLabel} estão ${percentage}% acima da média dos últimos 3 meses.`,
      data: { currentExpenses, average: Math.round(average * 100) / 100, percentage },
    };
  }

  return null;
}

// Projeta receitas/despesas de recorrências ativas dentro de uma janela [from, to],
// a partir de lastGeneratedAt (ou startDate, se nunca gerou nada ainda). Mesma lógica
// de avanço de cursor usada em generateDueTransactions, só que sem persistir nada.
async function projectRecurringTotals(userId: string, from: Date, to: Date) {
  const recurrences = await prisma.recurringTransaction.findMany({
    where: { userId, active: true, startDate: { lte: to } },
  });

  let receitas = 0;
  let despesas = 0;

  for (const recurrence of recurrences) {
    if (recurrence.endDate && recurrence.endDate < from) continue;

    let cursor = recurrence.lastGeneratedAt
      ? addInterval(recurrence.lastGeneratedAt, recurrence.frequency as RecurrenceFrequency)
      : recurrence.startDate;

    while (cursor <= to) {
      if (cursor >= from && (!recurrence.endDate || cursor <= recurrence.endDate)) {
        const amount = Number(recurrence.amount);
        if (recurrence.type === "RECEITA") receitas += amount;
        else despesas += amount;
      }
      cursor = addInterval(cursor, recurrence.frequency as RecurrenceFrequency);
    }
  }

  return { receitas, despesas };
}

// Regra 2: projeção de caixa combinando base certa (recorrências ativas, já
// agendadas) com base estimada (média histórica de transações variáveis, ou seja,
// sem recurringId — pra não contar duas vezes o que já é coberto pela base certa).
// Delega pro mesmo motor day-by-day do dashboard (computeCashProjection) — é a
// única fonte de verdade de "quantos dias até o caixa zerar" no sistema; manter
// dois cálculos em paralelo gerava números diferentes pro mesmo risco.
export async function checkCashflowProjection(userId: string, now: Date): Promise<Insight | null> {
  const projection = await computeCashProjection(userId, now);

  if (projection.daysToNegative === null) {
    return null;
  }

  const { daysToNegative, saldoAtual, troughBalance, confidence } = projection;

  return {
    type: "cashflow_projection",
    severity: daysToNegative <= 15 ? "critical" : "warning",
    message: `Considerando seus compromissos já agendados e seu padrão histórico de gastos, seu caixa fica negativo em aproximadamente ${daysToNegative} dias.`,
    data: {
      saldoAtual,
      diasAteZerar: daysToNegative,
      troughBalance,
      confidence,
    },
  };
}

// Regra 3: pra cada orçamento do mês atual, alerta quando o gasto real bate 80% do
// limite (warning) ou ultrapassa 100% (critical). Reaproveita getBudgetStatus, que já
// calcula gasto vs. limite por categoria — não recalcula essa lógica aqui de novo.
export async function checkBudgetStatus(userId: string, now: Date): Promise<Insight[]> {
  const statuses = await getBudgetStatus(userId, referenceMonthOf(now));

  return statuses
    .map((status): Insight | null => {
      if (status.overBudget) {
        return {
          type: "budget_over_limit",
          severity: "critical",
          message: `Você estourou o orçamento de ${status.categoryName} em ${formatBRL(status.spent - status.limit)} este mês.`,
          data: {
            categoryId: status.categoryId,
            limit: status.limit,
            spent: status.spent,
            usagePercent: status.usagePercent,
          },
        };
      }

      if (status.usagePercent >= 80) {
        return {
          type: "budget_near_limit",
          severity: "warning",
          message: `Você já usou ${status.usagePercent}% do orçamento de ${status.categoryName} este mês (${formatBRL(status.spent)} de ${formatBRL(status.limit)}).`,
          data: {
            categoryId: status.categoryId,
            limit: status.limit,
            spent: status.spent,
            usagePercent: status.usagePercent,
          },
        };
      }

      return null;
    })
    .filter((insight): insight is Insight => insight !== null);
}

// Regra 4: soma receitas/despesas fixas (recorrências ativas) previstas pros
// próximos 30 dias. Sobe de severidade quando as despesas fixas futuras se
// aproximam ou ultrapassam o saldo atual disponível pra cobri-las.
export async function checkUpcomingFixedCommitments(userId: string, now: Date): Promise<Insight | null> {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 30);

  const [{ receitas: receitasFuturas, despesas: despesasFuturas }, saldoAtual] = await Promise.all([
    projectRecurringTotals(userId, now, horizon),
    getSaldoAtual(userId, now),
  ]);

  if (receitasFuturas === 0 && despesasFuturas === 0) {
    return null; // usuário não tem recorrências ativas
  }

  let severity: InsightSeverity = "info";
  if (despesasFuturas > 0) {
    if (saldoAtual <= 0 || despesasFuturas > saldoAtual) {
      severity = "critical";
    } else if (despesasFuturas / saldoAtual >= 0.8) {
      severity = "warning";
    }
  }

  const message =
    severity === "critical"
      ? `Seus compromissos fixos dos próximos 30 dias somam ${formatBRL(despesasFuturas)} — isso é mais do que seu saldo atual disponível (${formatBRL(saldoAtual)}).`
      : severity === "warning"
        ? `Seus compromissos fixos dos próximos 30 dias somam ${formatBRL(despesasFuturas)}, o que consome a maior parte do seu saldo atual disponível (${formatBRL(saldoAtual)}).`
        : `Nos próximos 30 dias, você tem ${formatBRL(despesasFuturas)} em despesas fixas e ${formatBRL(receitasFuturas)} em receitas fixas já agendadas.`;

  return {
    type: "upcoming_fixed_commitments",
    severity,
    message,
    data: { receitasFuturas, despesasFuturas, saldoAtual },
  };
}

// Regra 5: soma o saldo de todas as contas do usuário. Se alguma conta específica
// estiver negativa mas o total consolidado ainda for positivo, gera um insight
// tranquilizador (severidade "info") em vez de deixar o usuário achar que está no
// vermelho. Não compete com checkCashflowProjection: aquela é sobre tendência futura
// olhando todas as transações juntas; esta é sobre a distribuição atual entre contas.
export async function checkConsolidatedBalance(userId: string): Promise<Insight | null> {
  const accounts = await prisma.account.findMany({ where: { userId } });
  if (accounts.length <= 1) return null; // nada pra "consolidar" com uma conta só

  const balances = await Promise.all(
    accounts.map(async (account) => {
      const result = await prisma.transaction.groupBy({
        by: ["type"],
        where: { accountId: account.id, isTransfer: false },
        _sum: { amount: true },
      });
      const receitas = toNumber(result.find((r) => r.type === "RECEITA")?._sum?.amount);
      const despesas = toNumber(result.find((r) => r.type === "DESPESA")?._sum?.amount);
      const balance = Number(account.initialBalance) + receitas - despesas;
      return { name: account.name, balance };
    })
  );

  const totalConsolidado = balances.reduce((sum, b) => sum + b.balance, 0);
  const contasNegativas = balances.filter((b) => b.balance < 0);

  if (contasNegativas.length === 0 || totalConsolidado <= 0) {
    return null;
  }

  const nomes = contasNegativas.map((b) => b.name).join(", ");
  const plural = contasNegativas.length > 1;

  return {
    type: "low_balance_offset_by_other_accounts",
    severity: "info",
    message: plural
      ? `As contas ${nomes} estão com saldo negativo, mas somando todas as suas contas o total ainda é positivo (${formatBRL(totalConsolidado)}).`
      : `A conta "${nomes}" está com saldo negativo, mas somando todas as suas contas o total ainda é positivo (${formatBRL(totalConsolidado)}).`,
    data: {
      totalConsolidado,
      contasNegativasCount: contasNegativas.length,
      contasNegativasNomes: nomes,
    },
  };
}

const INVOICE_DUE_HORIZON_DAYS = 5;

// Regra 6: cada fatura de cartão em aberto (não paga) cuja data de vencimento
// está dentro da janela vira um lembrete individual — diferente da regra 4
// (que soma recorrências), aqui é sobre um compromisso já materializado (fatura).
export async function checkUpcomingInvoiceDue(userId: string, now: Date): Promise<Insight[]> {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + INVOICE_DUE_HORIZON_DAYS);

  const invoices = await prisma.invoice.findMany({
    where: { paid: false, dueDate: { lte: horizon }, account: { userId } },
    include: { account: true, transactions: true },
  });

  return invoices
    .map((invoice): Insight | null => {
      const total = invoice.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      if (total === 0) return null; // fatura vazia, nada a cobrar do usuário

      const diasParaVencer = Math.ceil(
        (invoice.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const overdue = diasParaVencer < 0;
      const severity: InsightSeverity = overdue || diasParaVencer <= 2 ? "critical" : "warning";

      const message = overdue
        ? `A fatura do cartão ${invoice.account.name} venceu há ${Math.abs(diasParaVencer)} dia(s) e ainda está em aberto (${formatBRL(total)}).`
        : diasParaVencer === 0
          ? `A fatura do cartão ${invoice.account.name} vence hoje (${formatBRL(total)}).`
          : `A fatura do cartão ${invoice.account.name} vence em ${diasParaVencer} dia(s) (${formatBRL(total)}).`;

      return {
        type: "invoice_due_soon",
        severity,
        message,
        data: { accountId: invoice.accountId, invoiceId: invoice.id, total, diasParaVencer },
      };
    })
    .filter((insight): insight is Insight => insight !== null);
}

const RECURRING_DUE_HORIZON_DAYS = 3;

// Regra 7: lembrete individual pra cada recorrência ativa cuja próxima ocorrência
// (ainda não materializada em Transaction) cai dentro da janela — complementa a
// regra 4 (que só soma o total) dando visibilidade item a item de "o que vence quando".
export async function checkUpcomingRecurringDue(userId: string, now: Date): Promise<Insight[]> {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + RECURRING_DUE_HORIZON_DAYS);

  const recurrences = await prisma.recurringTransaction.findMany({
    where: { userId, active: true, startDate: { lte: horizon } },
  });

  return recurrences
    .map((recurrence): Insight | null => {
      if (recurrence.endDate && recurrence.endDate < now) return null;

      let cursor = recurrence.lastGeneratedAt
        ? addInterval(recurrence.lastGeneratedAt, recurrence.frequency as RecurrenceFrequency)
        : recurrence.startDate;

      while (cursor < now) {
        cursor = addInterval(cursor, recurrence.frequency as RecurrenceFrequency);
      }

      if (cursor > horizon) return null;
      if (recurrence.endDate && cursor > recurrence.endDate) return null;

      const diasParaVencer = Math.ceil((cursor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(recurrence.amount);
      const tipoLabel = recurrence.type === "DESPESA" ? "despesa fixa" : "receita fixa";
      const severity: InsightSeverity =
        recurrence.type === "DESPESA" && diasParaVencer <= 1 ? "warning" : "info";

      const message =
        diasParaVencer <= 0
          ? `"${recurrence.description}" (${tipoLabel} de ${formatBRL(amount)}) vence hoje.`
          : `"${recurrence.description}" (${tipoLabel} de ${formatBRL(amount)}) vence em ${diasParaVencer} dia(s).`;

      return {
        type: "recurring_due_soon",
        severity,
        message,
        data: { recurringId: recurrence.id, amount, diasParaVencer },
      };
    })
    .filter((insight): insight is Insight => insight !== null);
}

// Regra 8: acompanha o progresso de cada meta de economia (saldo da conta vinculada
// vs. valor alvo). Sem prazo definido, só sinaliza quando a meta é atingida — com
// prazo, também alerta se o ritmo atual não vai chegar lá a tempo (ou já passou).
export async function checkGoalsProgress(userId: string, now: Date): Promise<Insight[]> {
  const goals = await listGoalsWithProgress(userId);

  return goals
    .map((goal): Insight | null => {
      if (goal.achieved) {
        return {
          type: "goal_achieved",
          severity: "info",
          message: `Você atingiu a meta "${goal.name}"! Já tem ${formatBRL(goal.currentAmount)} guardado.`,
          data: { goalId: goal.id, currentAmount: goal.currentAmount, targetAmount: goal.targetAmount },
        };
      }

      if (!goal.targetDate) return null;

      if (goal.targetDate < now) {
        return {
          type: "goal_behind_schedule",
          severity: "critical",
          message: `O prazo da meta "${goal.name}" já passou e ainda faltam ${formatBRL(goal.targetAmount - goal.currentAmount)} pra completar.`,
          data: { goalId: goal.id, missing: goal.targetAmount - goal.currentAmount },
        };
      }

      const totalMs = goal.targetDate.getTime() - goal.createdAt.getTime();
      if (totalMs <= 0) return null; // meta criada com prazo já vencido, cai no caso acima em breve

      const elapsedMs = now.getTime() - goal.createdAt.getTime();
      const expectedPercent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

      if (goal.progressPercent + 15 < expectedPercent) {
        return {
          type: "goal_behind_schedule",
          severity: "warning",
          message: `No ritmo atual, a meta "${goal.name}" está atrasada: ${goal.progressPercent}% guardado, mas o esperado até hoje seria perto de ${expectedPercent}%.`,
          data: { goalId: goal.id, progressPercent: goal.progressPercent, expectedPercent },
        };
      }

      return null;
    })
    .filter((insight): insight is Insight => insight !== null);
}

// Regra 9: para cada cartão de crédito do usuário, compara o total usado nas
// faturas em aberto com o limite configurado. Reaproveita getCreditLimitStatus,
// que já soma faturas não pagas — não recalcula essa lógica aqui de novo.
export async function checkCreditCardLimit(userId: string): Promise<Insight[]> {
  const cardAccounts = await prisma.account.findMany({
    where: { userId, type: "CARTAO_CREDITO" },
  });

  const results = await Promise.all(
    cardAccounts.map(async (account): Promise<Insight | null> => {
      const status = await getCreditLimitStatus(userId, account.id);
      if (status.limit <= 0) return null; // sem limite configurado ainda

      if (status.overLimit) {
        return {
          type: "credit_limit_over",
          severity: "critical",
          message: `O cartão ${account.name} já ultrapassou o limite: ${formatBRL(status.used)} usados de ${formatBRL(status.limit)}.`,
          data: { accountId: account.id, used: status.used, limit: status.limit, usagePercent: status.usagePercent },
        };
      }

      if (status.usagePercent >= 80) {
        return {
          type: "credit_limit_near",
          severity: "warning",
          message: `O cartão ${account.name} já usou ${status.usagePercent}% do limite (${formatBRL(status.used)} de ${formatBRL(status.limit)}).`,
          data: { accountId: account.id, used: status.used, limit: status.limit, usagePercent: status.usagePercent },
        };
      }

      return null;
    })
  );

  return results.filter((insight): insight is Insight => insight !== null);
}

// Regra 10: compara o faturamento anual (receitas do ano, todas as contas) com
// o teto do MEI. Também avisa cedo quando só a projeção (ritmo atual x 12 meses)
// já indica estouro, mesmo com o acumulado ainda dentro do limite.
export async function checkMeiLimit(userId: string, now: Date): Promise<Insight | null> {
  const status = await getMeiStatus(userId, now);

  if (status.overLimit) {
    return {
      type: "mei_limit_over",
      severity: "critical",
      message: `Seu faturamento em ${status.year} já passou do teto do MEI: ${formatBRL(status.currentRevenue)} de ${formatBRL(status.revenueLimit)}. Vale conversar com um contador sobre migrar de enquadramento.`,
      data: { year: status.year, currentRevenue: status.currentRevenue, revenueLimit: status.revenueLimit },
    };
  }

  if (status.usagePercent >= 80) {
    return {
      type: "mei_limit_near",
      severity: "warning",
      message: `Você já usou ${status.usagePercent}% do teto anual do MEI (${formatBRL(status.currentRevenue)} de ${formatBRL(status.revenueLimit)}).`,
      data: {
        year: status.year,
        currentRevenue: status.currentRevenue,
        revenueLimit: status.revenueLimit,
        usagePercent: status.usagePercent,
      },
    };
  }

  if (status.projectedOverLimit) {
    return {
      type: "mei_limit_projected_over",
      severity: "warning",
      message: `No ritmo atual, seu faturamento de ${status.year} deve fechar em ${formatBRL(status.projectedRevenue)} — acima do teto de ${formatBRL(status.revenueLimit)} do MEI.`,
      data: { year: status.year, projectedRevenue: status.projectedRevenue, revenueLimit: status.revenueLimit },
    };
  }

  return null;
}

const DAS_REMINDER_WINDOW_DAYS = 5;

// Regra 11: lembrete da guia DAS, que vence todo dia 20. Dispara só na janela
// dos 5 dias antes do vencimento pra não virar ruído o mês inteiro.
export async function checkDasReminder(userId: string, now: Date): Promise<Insight | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const dueDate = new Date(now.getFullYear(), now.getMonth(), DAS_DUE_DAY);
  const diasParaVencer = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diasParaVencer < 0 || diasParaVencer > DAS_REMINDER_WINDOW_DAYS) return null;

  const amount = user.dasMonthlyAmount ? Number(user.dasMonthlyAmount) : null;
  const amountLabel = amount ? ` (${formatBRL(amount)})` : "";
  const severity: InsightSeverity = diasParaVencer <= 2 ? "warning" : "info";

  const message =
    diasParaVencer === 0
      ? `A guia DAS do MEI vence hoje${amountLabel}.`
      : `A guia DAS do MEI vence em ${diasParaVencer} dia(s)${amountLabel}.`;

  return {
    type: "das_due_soon",
    severity,
    message,
    data: { diasParaVencer, amount: amount ?? 0 },
  };
}

export async function generateInsights(userId: string, plan: Plan = "PRO"): Promise<Insight[]> {
  const now = new Date();

  const results = await Promise.all([
    checkExpenseAverage(userId, now),
    checkCashflowProjection(userId, now),
    checkBudgetStatus(userId, now),
    checkUpcomingFixedCommitments(userId, now),
    checkConsolidatedBalance(userId),
    checkUpcomingInvoiceDue(userId, now),
    checkUpcomingRecurringDue(userId, now),
    checkGoalsProgress(userId, now),
    checkCreditCardLimit(userId),
    checkMeiLimit(userId, now),
    checkDasReminder(userId, now),
  ]);

  const insights = results.flatMap((result) => toArray(result));

  // No Free, só os dois insights mais básicos aparecem — o resto do motor já
  // roda (é mais simples que esparramar "if plan === PRO" por regra), só não
  // é exposto na resposta.
  if (plan === "FREE") {
    return insights.filter((insight) => FREE_INSIGHT_TYPES.has(insight.type));
  }

  return insights;
}
