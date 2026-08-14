import { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class TransactionError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface CreateTransactionInput {
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  date: Date;
}

interface ListFilters {
  userId: string;
  type?: TransactionType;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
}

async function assertCategoryBelongsToUser(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId }, { userId: null }] },
  });

  if (!category) {
    throw new TransactionError("Categoria inválida.", 422);
  }

  return category;
}

export async function createTransaction(input: CreateTransactionInput) {
  const category = await assertCategoryBelongsToUser(input.userId, input.categoryId);

  if (category.type !== input.type) {
    throw new TransactionError(
      "O tipo da transação não bate com o tipo da categoria escolhida.",
      422
    );
  }

  return prisma.transaction.create({
    data: {
      userId: input.userId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      date: input.date,
    },
    include: { category: true },
  });
}

export async function listTransactions(filters: ListFilters) {
  return prisma.transaction.findMany({
    where: {
      userId: filters.userId,
      type: filters.type,
      categoryId: filters.categoryId,
      date: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });
}

async function findOwnedTransaction(userId: string, id: string) {
  const transaction = await prisma.transaction.findUnique({ where: { id } });

  if (!transaction || transaction.userId !== userId) {
    throw new TransactionError("Transação não encontrada.", 404);
  }

  return transaction;
}

export async function updateTransaction(
  userId: string,
  id: string,
  data: Partial<Omit<CreateTransactionInput, "userId">>
) {
  await findOwnedTransaction(userId, id);

  if (data.categoryId) {
    const category = await assertCategoryBelongsToUser(userId, data.categoryId);
    if (data.type && category.type !== data.type) {
      throw new TransactionError(
        "O tipo da transação não bate com o tipo da categoria escolhida.",
        422
      );
    }
  }

  return prisma.transaction.update({
    where: { id },
    data,
    include: { category: true },
  });
}

export async function deleteTransaction(userId: string, id: string) {
  await findOwnedTransaction(userId, id);
  await prisma.transaction.delete({ where: { id } });
}
