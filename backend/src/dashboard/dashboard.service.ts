import { prisma } from "@/lib/prisma";

interface SummaryFilters {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
}

function toNumber(value: unknown): number {
  return value ? Number(value) : 0;
}

async function sumByType(
  userId: string,
  type: "RECEITA" | "DESPESA",
  date: { gte?: Date; lte?: Date },
  accountId?: string
) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type, date, accountId },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}

// Resumo do período: receitas, despesas e resultado dentro do intervalo informado.
// Saldo atual considera TODO o histórico até endDate (ou até agora), não só o período.
// accountId opcional: quando informado, restringe o resumo a uma única conta.
export async function getSummary({ userId, startDate, endDate, accountId }: SummaryFilters) {
  const referenceDate = endDate ?? new Date();

  const [receitasPeriodo, despesasPeriodo, receitasTotais, despesasTotais] =
    await Promise.all([
      sumByType(userId, "RECEITA", { gte: startDate, lte: endDate }, accountId),
      sumByType(userId, "DESPESA", { gte: startDate, lte: endDate }, accountId),
      sumByType(userId, "RECEITA", { lte: referenceDate }, accountId),
      sumByType(userId, "DESPESA", { lte: referenceDate }, accountId),
    ]);

  return {
    saldoAtual: receitasTotais - despesasTotais,
    receitas: receitasPeriodo,
    despesas: despesasPeriodo,
    resultado: receitasPeriodo - despesasPeriodo,
  };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

// Série dos últimos N meses (padrão 6), pro gráfico de fluxo de caixa.
// accountId opcional: quando informado, restringe a série a uma única conta.
export async function getCashflow(userId: string, months = 6, accountId?: string) {
  const now = new Date();
  const series = [];

  for (let i = months - 1; i >= 0; i--) {
    const reference = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = startOfMonth(reference);
    const end = endOfMonth(reference);

    const [receitas, despesas] = await Promise.all([
      sumByType(userId, "RECEITA", { gte: start, lte: end }, accountId),
      sumByType(userId, "DESPESA", { gte: start, lte: end }, accountId),
    ]);

    series.push({
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      receitas,
      despesas,
      resultado: receitas - despesas,
    });
  }

  return series;
}

// Despesas do mês agrupadas por categoria, pro gráfico de pizza do dashboard.
// accountId opcional: quando informado, restringe a uma única conta.
export async function getCategoryBreakdown(userId: string, referenceDate = new Date(), accountId?: string) {
  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);

  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "DESPESA", date: { gte: start, lte: end }, accountId },
    _sum: { amount: true },
  });

  if (grouped.length === 0) return [];

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
  });
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return grouped
    .map((g) => ({
      categoryId: g.categoryId,
      categoryName: categoryNameById.get(g.categoryId) ?? "Outros",
      total: toNumber(g._sum.amount),
    }))
    .sort((a, b) => b.total - a.total);
}

// Despesas por dia do mês, pro heatmap de gastos. Retorna um ponto por dia
// (mesmo os sem gasto, com total 0) pra facilitar montar a grade no frontend.
export async function getDailyExpenses(userId: string, referenceDate = new Date()) {
  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);

  const transactions = await prisma.transaction.findMany({
    where: { userId, type: "DESPESA", date: { gte: start, lte: end } },
    select: { date: true, amount: true },
  });

  const totalsByDay = new Map<number, number>();
  for (const t of transactions) {
    const day = t.date.getDate();
    totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + Number(t.amount));
  }

  const daysInMonth = end.getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return { day, total: Math.round((totalsByDay.get(day) ?? 0) * 100) / 100 };
  });
}
