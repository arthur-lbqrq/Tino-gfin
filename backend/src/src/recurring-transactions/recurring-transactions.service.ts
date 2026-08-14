import { PrismaClient, RecurrenceFrequency, TransactionType } from "@prisma/client";
import { RecurringTransactionError } from "./recurring-transactions.errors";

const prisma = new PrismaClient();

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

export const recurringTransactionsService = {
  async create(input: CreateRecurringInput) {
    const account = await prisma.account.findFirst({
      where: { id: input.accountId, userId: input.userId },
    });
    if (!account) throw RecurringTransactionError.accountNotFound();

    const category = await prisma.category.findFirst({
      where: {
        id: input.categoryId,
        OR: [{ userId: input.userId }, { userId: null }],
      },
    });
    if (!category) throw RecurringTransactionError.categoryNotFound();

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
  },

  async listByUser(userId: string) {
    return prisma.recurringTransaction.findMany({
      where: { userId },
      orderBy: { startDate: "asc" },
    });
  },

  async getById(userId: string, id: string) {
    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });
    if (!recurring) throw RecurringTransactionError.notFound();
    return recurring;
  },

  async update(userId: string, id: string, input: UpdateRecurringInput) {
    await this.getById(userId, id);

    return prisma.recurringTransaction.update({
      where: { id },
      data: input,
    });
  },

  async delete(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.recurringTransaction.delete({ where: { id } });
  },

  // Gera as transações reais que estão pendentes até hoje, a partir dos
  // modelos de recorrência ativos. Pensado pra ser chamado por um endpoint
  // manual no MVP (ex: ao abrir o dashboard) e depois virar um job agendado
  // (cron) que roda pra todos os usuários sem precisar de request.
  async generatePending(userId: string) {
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
  },
};
