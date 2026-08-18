import { describe, expect, it } from "vitest";
import { computeInvoicePeriod } from "./invoice.service";

const cardAccount = { closingDay: 20, dueDay: 10 };

describe("computeInvoicePeriod", () => {
  it("throws when the account has no closing/due day configured", () => {
    expect(() => computeInvoicePeriod({ closingDay: null, dueDay: 10 }, new Date(2026, 7, 5), 0)).toThrow();
    expect(() => computeInvoicePeriod({ closingDay: 20, dueDay: null }, new Date(2026, 7, 5), 0)).toThrow();
  });

  it("keeps a purchase before the closing day in the current month's invoice", () => {
    const { referenceMonth, closingDate, dueDate } = computeInvoicePeriod(cardAccount, new Date(2026, 7, 15), 0);
    expect(referenceMonth).toBe("2026-08");
    expect(closingDate).toEqual(new Date(2026, 7, 20));
    // dueDay (10) <= closingDay (20) => vencimento cai no mês seguinte
    expect(dueDate).toEqual(new Date(2026, 8, 10));
  });

  it("pushes a purchase after the closing day into next month's invoice", () => {
    const { referenceMonth, closingDate } = computeInvoicePeriod(cardAccount, new Date(2026, 7, 25), 0);
    expect(referenceMonth).toBe("2026-09");
    expect(closingDate).toEqual(new Date(2026, 8, 20));
  });

  it("puts the due date in the same month as closing when dueDay > closingDay", () => {
    const account = { closingDay: 5, dueDay: 15 };
    const { closingDate, dueDate } = computeInvoicePeriod(account, new Date(2026, 7, 1), 0);
    expect(closingDate).toEqual(new Date(2026, 7, 5));
    expect(dueDate).toEqual(new Date(2026, 7, 15));
  });

  it("advances monthsAhead for installments, rolling over the year", () => {
    const { referenceMonth, closingDate } = computeInvoicePeriod(cardAccount, new Date(2026, 11, 15), 2);
    expect(referenceMonth).toBe("2027-02");
    expect(closingDate).toEqual(new Date(2027, 1, 20));
  });
});
