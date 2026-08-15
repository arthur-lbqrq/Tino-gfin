import { RecurrenceFrequency, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class RecurringTransactionError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface CreateRecurringInput {
  userId: string;
  accountId: string;
  categoryId: string;
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate?: Date;
}

interface UpdateRecurringInput {
  description?: string;
  amount?: number;
  frequency?: RecurrenceFrequency;
  endDate?: Date | null;
  active?: boolean;
}

function addInterval(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "DIARIA":
      next.setDate(next.getDate() + 1);
      break;
    case "SEMANAL":
      next.setDate(next.getDate() + 7);
      break;
    case "MENSAL":
      next.setMonth(next.getMonth() + 1);
      break;
    case "ANUAL":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function createRecurringTransaction(input: CreateRecurringInput) {
  const account = await prisma.account.findFirst({
    where: { id: input.accountId, userId: input.userId },
  });
  if (!account) throw new RecurringTransactionError("Conta não encontrada.", 404);

  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, OR: [{ userId: input.userId }, { userId: null }] },
  });
  if (!category) throw new RecurringTransactionError("Categoria não encontrada.", 404);

  return prisma.recurringTransaction.create({
    data: {
      userId: input.userId,
      accountId: input.accountId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      type: input.type,
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

export async function listRecurringTransactions(userId: string) {
  return prisma.recurringTransaction.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
  });
}

export async function findOwnedRecurringTransaction(userId: string, id: string) {
  const recurring = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
  if (!recurring) throw new RecurringTransactionError("Recorrência não encontrada.", 404);
  return recurring;
}

export async function updateRecurringTransaction(
  userId: string,
  id: string,
  input: UpdateRecurringInput
) {
  await findOwnedRecurringTransaction(userId, id);

  return prisma.recurringTransaction.update({ where: { id }, data: input });
}

export async function deleteRecurringTransaction(userId: string, id: string) {
  await findOwnedRecurringTransaction(userId, id);
  await prisma.recurringTransaction.delete({ where: { id } });
}

// Gera as transações reais que estão pendentes até hoje, a partir dos modelos
// de recorrência ativos. Endpoint manual no MVP; no futuro vira um job de cron.
export async function generatePendingRecurringTransactions(userId: string) {
  const today = new Date();

  const recurrences = await prisma.recurringTransaction.findMany({
    where: { userId, active: true, startDate: { lte: today } },
  });

  const created = [];

  for (const recurrence of recurrences) {
    if (recurrence.endDate && recurrence.endDate < today) continue;

    let cursor = recurrence.lastGeneratedAt
      ? addInterval(recurrence.lastGeneratedAt, recurrence.frequency)
      : recurrence.startDate;

    while (cursor <= today) {
      const transaction = await prisma.transaction.create({
        data: {
          userId: recurrence.userId,
          accountId: recurrence.accountId,
          categoryId: recurrence.categoryId,
          description: recurrence.description,
          amount: recurrence.amount,
          type: recurrence.type,
          date: cursor,
          recurringId: recurrence.id,
        },
      });

      created.push(transaction);

      await prisma.recurringTransaction.update({
        where: { id: recurrence.id },
        data: { lastGeneratedAt: cursor },
      });

      cursor = addInterval(cursor, recurrence.frequency);
    }
  }

  return created;
}
