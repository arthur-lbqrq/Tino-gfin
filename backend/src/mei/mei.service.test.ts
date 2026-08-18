import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { aggregate: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { DEFAULT_MEI_REVENUE_LIMIT, getMeiStatus, MeiError } from "./mei.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMeiStatus", () => {
  it("throws when the user doesn't exist", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await expect(getMeiStatus("u1")).rejects.toThrow(MeiError);
  });

  it("uses the default revenue limit when the user hasn't set a custom one", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ meiRevenueLimit: null } as never);
    mockedPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 40000 } } as never);

    const status = await getMeiStatus("u1", new Date(2026, 5, 15));

    expect(status.revenueLimit).toBe(DEFAULT_MEI_REVENUE_LIMIT);
    expect(status.currentRevenue).toBe(40000);
    expect(status.usagePercent).toBe(Math.round((40000 / DEFAULT_MEI_REVENUE_LIMIT) * 100));
    expect(status.overLimit).toBe(false);
  });

  it("respects a custom revenue limit set by the user", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ meiRevenueLimit: 100000 } as never);
    mockedPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 50000 } } as never);

    const status = await getMeiStatus("u1", new Date(2026, 5, 15));

    expect(status.revenueLimit).toBe(100000);
    expect(status.usagePercent).toBe(50);
  });

  it("flags overLimit once accumulated revenue passes the ceiling", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ meiRevenueLimit: 10000 } as never);
    mockedPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 15000 } } as never);

    const status = await getMeiStatus("u1", new Date(2026, 5, 15));

    expect(status.overLimit).toBe(true);
  });

  it("projects a full-year total from the pace of months elapsed so far", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ meiRevenueLimit: 12000 } as never);
    // 6000 acumulado até o fim de fevereiro (mês 2) -> ritmo de 3000/mês -> projeção de 36000
    mockedPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 6000 } } as never);

    const status = await getMeiStatus("u1", new Date(2026, 1, 28));

    expect(status.monthsElapsed).toBe(2);
    expect(status.projectedRevenue).toBe(36000);
    expect(status.projectedOverLimit).toBe(true);
  });
});
