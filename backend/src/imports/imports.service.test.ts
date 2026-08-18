import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: { findFirst: vi.fn() },
    importBatch: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
    importedTransaction: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    transaction: { findMany: vi.fn(), create: vi.fn() },
    category: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  acceptSuggestedMatch,
  createImportBatch,
  createTransactionFromItem,
  ImportError,
} from "./imports.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.account.findFirst.mockResolvedValue({ id: "acc1", userId: "u1" } as never);
  mockedPrisma.importedTransaction.findMany.mockResolvedValue([]);
  mockedPrisma.importBatch.create.mockResolvedValue({ id: "batch1" } as never);
  mockedPrisma.transaction.findMany.mockResolvedValue([]);
  mockedPrisma.importedTransaction.create.mockResolvedValue({} as never);
  mockedPrisma.importBatch.findFirst.mockResolvedValue({
    id: "batch1",
    userId: "u1",
    account: {},
    items: [],
  } as never);
});

describe("createImportBatch", () => {
  it("rejects an account that doesn't belong to the user", async () => {
    mockedPrisma.account.findFirst.mockResolvedValue(null);

    await expect(
      createImportBatch({ userId: "u1", accountId: "acc1", fileName: "extrato.csv", format: "CSV", content: "x" })
    ).rejects.toThrow(ImportError);
  });

  it("rejects a file with no parseable rows", async () => {
    await expect(
      createImportBatch({
        userId: "u1",
        accountId: "acc1",
        fileName: "extrato.csv",
        format: "CSV",
        content: "Data;Valor\ndata-invalida;abc",
      })
    ).rejects.toThrow("Nenhuma transação encontrada");
  });

  it("marks a row as SUGERIDO when exactly one matching transaction already exists", async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([{ id: "t1" }] as never);

    await createImportBatch({
      userId: "u1",
      accountId: "acc1",
      fileName: "extrato.csv",
      format: "CSV",
      content: "Data;Valor;Descrição\n15/08/2026;-150,00;PIX",
    });

    expect(mockedPrisma.importedTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SUGERIDO", linkedTransactionId: "t1" }) })
    );
  });

  it("leaves a row as PENDENTE when there's no unambiguous match", async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([{ id: "t1" }, { id: "t2" }] as never);

    await createImportBatch({
      userId: "u1",
      accountId: "acc1",
      fileName: "extrato.csv",
      format: "CSV",
      content: "Data;Valor;Descrição\n15/08/2026;-150,00;PIX",
    });

    expect(mockedPrisma.importedTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PENDENTE", linkedTransactionId: undefined }) })
    );
  });

  it("skips rows whose FITID was already imported for this account", async () => {
    mockedPrisma.importedTransaction.findMany.mockResolvedValue([{ externalId: "a1" }] as never);

    await expect(
      createImportBatch({
        userId: "u1",
        accountId: "acc1",
        fileName: "extrato.ofx",
        format: "OFX",
        content: `<STMTTRN>\n<DTPOSTED>20260815\n<TRNAMT>-10.00\n<FITID>a1\n<MEMO>Dup\n</STMTTRN>`,
      })
    ).rejects.toThrow("já foram importadas antes");
  });
});

describe("acceptSuggestedMatch", () => {
  it("rejects an item that has no suggested match", async () => {
    mockedPrisma.importedTransaction.findFirst.mockResolvedValue({
      id: "i1",
      status: "PENDENTE",
      linkedTransactionId: null,
      batch: { userId: "u1" },
    } as never);

    await expect(acceptSuggestedMatch("u1", "i1")).rejects.toThrow(ImportError);
  });

  it("confirms an item with a suggested match", async () => {
    mockedPrisma.importedTransaction.findFirst.mockResolvedValue({
      id: "i1",
      status: "SUGERIDO",
      linkedTransactionId: "t1",
      batch: { userId: "u1" },
    } as never);
    mockedPrisma.importedTransaction.update.mockResolvedValue({ id: "i1", status: "CONFIRMADO" } as never);

    const result = await acceptSuggestedMatch("u1", "i1");
    expect(result.status).toBe("CONFIRMADO");
  });
});

describe("createTransactionFromItem", () => {
  it("rejects a category whose type doesn't match the imported row", async () => {
    mockedPrisma.importedTransaction.findFirst.mockResolvedValue({
      id: "i1",
      status: "PENDENTE",
      type: "DESPESA",
      amount: 100,
      description: "Compra",
      date: new Date(2026, 7, 15),
      batch: { userId: "u1", accountId: "acc1" },
    } as never);
    mockedPrisma.category.findFirst.mockResolvedValue({ id: "c1", type: "RECEITA" } as never);

    await expect(createTransactionFromItem("u1", "i1", "c1")).rejects.toThrow(
      "não bate com o tipo"
    );
  });

  it("creates a real transaction and links it back to the imported item", async () => {
    mockedPrisma.importedTransaction.findFirst.mockResolvedValue({
      id: "i1",
      status: "PENDENTE",
      type: "DESPESA",
      amount: 100,
      description: "Compra",
      date: new Date(2026, 7, 15),
      batch: { userId: "u1", accountId: "acc1" },
    } as never);
    mockedPrisma.category.findFirst.mockResolvedValue({ id: "c1", type: "DESPESA" } as never);
    mockedPrisma.transaction.create.mockResolvedValue({ id: "t1" } as never);
    mockedPrisma.importedTransaction.update.mockResolvedValue({ id: "i1", status: "CONFIRMADO" } as never);

    await createTransactionFromItem("u1", "i1", "c1");

    expect(mockedPrisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accountId: "acc1", categoryId: "c1" }) })
    );
    expect(mockedPrisma.importedTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "CONFIRMADO", linkedTransactionId: "t1" }) })
    );
  });
});
