import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: { aggregate: vi.fn(), groupBy: vi.fn() },
    recurringTransaction: { findMany: vi.fn() },
    account: { findMany: vi.fn() },
    invoice: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/budgets/budget.service", () => ({
  getBudgetStatus: vi.fn(),
}));

vi.mock("@/goals/goals.service", () => ({
  listGoalsWithProgress: vi.fn(),
}));

vi.mock("@/invoices/invoice.service", () => ({
  getCreditLimitStatus: vi.fn(),
}));

vi.mock("@/mei/mei.service", async () => {
  const actual = await vi.importActual<typeof import("@/mei/mei.service")>("@/mei/mei.service");
  return { ...actual, getMeiStatus: vi.fn() };
});

import { prisma } from "@/lib/prisma";
import { getBudgetStatus } from "@/budgets/budget.service";
import { listGoalsWithProgress } from "@/goals/goals.service";
import { getCreditLimitStatus } from "@/invoices/invoice.service";
import { getMeiStatus } from "@/mei/mei.service";
import {
  checkBudgetStatus,
  checkConsolidatedBalance,
  checkCreditCardLimit,
  checkDasReminder,
  checkGoalsProgress,
  checkMeiLimit,
  checkUpcomingFixedCommitments,
  checkUpcomingInvoiceDue,
  checkUpcomingRecurringDue,
} from "./insight.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });
const mockedGetBudgetStatus = vi.mocked(getBudgetStatus);
const mockedListGoalsWithProgress = vi.mocked(listGoalsWithProgress);
const mockedGetCreditLimitStatus = vi.mocked(getCreditLimitStatus);
const mockedGetMeiStatus = vi.mocked(getMeiStatus);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkBudgetStatus", () => {
  it("stays silent below the 80% usage threshold", async () => {
    mockedGetBudgetStatus.mockResolvedValue([
      { categoryId: "c1", categoryName: "Mercado", limit: 100, spent: 79, usagePercent: 79, overBudget: false } as never,
    ]);

    expect(await checkBudgetStatus("u1", new Date())).toEqual([]);
  });

  it("warns at exactly 80% usage", async () => {
    mockedGetBudgetStatus.mockResolvedValue([
      { categoryId: "c1", categoryName: "Mercado", limit: 100, spent: 80, usagePercent: 80, overBudget: false } as never,
    ]);

    const [insight] = await checkBudgetStatus("u1", new Date());
    expect(insight.type).toBe("budget_near_limit");
    expect(insight.severity).toBe("warning");
  });

  it("escalates to critical once spending passes the limit", async () => {
    mockedGetBudgetStatus.mockResolvedValue([
      { categoryId: "c1", categoryName: "Mercado", limit: 100, spent: 130, usagePercent: 130, overBudget: true } as never,
    ]);

    const [insight] = await checkBudgetStatus("u1", new Date());
    expect(insight.type).toBe("budget_over_limit");
    expect(insight.severity).toBe("critical");
  });
});

describe("checkUpcomingFixedCommitments", () => {
  it("returns null when there are no active recurrences", async () => {
    mockedPrisma.recurringTransaction.findMany.mockResolvedValue([]);
    mockedPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } } as never);

    expect(await checkUpcomingFixedCommitments("u1", new Date(2026, 7, 1))).toBeNull();
  });

  it("goes critical when upcoming fixed expenses exceed the current balance", async () => {
    mockedPrisma.recurringTransaction.findMany.mockResolvedValue([
      {
        userId: "u1",
        type: "DESPESA",
        amount: 5000,
        frequency: "MENSAL",
        startDate: new Date(2026, 7, 5),
        endDate: null,
        lastGeneratedAt: null,
      },
    ] as never);
    // saldoAtual: receitas 1000 - despesas 2000 = -1000
    mockedPrisma.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 1000 } } as never)
      .mockResolvedValueOnce({ _sum: { amount: 2000 } } as never);

    const insight = await checkUpcomingFixedCommitments("u1", new Date(2026, 7, 1));
    expect(insight?.severity).toBe("critical");
  });
});

