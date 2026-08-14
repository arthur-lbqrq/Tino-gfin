import { prisma } from "@/lib/prisma";

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

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
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

const EXPENSE_ALERT_THRESHOLD = 0.15; // 15% acima da média já dispara alerta

// Regra 1: compara despesas do mês atual com a média dos 3 meses anteriores.
async function checkExpenseAverage(userId: string, now: Date): Promise<Insight | null> {
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

// Regra 2: projeção simples de caixa com base no ritmo do mês atual.
async function checkCashflowProjection(userId: string, now: Date): Promise<Insight | null> {
  const currentStart = startOfMonth(now);

  const [saldoAtual, receitasMes, despesasMes] = await Promise.all([
    (async () => {
      const [receitasTotais, despesasTotais] = await Promise.all([
        sumByType(userId, "RECEITA", { lte: now }),
        sumByType(userId, "DESPESA", { lte: now }),
      ]);
      return receitasTotais - despesasTotais;
    })(),
    sumByType(userId, "RECEITA", { gte: currentStart, lte: now }),
    sumByType(userId, "DESPESA", { gte: currentStart, lte: now }),
  ]);

  const diasDecorridos = Math.max(
    1,
    Math.ceil((now.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24))
  );

  const resultadoDiario = (receitasMes - despesasMes) / diasDecorridos;

  // Só projeta se a tendência do mês for negativa e ainda houver saldo pra "queimar"
  if (resultadoDiario >= 0 || saldoAtual <= 0) {
    return null;
  }

  const diasAteZerar = Math.floor(saldoAtual / Math.abs(resultadoDiario));

  if (diasAteZerar > 90) {
    return null; // horizonte longo demais pra ser um alerta útil
  }

  return {
    type: "cashflow_projection",
    severity: diasAteZerar <= 15 ? "critical" : "warning",
    message: `Nesse ritmo, seu caixa fica negativo em aproximadamente ${diasAteZerar} dias.`,
    data: { saldoAtual, diasAteZerar, resultadoDiario: Math.round(resultadoDiario * 100) / 100 },
  };
}

export async function generateInsights(userId: string): Promise<Insight[]> {
  const now = new Date();

  const results = await Promise.all([
    checkExpenseAverage(userId, now),
    checkCashflowProjection(userId, now),
  ]);

  return results.filter((insight): insight is Insight => insight !== null);
}
