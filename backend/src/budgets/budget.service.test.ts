import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findFirst: vi.fn() },
    budget: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    transaction: { aggregate: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { BudgetError, createBudget, getBudgetStatus } from "./budget.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createBudget", () => {
  it("rejects a category that doesn't belong to the user (or default)", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue(null);

    await expect(
      createBudget({ userId: "u1", categoryId: "c1", amount: 100, referenceMonth: "2026-08" })
    ).rejects.toThrow(BudgetError);
  });

  it("rejects a category that isn't an expense category", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue({ id: "c1", type: "RECEITA" } as never);

    await expect(
      createBudget({ userId: "u1", categoryId: "c1", amount: 100, referenceMonth: "2026-08" })
    ).rejects.toThrow("Orçamento só pode ser definido para categorias de despesa.");
  });

  it("rejects a duplicate budget for the same category/month", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue({ id: "c1", type: "DESPESA" } as never);
    mockedPrisma.budget.findUnique.mockResolvedValue({ id: "existing" } as never);

    await expect(
      createBudget({ userId: "u1", categoryId: "c1", amount: 100, referenceMonth: "2026-08" })
    ).rejects.toThrow("Já existe um orçamento para essa categoria nesse mês.");
  });
});

describe("getBudgetStatus", () => {
  it("computes usagePercent and flags overBudget when spent exceeds the limit", async () => {
    mockedPrisma.budget.findMany.mockResolvedValue([
      { id: "b1", categoryId: "c1", amount: 200, category: { name: "Mercado" } },
    ] as never);
    mockedPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 250 } } as never);

    const [status] = await getBudgetStatus("u1", "2026-08");

    expect(status.limit).toBe(200);
    expect(status.spent).toBe(250);
    expect(status.usagePercent).toBe(125);
    expect(status.overBudget).toBe(true);
    expect(status.remaining).toBe(-50);
  });

  it("does not flag overBudget when spent equals the limit exactly", async () => {
    mockedPrisma.budget.findMany.mockResolvedValue([
      { id: "b1", categoryId: "c1", amount: 200, category: { name: "Mercado" } },
    ] as never);
    mockedPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 200 } } as never);

    const [status] = await getBudgetStatus("u1", "2026-08");

    expect(status.usagePercent).toBe(100);
    expect(status.overBudget).toBe(false);
  });

  it("treats a null aggregate sum (no transactions yet) as zero spent", async () => {
    mockedPrisma.budget.findMany.mockResolvedValue([
      { id: "b1", categoryId: "c1", amount: 200, category: { name: "Mercado" } },
    ] as never);
    mockedPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } } as never);

    const [status] = await getBudgetStatus("u1", "2026-08");

    expect(status.spent).toBe(0);
    expect(status.usagePercent).toBe(0);
  });
});
