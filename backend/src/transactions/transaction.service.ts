import { randomUUID } from "crypto";
import { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveInvoiceForPurchase } from "@/invoices/invoice.service";

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
  accountId?: string;
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

async function resolveAccount(userId: string, accountId?: string) {
  if (!accountId) return null;

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });

  if (!account) {
    throw new TransactionError("Conta não encontrada.", 404);
  }

  return account;
}

export async function createTransaction(input: CreateTransactionInput) {
  const category = await assertCategoryBelongsToUser(input.userId, input.categoryId);

  if (category.type !== input.type) {
    throw new TransactionError(
      "O tipo da transação não bate com o tipo da categoria escolhida.",
      422
    );
  }

  const account = await resolveAccount(input.userId, input.accountId);

  let invoiceId: string | undefined;
  if (account?.type === "CARTAO_CREDITO") {
    if (input.type !== "DESPESA") {
      throw new TransactionError(
        "Cartão de crédito só registra despesas. Pagamento de fatura é lançado como despesa na conta que paga.",
        422
      );
    }
    const invoice = await resolveInvoiceForPurchase(account, input.date, 0);
    invoiceId = invoice.id;
  }

  return prisma.transaction.create({
    data: {
      userId: input.userId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      date: input.date,
      accountId: account?.id,
      invoiceId,
    },
    include: { category: true, account: true },
  });
}

// Divide uma compra de cartão em N parcelas: cada parcela é uma Transaction própria,
// com a data original da compra mas ligada à fatura do mês correspondente.
// A divisão é feita em centavos pra não perder/sobrar arredondamento — a última
// parcela absorve a diferença.
export async function createInstallmentPurchase(
  input: CreateTransactionInput & { installments: number }
) {
  const category = await assertCategoryBelongsToUser(input.userId, input.categoryId);

  if (input.type !== "DESPESA" || category.type !== "DESPESA") {
    throw new TransactionError("Só é possível parcelar despesas.", 422);
  }

  const account = await resolveAccount(input.userId, input.accountId);

  if (!account || account.type !== "CARTAO_CREDITO") {
    throw new TransactionError("Parcelamento só é permitido em contas de cartão de crédito.", 422);
  }

  const totalInstallments = input.installments;
  const groupId = randomUUID();

  const totalCents = Math.round(input.amount * 100);
  const baseCents = Math.floor(totalCents / totalInstallments);
  const remainderCents = totalCents - baseCents * totalInstallments;

  const created = [];

  for (let i = 0; i < totalInstallments; i++) {
    const isLast = i === totalInstallments - 1;
    const cents = baseCents + (isLast ? remainderCents : 0);
    const invoice = await resolveInvoiceForPurchase(account, input.date, i);

    const transaction = await prisma.transaction.create({
      data: {
        userId: input.userId,
        categoryId: input.categoryId,
        type: "DESPESA",
        amount: cents / 100,
        description: input.description
          ? `${input.description} (${i + 1}/${totalInstallments})`
          : `Parcela ${i + 1}/${totalInstallments}`,
        date: input.date,
        accountId: account.id,
        invoiceId: invoice.id,
        installmentGroupId: groupId,
        installmentNumber: i + 1,
        installmentTotal: totalInstallments,
      },
      include: { category: true, account: true },
    });

    created.push(transaction);
  }

  return created;
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
    include: { category: true, account: true },
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
    include: { category: true, account: true },
  });
}

export async function deleteTransaction(userId: string, id: string) {
  await findOwnedTransaction(userId, id);
  await prisma.transaction.delete({ where: { id } });
}

// Cancela todas as parcelas restantes de uma compra parcelada de uma vez.
export async function deleteInstallmentGroup(userId: string, groupId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId, installmentGroupId: groupId },
  });

  if (transactions.length === 0) {
    throw new TransactionError("Parcelamento não encontrado.", 404);
  }

  await prisma.transaction.deleteMany({ where: { userId, installmentGroupId: groupId } });
}
