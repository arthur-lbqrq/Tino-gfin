import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import { getSummary, getCashflow } from "./dashboard.service";

const summaryQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const cashflowQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional(),
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
    const data = await getCashflow(req.userId!, parsed.data.months);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}
