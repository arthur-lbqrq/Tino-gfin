import { prisma } from "@/lib/prisma";

interface SummaryFilters {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

function toNumber(value: unknown): number {
  return value ? Number(value) : 0;
}

async function sumByType(
  userId: string,
  type: "RECEITA" | "DESPESA",
  date: { gte?: Date; lte?: Date }
) {
  const result = await prisma.transaction.aggregate({
    where: { userId, type, date },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}

// Resumo do período: receitas, despesas e resultado dentro do intervalo informado.
// Saldo atual considera TODO o histórico até endDate (ou até agora), não só o período.
export async function getSummary({ userId, startDate, endDate }: SummaryFilters) {
  const referenceDate = endDate ?? new Date();

  const [receitasPeriodo, despesasPeriodo, receitasTotais, despesasTotais] =
    await Promise.all([
      sumByType(userId, "RECEITA", { gte: startDate, lte: endDate }),
      sumByType(userId, "DESPESA", { gte: startDate, lte: endDate }),
      sumByType(userId, "RECEITA", { lte: referenceDate }),
      sumByType(userId, "DESPESA", { lte: referenceDate }),
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
export async function getCashflow(userId: string, months = 6) {
  const now = new Date();
  const series = [];

  for (let i = months - 1; i >= 0; i--) {
    const reference = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = startOfMonth(reference);
    const end = endOfMonth(reference);

    const [receitas, despesas] = await Promise.all([
      sumByType(userId, "RECEITA", { gte: start, lte: end }),
      sumByType(userId, "DESPESA", { gte: start, lte: end }),
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
