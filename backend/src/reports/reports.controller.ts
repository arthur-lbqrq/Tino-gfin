import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import {
  buildDrePdf,
  buildDreXlsx,
  buildTransactionsCsv,
  buildTransactionsPdf,
  buildTransactionsXlsx,
  getTransactionsForReport,
} from "./reports.service";
import { getDRE, getPeriodComparison, PeriodInput } from "./dre.service";

const reportQuerySchema = z.object({
  type: z.enum(["RECEITA", "DESPESA"]).optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const dreQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const comparisonQuerySchema = z.object({
  mode: z.enum(["month", "year"]).default("month"),
  count: z.coerce.number().int().min(2).max(24).default(6),
});

function lastMonths(count: number): PeriodInput[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const offset = count - 1 - i;
    const reference = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const startDate = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const endDate = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = startDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
    return { label, startDate, endDate };
  });
}

function lastYears(count: number): PeriodInput[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => {
    const year = currentYear - (count - 1 - i);
    return { label: String(year), startDate: new Date(year, 0, 1), endDate: new Date(year, 11, 31, 23, 59, 59, 999) };
  });
}

function periodLabel(startDate?: Date, endDate?: Date): string {
  if (!startDate && !endDate) return "Todo o período";
  const start = startDate ? startDate.toLocaleDateString("pt-BR") : "início";
  const end = endDate ? endDate.toLocaleDateString("pt-BR") : "hoje";
  return `Período: ${start} a ${end}`;
}

export async function exportCsv(req: AuthenticatedRequest, res: Response) {
  const parsed = reportQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const transactions = await getTransactionsForReport({ userId: req.userId!, ...parsed.data });
  const csv = buildTransactionsCsv(transactions);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="tino-transacoes.csv"');
  return res.send(csv);
}

export async function exportPdf(req: AuthenticatedRequest, res: Response) {
  const parsed = reportQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const transactions = await getTransactionsForReport({ userId: req.userId!, ...parsed.data });
  const pdf = await buildTransactionsPdf(
    transactions,
    periodLabel(parsed.data.startDate, parsed.data.endDate)
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="tino-transacoes.pdf"');
  return res.send(pdf);
}

export async function exportXlsx(req: AuthenticatedRequest, res: Response) {
  const parsed = reportQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const transactions = await getTransactionsForReport({ userId: req.userId!, ...parsed.data });
  const xlsx = await buildTransactionsXlsx(transactions);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="tino-transacoes.xlsx"');
  return res.send(xlsx);
}

export async function dre(req: AuthenticatedRequest, res: Response) {
  const parsed = dreQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const report = await getDRE(req.userId!, parsed.data.startDate, parsed.data.endDate);
  return res.json(report);
}

export async function drePdf(req: AuthenticatedRequest, res: Response) {
  const parsed = dreQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const report = await getDRE(req.userId!, parsed.data.startDate, parsed.data.endDate);
  const pdf = await buildDrePdf(report);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="tino-dre.pdf"');
  return res.send(pdf);
}

export async function dreXlsx(req: AuthenticatedRequest, res: Response) {
  const parsed = dreQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const report = await getDRE(req.userId!, parsed.data.startDate, parsed.data.endDate);
  const xlsx = await buildDreXlsx(report);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="tino-dre.xlsx"');
  return res.send(xlsx);
}

export async function comparison(req: AuthenticatedRequest, res: Response) {
  const parsed = comparisonQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const periods = parsed.data.mode === "year" ? lastYears(parsed.data.count) : lastMonths(parsed.data.count);
  const data = await getPeriodComparison(req.userId!, periods);
  return res.json(data);
}
