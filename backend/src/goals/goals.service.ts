import { prisma } from "@/lib/prisma";
import { getAccountBalance } from "@/accounts/accounts.service";

export class GoalError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface CreateGoalInput {
  userId: string;
  name: string;
  targetAmount: number;
  targetDate?: Date;
  accountId: string;
}

interface UpdateGoalInput {
  name?: string;
  targetAmount?: number;
  targetDate?: Date | null;
}

async function assertAccountBelongsToUser(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new GoalError("Conta não encontrada.", 404);
  return account;
}

export async function createGoal(input: CreateGoalInput) {
  await assertAccountBelongsToUser(input.userId, input.accountId);

  return prisma.goal.create({
    data: {
      userId: input.userId,
      name: input.name,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate,
      accountId: input.accountId,
    },
    include: { account: true },
  });
}

export async function findOwnedGoal(userId: string, id: string) {
  const goal = await prisma.goal.findFirst({ where: { id, userId }, include: { account: true } });
  if (!goal) throw new GoalError("Meta não encontrada.", 404);
  return goal;
}

export async function updateGoal(userId: string, id: string, data: UpdateGoalInput) {
  await findOwnedGoal(userId, id);
  return prisma.goal.update({ where: { id }, data, include: { account: true } });
}

export async function deleteGoal(userId: string, id: string) {
  await findOwnedGoal(userId, id);
  await prisma.goal.delete({ where: { id } });
}

export interface GoalProgress {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date | null;
  accountId: string;
  accountName: string;
  currentAmount: number;
  progressPercent: number;
  achieved: boolean;
  createdAt: Date;
}

// Progresso de uma meta é derivado do saldo atual da conta vinculada — não existe
// um registro separado de "aporte", o usuário só lança/transfere pra conta normalmente,
// reaproveitando o mesmo cálculo de saldo já usado em accounts.service.
export async function listGoalsWithProgress(userId: string): Promise<GoalProgress[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { account: true },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(
    goals.map(async (goal): Promise<GoalProgress> => {
      const { balance } = await getAccountBalance(userId, goal.accountId);
      const targetAmount = Number(goal.targetAmount);
      const progressPercent =
        targetAmount > 0 ? Math.min(100, Math.round((balance / targetAmount) * 100)) : 0;

      return {
        id: goal.id,
        name: goal.name,
        targetAmount,
        targetDate: goal.targetDate,
        accountId: goal.accountId,
        accountName: goal.account.name,
        currentAmount: balance,
        progressPercent,
        achieved: balance >= targetAmount,
        createdAt: goal.createdAt,
      };
    })
  );
}
