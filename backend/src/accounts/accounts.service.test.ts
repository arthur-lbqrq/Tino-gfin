import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: { count: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { AccountError, createAccount } from "./accounts.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

const baseInput = {
  userId: "u1",
  name: "Carteira",
  type: "CARTEIRA" as const,
  initialBalance: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.account.create.mockResolvedValue({ id: "acc1" } as never);
});

describe("createAccount plan limits", () => {
  it("blocks a second account on the Free plan", async () => {
    mockedPrisma.account.count.mockResolvedValue(1);

    await expect(createAccount({ ...baseInput, plan: "FREE" })).rejects.toThrow(AccountError);
    expect(mockedPrisma.account.create).not.toHaveBeenCalled();
  });

  it("allows the first account on the Free plan", async () => {
    mockedPrisma.account.count.mockResolvedValue(0);

    await createAccount({ ...baseInput, plan: "FREE" });
    expect(mockedPrisma.account.create).toHaveBeenCalled();
  });

  it("never checks the count for unlimited plans", async () => {
    await createAccount({ ...baseInput, plan: "PRO" });

    expect(mockedPrisma.account.count).not.toHaveBeenCalled();
    expect(mockedPrisma.account.create).toHaveBeenCalled();
  });
});
