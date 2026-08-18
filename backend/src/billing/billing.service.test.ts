import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { applyWebhookEvent, BillingError, getUserPlan, grantPlanManually, startCheckout } from "./billing.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserPlan", () => {
  it("throws when the user doesn't exist", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    await expect(getUserPlan("u1")).rejects.toThrow(BillingError);
  });

  it("returns the current plan fields", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      plan: "PRO",
      planStatus: "ACTIVE",
      planRenewsAt: null,
      paymentProvider: "manual",
    } as never);

    const status = await getUserPlan("u1");
    expect(status.plan).toBe("PRO");
  });
});

describe("startCheckout (manual provider)", () => {
  it("returns a pending session instead of a real checkout URL", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com" } as never);

    const session = await startCheckout("u1", "PRO");

    expect(session.pending).toBe(true);
    expect(session.url).toBeNull();
  });

  it("throws when the user doesn't exist", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    await expect(startCheckout("ghost", "PRO")).rejects.toThrow(BillingError);
  });
});

describe("grantPlanManually", () => {
  it("throws when the target user doesn't exist", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    await expect(grantPlanManually("ghost", "PRO")).rejects.toThrow(BillingError);
  });

  it("sets paymentProvider to manual for a paid plan", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1" } as never);
    mockedPrisma.user.update.mockResolvedValue({ id: "u1", plan: "PRO" } as never);

    await grantPlanManually("u1", "PRO");

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ plan: "PRO", paymentProvider: "manual" }) })
    );
  });

  it("clears paymentProvider when downgrading back to Free", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1" } as never);
    mockedPrisma.user.update.mockResolvedValue({ id: "u1", plan: "FREE" } as never);

    await grantPlanManually("u1", "FREE");

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ plan: "FREE", paymentProvider: null }) })
    );
  });
});

describe("applyWebhookEvent (manual provider)", () => {
  it("throws because the manual provider never receives real webhooks", async () => {
    await expect(applyWebhookEvent(Buffer.from("{}"), undefined)).rejects.toThrow();
  });
});
