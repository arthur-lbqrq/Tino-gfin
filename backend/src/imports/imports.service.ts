import { ImportFormat } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseOfx } from "./parsers/ofx-parser";
import { parseCsv } from "./parsers/csv-parser";
import { ParsedImportRow } from "./parsers/types";

export class ImportError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

const MATCH_WINDOW_DAYS = 3;

interface CreateImportBatchInput {
  userId: string;
  accountId: string;
  fileName: string;
  format: ImportFormat;
  content: string;
}

async function assertAccountBelongsToUser(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new ImportError("Conta não encontrada.", 404);
  return account;
}

// Procura uma transação já lançada nessa conta com o mesmo valor/tipo dentro de
// uma janela de alguns dias da data importada. Só sugere o vínculo quando há
// exatamente um candidato — ambíguo demais com mais de um, o usuário decide à mão.
// Exclui transações que outra linha importada já vinculou (inclusive nesta mesma
// importação, por isso a checagem roda sequencialmente linha a linha, não em paralelo).
async function findAutoMatch(userId: string, accountId: string, row: ParsedImportRow) {
  const windowStart = new Date(row.date);
  windowStart.setDate(windowStart.getDate() - MATCH_WINDOW_DAYS);
  const windowEnd = new Date(row.date);
  windowEnd.setDate(windowEnd.getDate() + MATCH_WINDOW_DAYS);

  const candidates = await prisma.transaction.findMany({
    where: {
      userId,
      accountId,
      type: row.type,
      amount: row.amount,
      date: { gte: windowStart, lte: windowEnd },
      importedTransactions: { none: {} },
    },
  });

  return candidates.length === 1 ? candidates[0] : null;
}

export async function createImportBatch(input: CreateImportBatchInput) {
  await assertAccountBelongsToUser(input.userId, input.accountId);

  let rows: ParsedImportRow[];
  try {
    rows = input.format === "OFX" ? parseOfx(input.content) : parseCsv(input.content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível ler o arquivo.";
    throw new ImportError(message, 422);
  }

  if (rows.length === 0) {
    throw new ImportError("Nenhuma transação encontrada no arquivo.", 422);
  }

  // Dedup por FITID (OFX): não repete linhas já importadas antes pra essa conta,
  // caso o usuário suba o mesmo extrato (ou um período sobreposto) de novo.
  const externalIds = rows.map((r) => r.externalId).filter((id): id is string => !!id);
  const alreadyImported = externalIds.length
    ? await prisma.importedTransaction.findMany({
        where: { externalId: { in: externalIds }, batch: { accountId: input.accountId } },
        select: { externalId: true },
      })
    : [];
  const seenExternalIds = new Set(alreadyImported.map((i) => i.externalId));
  const newRows = rows.filter((r) => !r.externalId || !seenExternalIds.has(r.externalId));

  if (newRows.length === 0) {
    throw new ImportError("Todas as transações desse arquivo já foram importadas antes.", 422);
  }

  const batch = await prisma.importBatch.create({
    data: {
      userId: input.userId,
      accountId: input.accountId,
      fileName: input.fileName,
      format: input.format,
    },
  });

  for (const row of newRows) {
    const match = await findAutoMatch(input.userId, input.accountId, row);

    await prisma.importedTransaction.create({
      data: {
        batchId: batch.id,
        externalId: row.externalId,
        date: row.date,
        description: row.description,
        amount: row.amount,
        type: row.type,
        status: match ? "SUGERIDO" : "PENDENTE",
        linkedTransactionId: match?.id,
      },
    });
  }

  return getImportBatch(input.userId, batch.id);
}

export async function listImportBatches(userId: string) {
  return prisma.importBatch.findMany({
    where: { userId },
    include: { account: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getImportBatch(userId: string, id: string) {
  const batch = await prisma.importBatch.findFirst({
    where: { id, userId },
    include: {
      account: true,
      items: { include: { linkedTransaction: true }, orderBy: { date: "asc" } },
    },
  });

  if (!batch) throw new ImportError("Importação não encontrada.", 404);
  return batch;
}

export async function deleteImportBatch(userId: string, id: string) {
  const batch = await prisma.importBatch.findFirst({ where: { id, userId } });
  if (!batch) throw new ImportError("Importação não encontrada.", 404);
  await prisma.importBatch.delete({ where: { id: batch.id } });
}

async function findOwnedItem(userId: string, itemId: string) {
  const item = await prisma.importedTransaction.findFirst({
    where: { id: itemId, batch: { userId } },
    include: { batch: true },
  });
  if (!item) throw new ImportError("Item de importação não encontrado.", 404);
  return item;
}

export async function acceptSuggestedMatch(userId: string, itemId: string) {
  const item = await findOwnedItem(userId, itemId);

  if (item.status !== "SUGERIDO" || !item.linkedTransactionId) {
    throw new ImportError("Esse item não tem uma sugestão de vínculo pra confirmar.", 422);
  }

  return prisma.importedTransaction.update({
    where: { id: item.id },
    data: { status: "CONFIRMADO" },
  });
}

export async function createTransactionFromItem(userId: string, itemId: string, categoryId: string) {
  const item = await findOwnedItem(userId, itemId);

  if (item.status === "CONFIRMADO") {
    throw new ImportError("Esse item já foi confirmado.", 422);
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId }, { userId: null }] },
  });
  if (!category) throw new ImportError("Categoria inválida.", 422);
  if (category.type !== item.type) {
    throw new ImportError("O tipo da categoria não bate com o tipo da transação importada.", 422);
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      accountId: item.batch.accountId,
      categoryId,
      type: item.type,
      amount: item.amount,
      description: item.description,
      date: item.date,
    },
  });

  return prisma.importedTransaction.update({
    where: { id: item.id },
    data: { status: "CONFIRMADO", linkedTransactionId: transaction.id },
  });
}

export async function ignoreItem(userId: string, itemId: string) {
  await findOwnedItem(userId, itemId);
  return prisma.importedTransaction.update({ where: { id: itemId }, data: { status: "IGNORADO" } });
}
