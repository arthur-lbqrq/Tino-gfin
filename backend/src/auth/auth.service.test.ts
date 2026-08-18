import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AuthError, deleteUserAccount } from "./auth.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });
const mockedCompare = vi.mocked(bcrypt.compare);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deleteUserAccount", () => {
  it("throws when the user doesn't exist", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await expect(deleteUserAccount("ghost", "senha123")).rejects.toThrow(AuthError);
    expect(mockedPrisma.user.delete).not.toHaveBeenCalled();
  });

  it("rejects the wrong password without deleting anything", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1", passwordHash: "hash" } as never);
    mockedCompare.mockResolvedValue(false as never);

    await expect(deleteUserAccount("u1", "senhaerrada")).rejects.toThrow("Senha incorreta.");
    expect(mockedPrisma.user.delete).not.toHaveBeenCalled();
  });

  it("deletes the user once the password is confirmed", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "u1", passwordHash: "hash" } as never);
    mockedCompare.mockResolvedValue(true as never);

    await deleteUserAccount("u1", "senhacerta");

    expect(mockedPrisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });
});
