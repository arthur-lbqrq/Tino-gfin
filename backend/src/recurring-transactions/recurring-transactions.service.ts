import { RecurrenceFrequency, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addInterval } from "@/lib/recurrence";
import { computeCashProjection, listCommitments } from "@/dashboard/projection.service";

export { addInterval } from "@/lib/recurrence";

export class RecurringTransactionError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface CreateRecurringInput {
  userId: string;
  accountId: string;
  categoryId: string;
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate?: Date;
}

interface UpdateRecurringInput {
  description?: string;
  amount?: number;
  frequency?: RecurrenceFrequency;
  endDate?: Date | null;
  active?: boolean;
}

export async function createRecurringTransaction(input: CreateRecurringInput) {
  const account = await prisma.account.findFirst({
    where: { id: input.accountId, userId: input.userId },
  });
  if (!account) throw new RecurringTransactionError("Conta não encontrada.", 404);

  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, OR: [{ userId: input.userId }, { userId: null }] },
  });
  if (!category) throw new RecurringTransactionError("Categoria não encontrada.", 404);

  return prisma.recurringTransaction.create({
    data: {
      userId: input.userId,
      accountId: input.accountId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      type: input.type,
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

export async function listRecurringTransactions(userId: string) {
  return prisma.recurringTransaction.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
  });
}

export async function findOwnedRecurringTransaction(userId: string, id: string) {
  const recurring = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
  if (!recurring) throw new RecurringTransactionError("Recorrência não encontrada.", 404);
  return recurring;
}

export async function updateRecurringTransaction(
  userId: string,
  id: string,
  input: UpdateRecurringInput
) {
  await findOwnedRecurringTransaction(userId, id);

  return prisma.recurringTransaction.update({ where: { id }, data: input });
}

export async function deleteRecurringTransaction(userId: string, id: string) {
  await findOwnedRecurringTransaction(userId, id);
  await prisma.recurringTransaction.delete({ where: { id } });
}

// Gera as transações reais que estão pendentes até hoje, a partir dos modelos
// de recorrência ativos. Disparada lazy (dashboard) e também exposta como
// endpoint manual; no futuro pode virar um job de cron.
export async function generateDueTransactions(userId: string) {
  const today = new Date();

  const recurrences = await prisma.recurringTransaction.findMany({
    where: { userId, active: true, startDate: { lte: today } },
  });

  const created = [];

  for (const recurrence of recurrences) {
    if (recurrence.endDate && recurrence.endDate < today) continue;

    let cursor = recurrence.lastGeneratedAt
      ? addInterval(recurrence.lastGeneratedAt, recurrence.frequency)
      : recurrence.startDate;

    while (cursor <= today) {
      const transaction = await prisma.transaction.create({
        data: {
          userId: recurrence.userId,
          accountId: recurrence.accountId,
          categoryId: recurrence.categoryId,
          description: recurrence.description,
          amount: recurrence.amount,
          type: recurrence.type,
          date: cursor,
          recurringId: recurrence.id,
        },
      });

      created.push(transaction);

      await prisma.recurringTransaction.update({
        where: { id: recurrence.id },
        data: { lastGeneratedAt: cursor },
      });

      cursor = addInterval(cursor, recurrence.frequency);
    }
  }

  return created;
}

// Próxima ocorrência ainda não materializada de uma recorrência (mesmo cursor
// usado em generateDueTransactions, sem persistir nada).
function nextOccurrenceDate(recurrence: { lastGeneratedAt: Date | null; startDate: Date; frequency: RecurrenceFrequency }): Date {
  return recurrence.lastGeneratedAt ? addInterval(recurrence.lastGeneratedAt, recurrence.frequency) : recurrence.startDate;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonthsSameDay(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

// Fórmula de custo de adiar: 2% de mora fixa + 0,033% ao dia sobre o valor
// original, proporcional aos dias de atraso.
function computeDeferralFee(amount: number, daysDeferred: number): number {
  return Math.round(amount * (0.02 + 0.00033 * daysDeferred) * 100) / 100;
}

// Mesma régua usada na prévia (defer-options) e na confirmação (defer): "resolve"
// quando não há mais risco no horizonte de 45 dias, ou quando a folga já é
// confortável (>=30 dias) mesmo que outro compromisso menor ainda apareça depois.
// Ter duas definições diferentes fazia a opção escolhida no modal (verde, "resolve")
// virar "não resolve" na tela de resultado — mesmo número, dois vereditos.
const COMFORTABLE_HORIZON_DAYS = 30;
function resolvesCrisis(daysToNegative: number | null): boolean {
  return daysToNegative === null || daysToNegative >= COMFORTABLE_HORIZON_DAYS;
}

export interface DeferOption {
  label: string;
  newDate: string;
  cost: number;
  projectedDaysToNegative: number | null;
  resolves: boolean;
}

// As 3 datas alternativas do modal de adiar, cada uma já com o resultado
// previsto na projeção (simulação, sem persistir nada).
export async function getDeferOptions(userId: string, id: string) {
  const recurrence = await findOwnedRecurringTransaction(userId, id);
  if (recurrence.type !== "DESPESA") {
    throw new RecurringTransactionError("Só é possível adiar despesas.", 400);
  }

  const originalDate = nextOccurrenceDate(recurrence);
  const originalDateStr = toISODate(originalDate);
  const amount = Number(recurrence.amount);

  const candidates: { label: string; newDate: Date }[] = [
    { label: "+7 dias", newDate: addDays(originalDate, 7) },
    { label: "+14 dias", newDate: addDays(originalDate, 14) },
    { label: "Próximo mês", newDate: addMonthsSameDay(originalDate, 1) },
  ];

  const options: DeferOption[] = [];
  for (const candidate of candidates) {
    const newDateStr = toISODate(candidate.newDate);
    const daysDeferred = Math.round((candidate.newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
    const cost = computeDeferralFee(amount, daysDeferred);

    const projection = await computeCashProjection(userId, new Date(), [
      { recurringId: recurrence.id, originalDate: originalDateStr, newDate: newDateStr, feeAmount: cost },
    ]);

    options.push({
      label: candidate.label,
      newDate: newDateStr,
      cost,
      projectedDaysToNegative: projection.daysToNegative,
      resolves: resolvesCrisis(projection.daysToNegative),
    });
  }

  return {
    commitment: {
      id: recurrence.id,
      description: recurrence.description,
      amount,
      originalDate: originalDateStr,
    },
    options,
  };
}

export interface DeferResult {
  before: { daysToNegative: number | null };
  after: { daysToNegative: number | null };
  resolves: boolean;
  feeAmount: number;
  newDate: string;
  newRootCause: { description: string; amount: number; date: string } | null;
  alternatives: { label: string; note: string }[];
}

// Confirma o adiamento: materializa a transação real na nova data (com a taxa
// já embutida no valor) e avança o cursor da recorrência pra que o gerador
// automático não tente criar a ocorrência original de novo.
export async function deferRecurringTransaction(
  userId: string,
  id: string,
  originalDateStr: string,
  newDateStr: string
): Promise<DeferResult> {
  const recurrence = await findOwnedRecurringTransaction(userId, id);
  if (recurrence.type !== "DESPESA") {
    throw new RecurringTransactionError("Só é possível adiar despesas.", 400);
  }

  const expectedOriginal = toISODate(nextOccurrenceDate(recurrence));
  if (expectedOriginal !== originalDateStr) {
    throw new RecurringTransactionError("Esse compromisso já foi atualizado — recarregue a página.", 409);
  }

  const originalDate = new Date(`${originalDateStr}T00:00:00`);
  const newDate = new Date(`${newDateStr}T00:00:00`);
  const daysDeferred = Math.round((newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDeferred <= 0) {
    throw new RecurringTransactionError("A nova data precisa ser depois da data original.", 400);
  }

  const amount = Number(recurrence.amount);
  const feeAmount = computeDeferralFee(amount, daysDeferred);

  const before = await computeCashProjection(userId);

  await prisma.recurringTransaction.update({
    where: { id: recurrence.id },
    data: { lastGeneratedAt: originalDate },
  });

  await prisma.transaction.create({
    data: {
      userId: recurrence.userId,
      accountId: recurrence.accountId,
      categoryId: recurrence.categoryId,
      description: `${recurrence.description} · adiado de ${formatDateBR(originalDateStr)}`,
      amount: amount + feeAmount,
      type: recurrence.type,
      date: newDate,
      recurringId: recurrence.id,
    },
  });

  const after = await computeCashProjection(userId);
  const resolves = resolvesCrisis(after.daysToNegative);

  let newRootCause: DeferResult["newRootCause"] = null;
  let alternatives: DeferResult["alternatives"] = [];

  if (!resolves) {
    const remaining = await listCommitments(userId);
    const nextCause = remaining.find((c) => c.severity === "critical");
    if (nextCause) {
      newRootCause = { description: nextCause.description, amount: nextCause.amount, date: nextCause.date };
      alternatives = [
        { label: `Dividir ${nextCause.description} em 2x`, note: "reduz o impacto de uma vez só no caixa" },
        { label: "Antecipar recebíveis", note: "custo estimado varia por operadora" },
      ];
    }
  }

  return {
    before: { daysToNegative: before.daysToNegative },
    after: { daysToNegative: after.daysToNegative },
    resolves,
    feeAmount,
    newDate: newDateStr,
    newRootCause,
    alternatives,
  };
}
