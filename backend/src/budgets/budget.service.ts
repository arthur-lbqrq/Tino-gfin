import { prisma } from "@/lib/prisma";

export class BudgetError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface CreateBudgetInput {
  userId: string;
  categoryId: string;
  amount: number;
  referenceMonth: string;
}

interface UpdateBudgetInput {
  amount: number;
}

async function assertExpenseCategoryBelongsToUser(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId }, { userId: null }] },
  });

  if (!category) {
    throw new BudgetError("Categoria inválida.", 422);
  }

  if (category.type !== "DESPESA") {
    throw new BudgetError("Orçamento só pode ser definido para categorias de despesa.", 422);
  }

  return category;
}

export async function createBudget(input: CreateBudgetInput) {
  await assertExpenseCategoryBelongsToUser(input.userId, input.categoryId);

  const existing = await prisma.budget.findUnique({
    where: {
      userId_categoryId_referenceMonth: {
        userId: input.userId,
        categoryId: input.categoryId,
        referenceMonth: input.referenceMonth,
      },
    },
  });

  if (existing) {
    throw new BudgetError("Já existe um orçamento para essa categoria nesse mês.", 409);
  }

  return prisma.budget.create({
    data: {
      userId: input.userId,
      categoryId: input.categoryId,
      amount: input.amount,
      referenceMonth: input.referenceMonth,
    },
    include: { category: true },
  });
}

export async function listBudgets(userId: string, referenceMonth?: string) {
  return prisma.budget.findMany({
    where: { userId, referenceMonth },
    include: { category: true },
    orderBy: [{ referenceMonth: "desc" }, { createdAt: "asc" }],
  });
}

export async function findOwnedBudget(userId: string, id: string) {
  const budget = await prisma.budget.findFirst({
    where: { id, userId },
    include: { category: true },
  });

  if (!budget) {
    throw new BudgetError("Orçamento não encontrado.", 404);
  }

  return budget;
}

export async function updateBudget(userId: string, id: string, data: UpdateBudgetInput) {
  await findOwnedBudget(userId, id);

  return prisma.budget.update({
    where: { id },
    data: { amount: data.amount },
    include: { category: true },
  });
}

export async function deleteBudget(userId: string, id: string) {
  await findOwnedBudget(userId, id);
  await prisma.budget.delete({ where: { id } });
}

function monthRange(referenceMonth: string) {
  const [year, month] = referenceMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

// Pra cada orçamento do mês, compara o limite definido com o total já gasto
// (despesas lançadas na mesma categoria dentro do mês de referência).
export async function getBudgetStatus(userId: string, referenceMonth: string) {
  const budgets = await listBudgets(userId, referenceMonth);
  const { start, end } = monthRange(referenceMonth);

  return Promise.all(
    budgets.map(async (budget) => {
      const result = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: "DESPESA",
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      const limit = Number(budget.amount);
      const spent = Number(result._sum.amount ?? 0);
      const usagePercent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      return {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        limit,
        spent,
        remaining: limit - spent,
        usagePercent,
        overBudget: spent > limit,
      };
    })
  );
}
