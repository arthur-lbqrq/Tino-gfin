import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import {
  createTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  TransactionError,
} from "./transaction.service";

const transactionSchema = z.object({
  categoryId: z.string().uuid("Categoria inválida"),
  type: z.enum(["RECEITA", "DESPESA"]),
  amount: z.number().positive("Valor deve ser maior que zero"),
  description: z.string().optional(),
  date: z.coerce.date(),
});

const updateTransactionSchema = transactionSchema.partial();

const listQuerySchema = z.object({
  type: z.enum(["RECEITA", "DESPESA"]).optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

function handleError(error: unknown, res: Response) {
  if (error instanceof TransactionError) {
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

  const transactions = await listTransactions({ userId: req.userId!, ...parsed.data });
  return res.json(transactions);
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const parsed = transactionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const transaction = await createTransaction({ userId: req.userId!, ...parsed.data });
    return res.status(201).json(transaction);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const parsed = updateTransactionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const transaction = await updateTransaction(req.userId!, req.params.id, parsed.data);
    return res.json(transaction);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    await deleteTransaction(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}
