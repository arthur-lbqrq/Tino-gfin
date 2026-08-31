import { prisma } from "@/lib/prisma";
import { addInterval } from "@/lib/recurrence";
import { DAS_DUE_DAY } from "@/mei/mei.service";

const HORIZON_DAYS = 45;
const COMMITMENTS_HORIZON_DAYS = 30;
const HISTORY_DAYS = 90;

export interface Occurrence {
  recurringId: string;
  date: Date;
  amount: number;
  type: "RECEITA" | "DESPESA";
  description: string;
}

export interface CashProjectionPoint {
  date: string;
  balance: number;
}

export interface CashProjection {
  saldoAtual: number;
  series: CashProjectionPoint[];
  zeroCrossingIndex: number | null;
  daysToNegative: number | null;
  negativeDate: string | null;
  troughBalance: number;
  confidence: number;
}

export interface Commitment {
  id: string;
  recurringId: string | null;
  date: string;
  description: string;
  amount: number;
  type: "RECEITA" | "DESPESA";
  deferrable: boolean;
  causeNote: string | null;
  severity: "critical" | "warning" | "normal";
}

function toNumber(value: unknown): number {
  return value ? Number(value) : 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

async function getSaldoAtual(userId: string, now: Date): Promise<number> {
  const [receitas, despesas] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "RECEITA", date: { lte: now } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "DESPESA", date: { lte: now } },
      _sum: { amount: true },
    }),
  ]);
  return toNumber(receitas._sum.amount) - toNumber(despesas._sum.amount);
}

// Ocorrências futuras (ainda não materializadas em Transaction) de recorrências
// ativas dentro de [from, to] — mesma lógica de avanço de cursor usada em
// generateDueTransactions, sem persistir nada. Fonte de verdade única, reaproveitada
// pela projeção de caixa e pela lista de compromissos fixos.
export async function listUpcomingOccurrences(userId: string, from: Date, to: Date): Promise<Occurrence[]> {
  const recurrences = await prisma.recurringTransaction.findMany({
    where: { userId, active: true, startDate: { lte: to } },
  });

  const occurrences: Occurrence[] = [];

  for (const recurrence of recurrences) {
    if (recurrence.endDate && recurrence.endDate < from) continue;

    let cursor = recurrence.lastGeneratedAt
      ? addInterval(recurrence.lastGeneratedAt, recurrence.frequency)
      : recurrence.startDate;

    while (cursor <= to) {
      if (cursor >= from && (!recurrence.endDate || cursor <= recurrence.endDate)) {
        occurrences.push({
          recurringId: recurrence.id,
          date: new Date(cursor),
          amount: Number(recurrence.amount),
          type: recurrence.type,
          description: recurrence.description,
        });
      }
      cursor = addInterval(cursor, recurrence.frequency);
    }
  }

  return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export interface OccurrenceOverride {
  recurringId: string;
  originalDate: string;
  newDate: string;
  feeAmount: number;
}

// Aplica um deslocamento hipotético de data (ex: "e se esse boleto fosse pago
// depois?") sem tocar no banco — usado pra simular as opções do fluxo de adiar
// antes do usuário confirmar.
function applyOverrides(occurrences: Occurrence[], overrides: OccurrenceOverride[]): Occurrence[] {
  if (overrides.length === 0) return occurrences;

  return occurrences.map((o) => {
    const isoDate = toISODate(o.date);
    const override = overrides.find((ov) => ov.recurringId === o.recurringId && ov.originalDate === isoDate);
    if (!override) return o;
    return { ...o, date: new Date(`${override.newDate}T00:00:00`), amount: o.amount + override.feeAmount };
  });
}

// Projeção diária de saldo pros próximos 45 dias: combina ocorrências certas
// (recorrências já agendadas) com uma taxa diária estimada a partir do padrão
// histórico de transações variáveis (sem recurringId, últimos 90 dias).
// `overrides` permite simular "e se essa ocorrência fosse adiada" sem persistir nada.
export async function computeCashProjection(
  userId: string,
  now = new Date(),
  overrides: OccurrenceOverride[] = []
): Promise<CashProjection> {
  const horizonEnd = new Date(now);
  horizonEnd.setDate(horizonEnd.getDate() + HORIZON_DAYS);

  const historyStart = new Date(now);
  historyStart.setDate(historyStart.getDate() - HISTORY_DAYS);

  const [saldoAtual, rawOccurrences, receitasVariaveis, despesasVariaveis, historyTxCount] = await Promise.all([
    getSaldoAtual(userId, now),
    listUpcomingOccurrences(userId, now, horizonEnd),
    prisma.transaction
      .aggregate({
        where: { userId, type: "RECEITA", recurringId: null, date: { gte: historyStart, lte: now } },
        _sum: { amount: true },
      })
      .then((r) => toNumber(r._sum.amount)),
    prisma.transaction
      .aggregate({
        where: { userId, type: "DESPESA", recurringId: null, date: { gte: historyStart, lte: now } },
        _sum: { amount: true },
      })
      .then((r) => toNumber(r._sum.amount)),
    prisma.transaction.count({ where: { userId, date: { gte: historyStart, lte: now } } }),
  ]);

  const occurrences = applyOverrides(rawOccurrences, overrides);
  const dailyRate = (receitasVariaveis - despesasVariaveis) / HISTORY_DAYS;

  const series: CashProjectionPoint[] = [];
  let balance = saldoAtual;
  let trough = saldoAtual;
  let zeroCrossingIndex: number | null = null;

  for (let day = 0; day <= HORIZON_DAYS; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);

    if (day > 0) {
      const dayNet = occurrences
        .filter((o) => isSameDay(o.date, date))
        .reduce((sum, o) => sum + (o.type === "RECEITA" ? o.amount : -o.amount), 0);
      balance = balance + dayNet + dailyRate;
    }

    series.push({ date: toISODate(date), balance: round2(balance) });
    if (balance < trough) trough = balance;
    if (zeroCrossingIndex === null && balance < 0) zeroCrossingIndex = day;
  }

  // Heurística simples de confiança: mais histórico de lançamentos = mais confiança.
  // Não é um modelo estatístico — só um sinal visual de o quanto a projeção se apoia
  // em dado real vs. estimativa.
  const confidence = Math.max(40, Math.min(95, 50 + Math.min(35, historyTxCount)));

  return {
    saldoAtual: round2(saldoAtual),
    series,
    zeroCrossingIndex,
    daysToNegative: zeroCrossingIndex,
    negativeDate: zeroCrossingIndex !== null ? series[zeroCrossingIndex].date : null,
    troughBalance: round2(trough),
    confidence,
  };
}

