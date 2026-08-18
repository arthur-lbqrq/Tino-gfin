import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import {
  createBudget,
  listBudgets,
  findOwnedBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
  BudgetError,
} from "./budget.service";

const referenceMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido, use o formato AAAA-MM");

const createBudgetSchema = z.object({
  categoryId: z.string().uuid("Categoria inválida"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  referenceMonth: referenceMonthSchema,
});

const updateBudgetSchema = z.object({
  amount: z.number().positive("Valor deve ser maior que zero"),
});

const listQuerySchema = z.object({
  month: referenceMonthSchema.optional(),
});

const statusQuerySchema = z.object({
  month: referenceMonthSchema,
});

function handleError(error: unknown, res: Response) {
  if (error instanceof BudgetError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
}

export async function index(req: AuthenticatedRequest, res: Response) {
  const parsed = listQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const budgets = await listBudgets(req.userId!, parsed.data.month);
  return res.json(budgets);
}

export async function status(req: AuthenticatedRequest, res: Response) {
  const parsed = statusQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const data = await getBudgetStatus(req.userId!, parsed.data.month);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const parsed = createBudgetSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const budget = await createBudget({ userId: req.userId!, ...parsed.data });
    return res.status(201).json(budget);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function show(req: AuthenticatedRequest, res: Response) {
  try {
    const budget = await findOwnedBudget(req.userId!, req.params.id);
    return res.json(budget);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const parsed = updateBudgetSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const budget = await updateBudget(req.userId!, req.params.id, parsed.data);
    return res.json(budget);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    await deleteBudget(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}
