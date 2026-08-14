import { PrismaClient, AccountType } from "@prisma/client";
import { AccountError } from "./accounts.errors";

const prisma = new PrismaClient();

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

function validateCreditCardFields(
  type: AccountType,
  creditLimit?: number,
  closingDay?: number,
  dueDay?: number
) {
  if (type === "CARTAO_CREDITO") {
    if (creditLimit === undefined || closingDay === undefined || dueDay === undefined) {
      throw AccountError.invalidCreditCardFields();
    }
  }
}

export const accountsService = {
  async create(input: CreateAccountInput) {
    validateCreditCardFields(input.type, input.creditLimit, input.closingDay, input.dueDay);

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
  },

  async listByUser(userId: string) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  },

  async getById(userId: string, accountId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) throw AccountError.notFound();

    return account;
  },

  async update(userId: string, accountId: string, input: UpdateAccountInput) {
    const account = await this.getById(userId, accountId);

    return prisma.account.update({
      where: { id: account.id },
      data: input,
    });
  },

  async delete(userId: string, accountId: string) {
    const account = await this.getById(userId, accountId);

    const linkedTransactions = await prisma.transaction.count({
      where: { accountId: account.id },
    });

    if (linkedTransactions > 0) {
      throw AccountError.hasLinkedTransactions();
    }

    await prisma.account.delete({ where: { id: account.id } });
  },

  // Saldo atual = saldo inicial + receitas - despesas lançadas na conta.
  // Transferências entre contas não entram (isTransfer = true) pra não contar duas vezes.
  async getBalance(userId: string, accountId: string) {
    const account = await this.getById(userId, accountId);

    const result = await prisma.transaction.groupBy({
      by: ["type"],
      where: { accountId: account.id, isTransfer: false },
      _sum: { amount: true },
    });

    const receitas = result.find((r) => r.type === "RECEITA")?._sum.amount ?? 0;
    const despesas = result.find((r) => r.type === "DESPESA")?._sum.amount ?? 0;

    const balance = Number(account.initialBalance) + Number(receitas) - Number(despesas);

    return {
      balance,
      initialBalance: account.initialBalance,
      receitas,
      despesas,
    };
  },
};
