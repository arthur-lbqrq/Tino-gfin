import { Account, Transaction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class InvoiceError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

export async function assertCardAccount(userId: string, accountId: string): Promise<Account> {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });

  if (!account) {
    throw new InvoiceError("Conta não encontrada.", 404);
  }

  if (account.type !== "CARTAO_CREDITO") {
    throw new InvoiceError("Essa conta não é um cartão de crédito.", 422);
  }

  return account;
}

// Determina a fatura (mês de referência, fechamento e vencimento) de uma compra,
// considerando quantos meses à frente ela cai (usado no parcelamento).
// Regra: se a compra acontece depois do dia de fechamento, ela já entra na fatura
// do mês seguinte. O vencimento cai no mesmo mês do fechamento se dueDay > closingDay,
// senão no mês seguinte (ex: fecha dia 28, vence dia 5 do mês seguinte).
function computeInvoicePeriod(
  account: Pick<Account, "closingDay" | "dueDay">,
  purchaseDate: Date,
  monthsAhead: number
) {
  if (!account.closingDay || !account.dueDay) {
    throw new InvoiceError(
      "Essa conta de cartão de crédito não tem dia de fechamento/vencimento configurado.",
      422
    );
  }

  let month = purchaseDate.getMonth();
  const year = purchaseDate.getFullYear();

  if (purchaseDate.getDate() > account.closingDay) {
    month += 1;
  }
  month += monthsAhead;

  // new Date normaliza mês > 11 (ou negativo) automaticamente, virando o ano certo
  const closingDate = new Date(year, month, account.closingDay);

  const dueMonthOffset = account.dueDay <= account.closingDay ? 1 : 0;
  const dueDate = new Date(closingDate.getFullYear(), closingDate.getMonth() + dueMonthOffset, account.dueDay);

  const referenceMonth = `${closingDate.getFullYear()}-${String(closingDate.getMonth() + 1).padStart(2, "0")}`;

  return { referenceMonth, closingDate, dueDate };
}

// Busca a fatura do período ou cria (lazy) se ainda não existir.
export async function resolveInvoiceForPurchase(account: Account, purchaseDate: Date, monthsAhead = 0) {
  const { referenceMonth, closingDate, dueDate } = computeInvoicePeriod(account, purchaseDate, monthsAhead);

  return prisma.invoice.upsert({
    where: { accountId_referenceMonth: { accountId: account.id, referenceMonth } },
    update: {},
    create: { accountId: account.id, referenceMonth, closingDate, dueDate },
  });
}

export async function listInvoices(userId: string, accountId: string) {
  const account = await assertCardAccount(userId, accountId);

  const invoices = await prisma.invoice.findMany({
    where: { accountId: account.id },
    orderBy: { referenceMonth: "asc" },
    include: { transactions: true },
  });

  return invoices.map(({ transactions, ...invoice }: typeof invoices[number]) => ({
    ...invoice,
    total: transactions.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0),
    transactionCount: transactions.length,
  }));
}

export async function getInvoice(userId: string, accountId: string, invoiceId: string) {
  const account = await assertCardAccount(userId, accountId);

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, accountId: account.id },
    include: {
      transactions: { include: { category: true }, orderBy: { date: "asc" } },
    },
  });

  if (!invoice) {
    throw new InvoiceError("Fatura não encontrada.", 404);
  }

  const total = invoice.transactions.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);

  return { ...invoice, total };
}

export async function payInvoice(userId: string, accountId: string, invoiceId: string) {
  const account = await assertCardAccount(userId, accountId);

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, accountId: account.id } });

  if (!invoice) {
    throw new InvoiceError("Fatura não encontrada.", 404);
  }

  return prisma.invoice.update({ where: { id: invoice.id }, data: { paid: true } });
}

// Soma de todas as faturas em aberto (não pagas) comparada ao limite da conta.
// Usado pra alertar o usuário quando ele está perto de (ou já passou) o limite.
export async function getCreditLimitStatus(userId: string, accountId: string) {
  const account = await assertCardAccount(userId, accountId);

  const openInvoices = await prisma.invoice.findMany({
    where: { accountId: account.id, paid: false },
    include: { transactions: true },
  });

  const used = openInvoices.reduce(
    (sum: number, invoice: (typeof openInvoices)[number]) =>
      sum + invoice.transactions.reduce((s: number, t: Transaction) => s + Number(t.amount), 0),
    0
  );

  const limit = Number(account.creditLimit ?? 0);
  const available = Math.max(limit - used, 0);
  const usagePercent = limit > 0 ? Math.round((used / limit) * 100) : 0;

  return { limit, used, available, usagePercent, overLimit: used > limit };
}
