import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: { groupBy: vi.fn(), aggregate: vi.fn() },
    category: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getDRE, getPeriodComparison, monthsOfYear } from "./dre.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDRE", () => {
  it("groups receitas and despesas by category and computes resultado", async () => {
    mockedPrisma.transaction.groupBy
      .mockResolvedValueOnce([{ categoryId: "c1", _sum: { amount: 5000 } }] as never)
      .mockResolvedValueOnce([
        { categoryId: "c2", _sum: { amount: 1200 } },
        { categoryId: "c3", _sum: { amount: 800 } },
      ] as never);
    mockedPrisma.category.findMany
      .mockResolvedValueOnce([{ id: "c1", name: "Vendas" }] as never)
      .mockResolvedValueOnce([
        { id: "c2", name: "Fornecedores" },
        { id: "c3", name: "Marketing" },
      ] as never);

    const report = await getDRE("u1", new Date(2026, 0, 1), new Date(2026, 0, 31));

    expect(report.receitas.total).toBe(5000);
    expect(report.despesas.total).toBe(2000);
    expect(report.resultado).toBe(3000);
    // maior despesa primeiro
    expect(report.despesas.items[0].categoryName).toBe("Fornecedores");
  });

  it("returns empty sections with zero totals when there's no data", async () => {
    mockedPrisma.transaction.groupBy.mockResolvedValue([]);

    const report = await getDRE("u1", new Date(2026, 0, 1), new Date(2026, 0, 31));

    expect(report.receitas).toEqual({ items: [], total: 0 });
    expect(report.despesas).toEqual({ items: [], total: 0 });
    expect(report.resultado).toBe(0);
  });
});

describe("getPeriodComparison", () => {
  it("sums each period independently", async () => {
    mockedPrisma.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 1000 } } as never) // receitas jan
      .mockResolvedValueOnce({ _sum: { amount: 400 } } as never) // despesas jan
      .mockResolvedValueOnce({ _sum: { amount: 1500 } } as never) // receitas fev
      .mockResolvedValueOnce({ _sum: { amount: 900 } } as never); // despesas fev

    const result = await getPeriodComparison("u1", [
      { label: "jan", startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 31) },
      { label: "fev", startDate: new Date(2026, 1, 1), endDate: new Date(2026, 1, 28) },
    ]);

    expect(result).toEqual([
      { label: "jan", startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 31), receitas: 1000, despesas: 400, resultado: 600 },
      { label: "fev", startDate: new Date(2026, 1, 1), endDate: new Date(2026, 1, 28), receitas: 1500, despesas: 900, resultado: 600 },
    ]);
  });
});

describe("monthsOfYear", () => {
  it("returns 12 periods spanning the full calendar year", () => {
    const months = monthsOfYear(2026);

    expect(months).toHaveLength(12);
    expect(months[0].startDate).toEqual(new Date(2026, 0, 1));
    expect(months[11].endDate.getMonth()).toBe(11);
    expect(months[11].endDate.getDate()).toBe(31);
  });
});
