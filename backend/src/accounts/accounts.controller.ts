import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import {
  listAccounts,
  createAccount,
  findOwnedAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
  AccountError,
} from "./accounts.service";

const accountTypeEnum = z.enum(["CORRENTE", "CARTEIRA", "CARTAO_CREDITO", "POUPANCA"]);

const accountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: accountTypeEnum,
  initialBalance: z.number().default(0),
  creditLimit: z.number().positive().optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
});

const updateAccountSchema = accountSchema.partial().omit({ type: true });

function handleError(error: unknown, res: Response) {
  if (error instanceof AccountError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
}

export async function index(req: AuthenticatedRequest, res: Response) {
  const accounts = await listAccounts(req.userId!);
  return res.json(accounts);
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const parsed = accountSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const account = await createAccount({ userId: req.userId!, ...parsed.data });
    return res.status(201).json(account);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function show(req: AuthenticatedRequest, res: Response) {
  try {
    const account = await findOwnedAccount(req.userId!, req.params.id);
    return res.json(account);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const parsed = updateAccountSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const account = await updateAccount(req.userId!, req.params.id, parsed.data);
    return res.json(account);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    await deleteAccount(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}

export async function balance(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await getAccountBalance(req.userId!, req.params.id);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}