function nextDasDueDate(now: Date): Date {
  const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), DAS_DUE_DAY);
  if (dueThisMonth >= now) return dueThisMonth;
  return new Date(now.getFullYear(), now.getMonth() + 1, DAS_DUE_DAY);
}

function competenciaLabel(dueDate: Date): string {
  const competencia = new Date(dueDate.getFullYear(), dueDate.getMonth() - 1, 1);
  return `${String(competencia.getMonth() + 1).padStart(2, "0")}/${competencia.getFullYear()}`;
}

// Compromissos fixos dos próximos 30 dias: ocorrências de recorrências ativas
// (sempre adiáveis, hoje) + a guia DAS sintética (nunca adiável — obrigação legal).
// O item que cai bem no dia em que a projeção cruza zero ganha uma nota de causa.
export async function listCommitments(userId: string, now = new Date()): Promise<Commitment[]> {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + COMMITMENTS_HORIZON_DAYS);

  const [occurrences, projection, user] = await Promise.all([
    listUpcomingOccurrences(userId, now, horizon),
    computeCashProjection(userId, now),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  const commitments: Commitment[] = occurrences
    .filter((o) => o.type === "DESPESA")
    .map((o) => {
      const date = toISODate(o.date);
      const isCause = projection.negativeDate !== null && date === projection.negativeDate;
      return {
        id: `${o.recurringId}:${date}`,
        recurringId: o.recurringId,
        date,
        description: o.description,
        amount: o.amount,
        type: o.type,
        deferrable: true,
        causeNote: isCause ? `empurra o negativo para ${formatDateBR(projection.negativeDate!)}` : null,
        severity: isCause ? "critical" : "normal",
      };
    });

  if (user?.dasMonthlyAmount) {
    const dasDate = nextDasDueDate(now);
    if (dasDate <= horizon) {
      commitments.push({
        id: `das:${toISODate(dasDate)}`,
        recurringId: null,
        date: toISODate(dasDate),
        description: `DAS MEI · competência ${competenciaLabel(dasDate)}`,
        amount: Number(user.dasMonthlyAmount),
        type: "DESPESA",
        deferrable: false,
        causeNote: "obrigação legal — não adiável",
        severity: "normal",
      });
    }
  }

  return commitments.sort((a, b) => a.date.localeCompare(b.date));
}

function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}
