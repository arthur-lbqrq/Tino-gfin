import { prisma } from "@/lib/prisma";

function toNumber(value: unknown): number {
  return value ? Number(value) : 0;
}

export interface DreCategoryLine {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface DreReport {
  startDate: Date;
  endDate: Date;
  receitas: { items: DreCategoryLine[]; total: number };
  despesas: { items: DreCategoryLine[]; total: number };
  resultado: number;
}

async function getLinesByType(userId: string, type: "RECEITA" | "DESPESA", start: Date, end: Date) {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type, isTransfer: false, date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  if (grouped.length === 0) return { items: [], total: 0 };

  const categories = await prisma.category.findMany({ where: { id: { in: grouped.map((g) => g.categoryId) } } });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  const items = grouped
    .map((g) => ({ categoryId: g.categoryId, categoryName: nameById.get(g.categoryId) ?? "Outros", total: toNumber(g._sum.amount) }))
    .sort((a, b) => b.total - a.total);

  return { items, total: items.reduce((sum, item) => sum + item.total, 0) };
}

// DRE simplificado: receitas e despesas do período, agrupadas por categoria —
// não é uma DRE contábil formal (não separa custo/despesa operacional etc.),
// mas dá a visão "entrou x saiu, por quê" que um MEI/autônomo precisa no dia a dia.
export async function getDRE(userId: string, startDate: Date, endDate: Date): Promise<DreReport> {
  const [receitas, despesas] = await Promise.all([
    getLinesByType(userId, "RECEITA", startDate, endDate),
    getLinesByType(userId, "DESPESA", startDate, endDate),
  ]);

  return { startDate, endDate, receitas, despesas, resultado: receitas.total - despesas.total };
}

export interface PeriodComparisonPoint {
  label: string;
  startDate: Date;
  endDate: Date;
  receitas: number;
  despesas: number;
  resultado: number;
}

export interface PeriodInput {
  label: string;
  startDate: Date;
  endDate: Date;
}

// Comparativo entre N períodos quaisquer (mês x mês, ano x ano, ou trimestres) —
// o chamador decide o que cada período representa, aqui só somamos cada um.
export async function getPeriodComparison(userId: string, periods: PeriodInput[]): Promise<PeriodComparisonPoint[]> {
  return Promise.all(
    periods.map(async (period) => {
      const [receitasResult, despesasResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: "RECEITA", isTransfer: false, date: { gte: period.startDate, lte: period.endDate } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: "DESPESA", isTransfer: false, date: { gte: period.startDate, lte: period.endDate } },
          _sum: { amount: true },
        }),
      ]);

      const receitas = toNumber(receitasResult._sum.amount);
      const despesas = toNumber(despesasResult._sum.amount);

      return { label: period.label, startDate: period.startDate, endDate: period.endDate, receitas, despesas, resultado: receitas - despesas };
    })
  );
}

// Série mês a mês de um ano específico (Jan-Dez), independente do mês atual —
// usado no comparativo ano x ano e no relatório anual pro contador (MEI).
export function monthsOfYear(year: number): PeriodInput[] {
  return Array.from({ length: 12 }, (_, month) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const label = startDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    return { label, startDate, endDate };
  });
}