describe("checkConsolidatedBalance", () => {
  it("returns null when the user only has one account (nothing to consolidate)", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([{ id: "a1" }] as never);

    expect(await checkConsolidatedBalance("u1")).toBeNull();
  });

  it("stays silent when no account is negative", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([
      { id: "a1", name: "Conta A", initialBalance: 100 },
      { id: "a2", name: "Conta B", initialBalance: 100 },
    ] as never);
    mockedPrisma.transaction.groupBy.mockResolvedValue([]);

    expect(await checkConsolidatedBalance("u1")).toBeNull();
  });

  it("reassures the user when one account is negative but the consolidated total is positive", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([
      { id: "a1", name: "Caixa", initialBalance: -100 },
      { id: "a2", name: "Poupança", initialBalance: 500 },
    ] as never);
    mockedPrisma.transaction.groupBy.mockResolvedValue([]);

    const insight = await checkConsolidatedBalance("u1");
    expect(insight?.type).toBe("low_balance_offset_by_other_accounts");
    expect(insight?.severity).toBe("info");
    expect(insight?.data.totalConsolidado).toBe(400);
  });

  it("stays silent when the consolidated total is also negative (no offset to report)", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([
      { id: "a1", name: "Caixa", initialBalance: -500 },
      { id: "a2", name: "Poupança", initialBalance: 100 },
    ] as never);
    mockedPrisma.transaction.groupBy.mockResolvedValue([]);

    expect(await checkConsolidatedBalance("u1")).toBeNull();
  });
});

describe("checkUpcomingInvoiceDue", () => {
  const now = new Date(2026, 7, 10);

  it("ignores an unpaid invoice with no transactions (nothing to charge)", async () => {
    mockedPrisma.invoice.findMany.mockResolvedValue([
      {
        id: "inv1",
        accountId: "acc1",
        dueDate: new Date(2026, 7, 12),
        account: { name: "Nubank" },
        transactions: [],
      },
    ] as never);

    expect(await checkUpcomingInvoiceDue("u1", now)).toEqual([]);
  });

  it("warns when the invoice is due in a few days", async () => {
    mockedPrisma.invoice.findMany.mockResolvedValue([
      {
        id: "inv1",
        accountId: "acc1",
        dueDate: new Date(2026, 7, 14),
        account: { name: "Nubank" },
        transactions: [{ amount: 250 }],
      },
    ] as never);

    const [insight] = await checkUpcomingInvoiceDue("u1", now);
    expect(insight.severity).toBe("warning");
    expect(insight.data.diasParaVencer).toBe(4);
  });

  it("escalates to critical when the invoice is already overdue", async () => {
    mockedPrisma.invoice.findMany.mockResolvedValue([
      {
        id: "inv1",
        accountId: "acc1",
        dueDate: new Date(2026, 7, 8),
        account: { name: "Nubank" },
        transactions: [{ amount: 250 }],
      },
    ] as never);

    const [insight] = await checkUpcomingInvoiceDue("u1", now);
    expect(insight.severity).toBe("critical");
    expect(insight.message).toContain("venceu há");
  });
});

describe("checkUpcomingRecurringDue", () => {
  const now = new Date(2026, 7, 10);

  it("skips a recurrence whose next occurrence falls outside the horizon", async () => {
    mockedPrisma.recurringTransaction.findMany.mockResolvedValue([
      {
        id: "r1",
        description: "Aluguel",
        type: "DESPESA",
        amount: 1500,
        frequency: "MENSAL",
        startDate: new Date(2026, 6, 20),
        endDate: null,
        lastGeneratedAt: new Date(2026, 6, 20),
      },
    ] as never);

    // próxima ocorrência: 20/07 + 1 mês = 20/08, fora da janela de 3 dias a partir de 10/08
    expect(await checkUpcomingRecurringDue("u1", now)).toEqual([]);
  });

  it("warns for a fixed expense due tomorrow", async () => {
    mockedPrisma.recurringTransaction.findMany.mockResolvedValue([
      {
        id: "r1",
        description: "Internet",
        type: "DESPESA",
        amount: 120,
        frequency: "MENSAL",
        startDate: new Date(2026, 6, 11),
        endDate: null,
        lastGeneratedAt: new Date(2026, 6, 11),
      },
    ] as never);

    const [insight] = await checkUpcomingRecurringDue("u1", now);
    expect(insight.severity).toBe("warning");
    expect(insight.data.diasParaVencer).toBe(1);
  });

  it("uses info severity for an upcoming fixed income", async () => {
    mockedPrisma.recurringTransaction.findMany.mockResolvedValue([
      {
        id: "r1",
        description: "Salário",
        type: "RECEITA",
        amount: 5000,
        frequency: "MENSAL",
        startDate: new Date(2026, 6, 11),
        endDate: null,
        lastGeneratedAt: new Date(2026, 6, 11),
      },
    ] as never);

    const [insight] = await checkUpcomingRecurringDue("u1", now);
    expect(insight.severity).toBe("info");
  });

  it("skips a recurrence that already ended before the next occurrence", async () => {
    mockedPrisma.recurringTransaction.findMany.mockResolvedValue([
      {
        id: "r1",
        description: "Assinatura",
        type: "DESPESA",
        amount: 30,
        frequency: "MENSAL",
        startDate: new Date(2026, 6, 11),
        endDate: new Date(2026, 7, 5),
        lastGeneratedAt: new Date(2026, 6, 11),
      },
    ] as never);

    expect(await checkUpcomingRecurringDue("u1", now)).toEqual([]);
  });
});

