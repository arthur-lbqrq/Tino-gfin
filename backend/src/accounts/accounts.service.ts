import { Account, AccountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class AccountError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface CreateAccountInput {
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

interface UpdateAccountInput {
  name?: string;
  initialBalance?: number;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

function assertCreditCardFields(
  type: AccountType,
  creditLimit?: number,
  closingDay?: number,
  dueDay?: number
) {
  if (type === "CARTAO_CREDITO" && (creditLimit === undefined || closingDay === undefined || dueDay === undefined)) {
    throw new AccountError(
      "Contas do tipo cartão de crédito exigem limite, dia de fechamento e dia de vencimento.",
      422
    );
  }
}

export async function listAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createAccount(input: CreateAccountInput) {
  assertCreditCardFields(input.type, input.creditLimit, input.closingDay, input.dueDay);

  return prisma.account.create({
    data: {
      userId: input.userId,
      name: input.name,
      type: input.type,
      initialBalance: input.initialBalance,
      creditLimit: input.type === "CARTAO_CREDITO" ? input.creditLimit : null,
      closingDay: input.type === "CARTAO_CREDITO" ? input.closingDay : null,
      dueDay: input.type === "CARTAO_CREDITO" ? input.dueDay : null,
    },
  });
}

export async function findOwnedAccount(userId: string, accountId: string): Promise<Account> {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });

  if (!account) {
    throw new AccountError("Conta não encontrada.", 404);
  }

  return account;
}

export async function updateAccount(userId: string, accountId: string, data: UpdateAccountInput) {
  await findOwnedAccount(userId, accountId);

  return prisma.account.update({
    where: { id: accountId },
    data,
  });
}

export async function deleteAccount(userId: string, accountId: string) {
  const account = await findOwnedAccount(userId, accountId);

  const linkedTransactions = await prisma.transaction.count({
    where: { accountId: account.id },
  });

  if (linkedTransactions > 0) {
    throw new AccountError("Não é possível excluir uma conta que possui transações vinculadas.", 409);
  }

  await prisma.account.delete({ where: { id: account.id } });
}

// Saldo atual = saldo inicial + receitas - despesas lançadas na conta.
// Transferências entre contas não entram (isTransfer = true) pra não contar duas vezes.
export async function getAccountBalance(userId: string, accountId: string) {
  const account = await findOwnedAccount(userId, accountId);

  const result = await prisma.transaction.groupBy({
    by: ["type"],
    where: { accountId: account.id, isTransfer: false },
    _sum: { amount: true },
  });

  const receitas = Number(result.find((r) => r.type === "RECEITA")?._sum?.amount ?? 0);
  const despesas = Number(result.find((r) => r.type === "DESPESA")?._sum?.amount ?? 0);

  const balance = Number(account.initialBalance) + receitas - despesas;

  return { balance, initialBalance: account.initialBalance, receitas, despesas };
}
