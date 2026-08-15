import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import {
  createRecurringTransaction,
  listRecurringTransactions,
  findOwnedRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  generatePendingRecurringTransactions,
  RecurringTransactionError,
} from "./recurring-transactions.service";

const transactionTypeEnum = z.enum(["RECEITA", "DESPESA"]);
const frequencyEnum = z.enum(["DIARIA", "SEMANAL", "MENSAL", "ANUAL"]);

const createRecurringSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  type: transactionTypeEnum,
  frequency: frequencyEnum,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

const updateRecurringSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  frequency: frequencyEnum.optional(),
  endDate: z.coerce.date().nullable().optional(),
  active: z.boolean().optional(),
});

function handleError(error: unknown, res: Response) {
  if (error instanceof RecurringTransactionError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
}

export async function index(req: AuthenticatedRequest, res: Response) {
  const recurrences = await listRecurringTransactions(req.userId!);
  return res.json(recurrences);
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const parsed = createRecurringSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const recurring = await createRecurringTransaction({ userId: req.userId!, ...parsed.data });
    return res.status(201).json(recurring);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function show(req: AuthenticatedRequest, res: Response) {
  try {
    const recurring = await findOwnedRecurringTransaction(req.userId!, req.params.id);
    return res.json(recurring);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const parsed = updateRecurringSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const recurring = await updateRecurringTransaction(req.userId!, req.params.id, parsed.data);
    return res.json(recurring);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    await deleteRecurringTransaction(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}

// Endpoint manual pro MVP: gera as transações pendentes até hoje.
export async function generatePending(req: AuthenticatedRequest, res: Response) {
  try {
    const created = await generatePendingRecurringTransactions(req.userId!);
    return res.status(201).json({ generated: created.length, transactions: created });
  } catch (error) {
    return handleError(error, res);
  }
}
