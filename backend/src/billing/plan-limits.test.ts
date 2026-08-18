import { describe, expect, it } from "vitest";
import { ACCOUNT_LIMIT_BY_PLAN, FREE_INSIGHT_TYPES, planAtLeast } from "./plan-limits";

describe("planAtLeast", () => {
  it("returns true when the plan meets the minimum", () => {
    expect(planAtLeast("PRO", "PRO")).toBe(true);
    expect(planAtLeast("BUSINESS", "PRO")).toBe(true);
  });

  it("returns false when the plan is below the minimum", () => {
    expect(planAtLeast("FREE", "PRO")).toBe(false);
    expect(planAtLeast("PRO", "BUSINESS")).toBe(false);
  });
});

describe("ACCOUNT_LIMIT_BY_PLAN", () => {
  it("caps Free at 1 account and leaves Pro/Business unlimited", () => {
    expect(ACCOUNT_LIMIT_BY_PLAN.FREE).toBe(1);
    expect(ACCOUNT_LIMIT_BY_PLAN.PRO).toBeNull();
    expect(ACCOUNT_LIMIT_BY_PLAN.BUSINESS).toBeNull();
  });
});

describe("FREE_INSIGHT_TYPES", () => {
  it("only allows the two basic insight types", () => {
    expect(FREE_INSIGHT_TYPES.has("expense_above_average")).toBe(true);
    expect(FREE_INSIGHT_TYPES.has("cashflow_projection")).toBe(true);
    expect(FREE_INSIGHT_TYPES.has("budget_over_limit")).toBe(false);
  });
});
