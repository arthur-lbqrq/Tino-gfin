import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findFirst: vi.fn() },
    account: { findFirst: vi.fn() },
    transaction: { create: vi.fn() },
  },
}));

vi.mock("@/invoices/invoice.service", () => ({
  resolveInvoiceForPurchase: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { resolveInvoiceForPurchase } from "@/invoices/invoice.service";
import { createInstallmentPurchase, TransactionError } from "./transaction.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });
const mockedResolveInvoice = vi.mocked(resolveInvoiceForPurchase);

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.category.findFirst.mockResolvedValue({ id: "cat1", type: "DESPESA" } as never);
  mockedPrisma.account.findFirst.mockResolvedValue({ id: "acc1", type: "CARTAO_CREDITO" } as never);
  mockedResolveInvoice.mockResolvedValue({ id: "inv1" } as never);
  mockedPrisma.transaction.create.mockImplementation(((args: { data: Record<string, unknown> }) =>
    Promise.resolve({ ...args.data, category: {}, account: {} })) as never);
});

describe("createInstallmentPurchase", () => {
  it("rejects installments on a non credit-card account", async () => {
    mockedPrisma.account.findFirst.mockResolvedValue({ id: "acc1", type: "CORRENTE" } as never);

    await expect(
      createInstallmentPurchase({
        userId: "u1",
        categoryId: "cat1",
        accountId: "acc1",
        type: "DESPESA",
        amount: 100,
        date: new Date(2026, 7, 1),
        installments: 3,
      })
    ).rejects.toThrow(TransactionError);
  });

  it("splits a purchase into equal cents across installments with no remainder", async () => {
    const created = await createInstallmentPurchase({
      userId: "u1",
      categoryId: "cat1",
      accountId: "acc1",
      type: "DESPESA",
      amount: 90,
      date: new Date(2026, 7, 1),
      installments: 3,
    });

    expect(created).toHaveLength(3);
    expect(created.map((t) => Number(t.amount))).toEqual([30, 30, 30]);
  });

  it("puts the rounding remainder entirely on the last installment", async () => {
    const created = await createInstallmentPurchase({
      userId: "u1",
      categoryId: "cat1",
      accountId: "acc1",
      type: "DESPESA",
      amount: 100,
      date: new Date(2026, 7, 1),
      installments: 3,
    });

    // 100 / 3 = 33.33... -> 33.33 + 33.33 + 33.34 = 100.00 exatamente
    expect(created.map((t) => Number(t.amount))).toEqual([33.33, 33.33, 33.34]);
    const total = created.reduce((sum, t) => sum + Number(t.amount), 0);
    expect(Math.round(total * 100) / 100).toBe(100);
  });

  it("numbers each installment and shares the same installmentGroupId", async () => {
    const created = await createInstallmentPurchase({
      userId: "u1",
      categoryId: "cat1",
      accountId: "acc1",
      type: "DESPESA",
      amount: 60,
      date: new Date(2026, 7, 1),
      installments: 2,
    });

    expect(created[0].installmentNumber).toBe(1);
    expect(created[1].installmentNumber).toBe(2);
    expect(created[0].installmentTotal).toBe(2);
    expect(created[0].installmentGroupId).toBe(created[1].installmentGroupId);
  });
});