describe("checkGoalsProgress", () => {
  const now = new Date(2026, 7, 10);

  it("celebrates a goal that has already been achieved", async () => {
    mockedListGoalsWithProgress.mockResolvedValue([
      {
        id: "g1",
        name: "Viagem",
        targetAmount: 1000,
        targetDate: null,
        accountId: "acc1",
        accountName: "Poupança",
        currentAmount: 1200,
        progressPercent: 100,
        achieved: true,
        createdAt: new Date(2026, 5, 1),
      },
    ]);

    const [insight] = await checkGoalsProgress("u1", now);
    expect(insight.type).toBe("goal_achieved");
    expect(insight.severity).toBe("info");
  });

  it("stays silent for a goal with no target date that isn't achieved yet", async () => {
    mockedListGoalsWithProgress.mockResolvedValue([
      {
        id: "g1",
        name: "Viagem",
        targetAmount: 1000,
        targetDate: null,
        accountId: "acc1",
        accountName: "Poupança",
        currentAmount: 200,
        progressPercent: 20,
        achieved: false,
        createdAt: new Date(2026, 5, 1),
      },
    ]);

    expect(await checkGoalsProgress("u1", now)).toEqual([]);
  });

  it("goes critical when the target date has already passed without reaching the goal", async () => {
    mockedListGoalsWithProgress.mockResolvedValue([
      {
        id: "g1",
        name: "Viagem",
        targetAmount: 1000,
        targetDate: new Date(2026, 7, 5),
        accountId: "acc1",
        accountName: "Poupança",
        currentAmount: 400,
        progressPercent: 40,
        achieved: false,
        createdAt: new Date(2026, 5, 1),
      },
    ]);

    const [insight] = await checkGoalsProgress("u1", now);
    expect(insight.severity).toBe("critical");
    expect(insight.data.missing).toBe(600);
  });

  it("warns when progress is well behind the expected pace for the target date", async () => {
    mockedListGoalsWithProgress.mockResolvedValue([
      {
        id: "g1",
        name: "Viagem",
        // criada em 01/07, prazo 31/08 (61 dias); hoje 10/08 -> ~65% do prazo decorrido,
        // mas só 10% guardado -> bem atrás do ritmo esperado
        targetAmount: 1000,
        targetDate: new Date(2026, 7, 31),
        accountId: "acc1",
        accountName: "Poupança",
        currentAmount: 100,
        progressPercent: 10,
        achieved: false,
        createdAt: new Date(2026, 6, 1),
      },
    ]);

    const [insight] = await checkGoalsProgress("u1", now);
    expect(insight.type).toBe("goal_behind_schedule");
    expect(insight.severity).toBe("warning");
  });

  it("stays silent when progress is roughly on pace for the target date", async () => {
    mockedListGoalsWithProgress.mockResolvedValue([
      {
        id: "g1",
        name: "Viagem",
        targetAmount: 1000,
        targetDate: new Date(2026, 7, 31),
        accountId: "acc1",
        accountName: "Poupança",
        currentAmount: 650,
        progressPercent: 65,
        achieved: false,
        createdAt: new Date(2026, 6, 1),
      },
    ]);

    expect(await checkGoalsProgress("u1", now)).toEqual([]);
  });
});

