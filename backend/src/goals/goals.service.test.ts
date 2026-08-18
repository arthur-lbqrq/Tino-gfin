import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: { findFirst: vi.fn() },
    goal: { create: vi.fn(), findMany: vi.fn() },
    transaction: { groupBy: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { createGoal, GoalError, listGoalsWithProgress } from "./goals.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createGoal", () => {
  it("rejects an account that doesn't belong to the user", async () => {
    mockedPrisma.account.findFirst.mockResolvedValue(null);

    await expect(
      createGoal({ userId: "u1", name: "Viagem", targetAmount: 3000, accountId: "acc1" })
    ).rejects.toThrow(GoalError);
  });
});

describe("listGoalsWithProgress", () => {
  it("computes progressPercent from the linked account's current balance", async () => {
    mockedPrisma.goal.findMany.mockResolvedValue([
      {
        id: "g1",
        name: "Viagem",
        targetAmount: 1000,
        targetDate: null,
        accountId: "acc1",
        account: { id: "acc1", name: "Poupança", initialBalance: 200 },
        createdAt: new Date(2026, 6, 1),
      },
    ] as never);
    mockedPrisma.account.findFirst.mockResolvedValue({ id: "acc1", initialBalance: 200 } as never);
    mockedPrisma.transaction.groupBy.mockResolvedValue([
      { type: "RECEITA", _sum: { amount: 300 } },
    ] as never);

    const [goal] = await listGoalsWithProgress("u1");

    // saldo = initialBalance(200) + receitas(300) - despesas(0) = 500
    expect(goal.currentAmount).toBe(500);
    expect(goal.progressPercent).toBe(50);
    expect(goal.achieved).toBe(false);
  });

  it("caps progressPercent at 100 and flags achieved once the balance passes the target", async () => {
    mockedPrisma.goal.findMany.mockResolvedValue([
      {
        id: "g1",
        name: "Emergência",
        targetAmount: 500,
        targetDate: null,
        accountId: "acc1",
        account: { id: "acc1", name: "Poupança", initialBalance: 0 },
        createdAt: new Date(2026, 6, 1),
      },
    ] as never);
    mockedPrisma.account.findFirst.mockResolvedValue({ id: "acc1", initialBalance: 0 } as never);
    mockedPrisma.transaction.groupBy.mockResolvedValue([
      { type: "RECEITA", _sum: { amount: 900 } },
    ] as never);

    const [goal] = await listGoalsWithProgress("u1");

    expect(goal.currentAmount).toBe(900);
    expect(goal.progressPercent).toBe(100);
    expect(goal.achieved).toBe(true);
  });
});
