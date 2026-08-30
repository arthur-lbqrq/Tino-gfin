import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    insightNotification: { findMany: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("@/insights/insight.service", () => ({
  generateInsights: vi.fn(),
}));

vi.mock("./providers/console-provider", () => ({
  ConsoleEmailProvider: class {
    name = "console";
    send = sendMock;
  },
}));

import { prisma } from "@/lib/prisma";
import { generateInsights } from "@/insights/insight.service";
import { sendCriticalInsightDigest } from "./notification.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });
const mockedGenerateInsights = vi.mocked(generateInsights);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendCriticalInsightDigest", () => {
  it("does nothing for a Free plan user (email is Pro+)", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com", plan: "FREE" } as never);

    const result = await sendCriticalInsightDigest("u1");

    expect(result).toEqual({ sent: false, count: 0 });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("does nothing when there are no critical insights", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com", plan: "PRO" } as never);
    mockedGenerateInsights.mockResolvedValue([{ type: "x", severity: "warning", message: "m", data: {} }]);

    const result = await sendCriticalInsightDigest("u1");

    expect(result.sent).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends a digest with the critical insights and records them", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com", plan: "PRO" } as never);
    mockedGenerateInsights.mockResolvedValue([
      { type: "budget_over_limit", severity: "critical", message: "Estourou", data: {} },
    ]);
    mockedPrisma.insightNotification.findMany.mockResolvedValue([]);

    const result = await sendCriticalInsightDigest("u1");

    expect(result).toEqual({ sent: true, count: 1 });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.com", subject: "Faro: 1 alerta importante" })
    );
    expect(mockedPrisma.insightNotification.upsert).toHaveBeenCalled();
  });

  it("suppresses an insight type already notified within the resend window", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com", plan: "PRO" } as never);
    mockedGenerateInsights.mockResolvedValue([
      { type: "budget_over_limit", severity: "critical", message: "Estourou", data: {} },
    ]);
    mockedPrisma.insightNotification.findMany.mockResolvedValue([{ insightType: "budget_over_limit" }] as never);

    const result = await sendCriticalInsightDigest("u1");

    expect(result).toEqual({ sent: false, count: 0 });
    expect(sendMock).not.toHaveBeenCalled();
  });
});
