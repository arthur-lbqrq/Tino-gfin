import { prisma } from "@/lib/prisma";

export class MeiError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

// Teto anual de faturamento do MEI (Lei Complementar 123/2006, valor vigente).
// Fica como fallback: o usuário pode sobrescrever em meiRevenueLimit caso a lei mude.
export const DEFAULT_MEI_REVENUE_LIMIT = 81000;

// Dia de vencimento da guia DAS (o boleto vence no dia 20 de cada mês, referente
// ao mês anterior; quando cai em dia não útil a Receita antecipa, mas isso não
// muda o mês de referência — mantemos simples e usamos sempre o dia 20).
export const DAS_DUE_DAY = 20;

function yearRange(year: number) {
  return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
}

async function getAnnualRevenue(userId: string, year: number): Promise<number> {
  const { start, end } = yearRange(year);

  const result = await prisma.transaction.aggregate({
    where: { userId, type: "RECEITA", isTransfer: false, date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  return result._sum.amount ? Number(result._sum.amount) : 0;
}

export interface MeiStatus {
  year: number;
  revenueLimit: number;
  currentRevenue: number;
  usagePercent: number;
  overLimit: boolean;
  projectedRevenue: number;
  projectedOverLimit: boolean;
  monthsElapsed: number;
}

// Projeta o faturamento do ano inteiro extrapolando a média mensal já realizada —
// simples, mas suficiente pra avisar cedo se o ritmo atual estoura o teto do MEI.
export async function getMeiStatus(userId: string, referenceDate = new Date()): Promise<MeiStatus> {
  const year = referenceDate.getFullYear();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new MeiError("Usuário não encontrado.", 404);

  const revenueLimit = user.meiRevenueLimit ? Number(user.meiRevenueLimit) : DEFAULT_MEI_REVENUE_LIMIT;
  const currentRevenue = await getAnnualRevenue(userId, year);
  const monthsElapsed = referenceDate.getMonth() + 1;
  const projectedRevenue = monthsElapsed > 0 ? (currentRevenue / monthsElapsed) * 12 : 0;

  return {
    year,
    revenueLimit,
    currentRevenue,
    usagePercent: revenueLimit > 0 ? Math.round((currentRevenue / revenueLimit) * 100) : 0,
    overLimit: currentRevenue > revenueLimit,
    projectedRevenue: Math.round(projectedRevenue * 100) / 100,
    projectedOverLimit: projectedRevenue > revenueLimit,
    monthsElapsed,
  };
}

export interface MeiSettings {
  dasMonthlyAmount: number | null;
  meiRevenueLimit: number | null;
}

export async function getMeiSettings(userId: string): Promise<MeiSettings> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new MeiError("Usuário não encontrado.", 404);

  return {
    dasMonthlyAmount: user.dasMonthlyAmount ? Number(user.dasMonthlyAmount) : null,
    meiRevenueLimit: user.meiRevenueLimit ? Number(user.meiRevenueLimit) : null,
  };
}

export async function updateMeiSettings(
  userId: string,
  data: { dasMonthlyAmount?: number | null; meiRevenueLimit?: number | null }
): Promise<MeiSettings> {
  const user = await prisma.user.update({ where: { id: userId }, data });

  return {
    dasMonthlyAmount: user.dasMonthlyAmount ? Number(user.dasMonthlyAmount) : null,
    meiRevenueLimit: user.meiRevenueLimit ? Number(user.meiRevenueLimit) : null,
  };
}
