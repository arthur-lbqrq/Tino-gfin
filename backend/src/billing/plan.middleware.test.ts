import { describe, expect, it, vi } from "vitest";
import { requirePlan, PlanAwareRequest } from "./plan.middleware";

function fakeRes() {
  const res: { statusCode?: number; body?: unknown; status: (code: number) => typeof res; json: (body: unknown) => typeof res } = {
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

describe("requirePlan", () => {
  it("calls next() when the plan meets the minimum", () => {
    const req = { plan: "PRO" } as PlanAwareRequest;
    const res = fakeRes();
    const next = vi.fn();

    requirePlan("PRO")(req, res as never, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeUndefined();
  });

  it("responds 402 and blocks the request when the plan is below the minimum", () => {
    const req = { plan: "FREE" } as PlanAwareRequest;
    const res = fakeRes();
    const next = vi.fn();

    requirePlan("PRO")(req, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(402);
    expect(res.body).toMatchObject({ requiredPlan: "PRO", currentPlan: "FREE" });
  });

  it("treats a missing plan as Free (defensive default)", () => {
    const req = {} as PlanAwareRequest;
    const res = fakeRes();
    const next = vi.fn();

    requirePlan("PRO")(req, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(402);
  });
});
