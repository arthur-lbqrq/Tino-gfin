import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import { getSummary, getCashflow, getCategoryBreakdown, getDailyExpenses } from "./dashboard.service";
import { computeCashProjection, listCommitments } from "./projection.service";

const summaryQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  accountId: z.string().uuid().optional(),
});

const cashflowQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional(),
  accountId: z.string().uuid().optional(),
});

const categoryBreakdownQuerySchema = z.object({
  referenceDate: z.coerce.date().optional(),
  accountId: z.string().uuid().optional(),
});

const dailyExpensesQuerySchema = z.object({
  referenceDate: z.coerce.date().optional(),
});

function handleError(error: unknown, res: Response) {
  console.error(error);
  return res.status(500).json({ message: "Erro interno ao carregar dados do dashboard." });
}

export async function summary(req: AuthenticatedRequest, res: Response) {
  const parsed = summaryQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const data = await getSummary({ userId: req.userId!, ...parsed.data });
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function cashflow(req: AuthenticatedRequest, res: Response) {
  const parsed = cashflowQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const data = await getCashflow(req.userId!, parsed.data.months, parsed.data.accountId);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function categoryBreakdown(req: AuthenticatedRequest, res: Response) {
  const parsed = categoryBreakdownQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const data = await getCategoryBreakdown(req.userId!, parsed.data.referenceDate, parsed.data.accountId);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function dailyExpenses(req: AuthenticatedRequest, res: Response) {
  const parsed = dailyExpensesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const data = await getDailyExpenses(req.userId!, parsed.data.referenceDate);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function cashProjection(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await computeCashProjection(req.userId!);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function commitments(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await listCommitments(req.userId!);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}