describe("checkCreditCardLimit", () => {
  it("ignores a card with no limit configured yet", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([{ id: "acc1", name: "Nubank" }] as never);
    mockedGetCreditLimitStatus.mockResolvedValue({
      limit: 0,
      used: 0,
      available: 0,
      usagePercent: 0,
      overLimit: false,
    });

    expect(await checkCreditCardLimit("u1")).toEqual([]);
  });

  it("stays silent below the 80% usage threshold", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([{ id: "acc1", name: "Nubank" }] as never);
    mockedGetCreditLimitStatus.mockResolvedValue({
      limit: 1000,
      used: 700,
      available: 300,
      usagePercent: 70,
      overLimit: false,
    });

    expect(await checkCreditCardLimit("u1")).toEqual([]);
  });

  it("warns at 80% usage", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([{ id: "acc1", name: "Nubank" }] as never);
    mockedGetCreditLimitStatus.mockResolvedValue({
      limit: 1000,
      used: 800,
      available: 200,
      usagePercent: 80,
      overLimit: false,
    });

    const [insight] = await checkCreditCardLimit("u1");
    expect(insight.type).toBe("credit_limit_near");
    expect(insight.severity).toBe("warning");
  });

  it("escalates to critical once the limit is exceeded", async () => {
    mockedPrisma.account.findMany.mockResolvedValue([{ id: "acc1", name: "Nubank" }] as never);
    mockedGetCreditLimitStatus.mockResolvedValue({
      limit: 1000,
      used: 1200,
      available: 0,
      usagePercent: 120,
      overLimit: true,
    });

    const [insight] = await checkCreditCardLimit("u1");
    expect(insight.type).toBe("credit_limit_over");
    expect(insight.severity).toBe("critical");
  });
});

describe("checkMeiLimit", () => {
  const now = new Date(2026, 5, 10);

  it("stays silent well below the limit with no aggressive projection", async () => {
    mockedGetMeiStatus.mockResolvedValue({
      year: 2026,
      revenueLimit: 81000,
      currentRevenue: 20000,
      usagePercent: 25,
      overLimit: false,
      projectedRevenue: 40000,
      projectedOverLimit: false,
      monthsElapsed: 6,
    });

    expect(await checkMeiLimit("u1", now)).toBeNull();
  });

  it("warns when accumulated revenue passes 80% of the ceiling", async () => {
    mockedGetMeiStatus.mockResolvedValue({
      year: 2026,
      revenueLimit: 81000,
      currentRevenue: 65000,
      usagePercent: 80,
      overLimit: false,
      projectedRevenue: 130000,
      projectedOverLimit: true,
      monthsElapsed: 6,
    });

    const insight = await checkMeiLimit("u1", now);
    expect(insight?.type).toBe("mei_limit_near");
    expect(insight?.severity).toBe("warning");
  });

  it("goes critical once the ceiling is already exceeded", async () => {
    mockedGetMeiStatus.mockResolvedValue({
      year: 2026,
      revenueLimit: 81000,
      currentRevenue: 90000,
      usagePercent: 111,
      overLimit: true,
      projectedRevenue: 180000,
      projectedOverLimit: true,
      monthsElapsed: 6,
    });

    const insight = await checkMeiLimit("u1", now);
    expect(insight?.type).toBe("mei_limit_over");
    expect(insight?.severity).toBe("critical");
  });

  it("warns early when only the year-end projection exceeds the ceiling", async () => {
    mockedGetMeiStatus.mockResolvedValue({
      year: 2026,
      revenueLimit: 81000,
      currentRevenue: 30000,
      usagePercent: 37,
      overLimit: false,
      projectedRevenue: 90000,
      projectedOverLimit: true,
      monthsElapsed: 4,
    });

    const insight = await checkMeiLimit("u1", now);
    expect(insight?.type).toBe("mei_limit_projected_over");
    expect(insight?.severity).toBe("warning");
  });
});

describe("checkDasReminder", () => {
  it("stays silent outside the 5-day reminder window", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ dasMonthlyAmount: 75.9 } as never);

    expect(await checkDasReminder("u1", new Date(2026, 6, 1))).toBeNull();
  });

  it("reminds with the configured amount close to the due date", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ dasMonthlyAmount: 75.9 } as never);

    const insight = await checkDasReminder("u1", new Date(2026, 6, 18));
    expect(insight?.type).toBe("das_due_soon");
    expect(insight?.message).toContain("R$");
  });

  it("omits the amount when the user hasn't configured it", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ dasMonthlyAmount: null } as never);

    const insight = await checkDasReminder("u1", new Date(2026, 6, 19));
    expect(insight?.message).not.toContain("R$");
  });

  it("escalates to warning in the final 2 days before the due date", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ dasMonthlyAmount: null } as never);

    const insight = await checkDasReminder("u1", new Date(2026, 6, 19));
    expect(insight?.severity).toBe("warning");
  });
});
