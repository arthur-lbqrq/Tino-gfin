import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import {
  acceptSuggestedMatch,
  createImportBatch,
  createTransactionFromItem,
  deleteImportBatch,
  getImportBatch,
  ignoreItem,
  ImportError,
  listImportBatches,
} from "./imports.service";

const createBatchSchema = z.object({
  accountId: z.string().uuid("Conta inválida"),
  fileName: z.string().min(1),
  format: z.enum(["OFX", "CSV"]),
  content: z.string().min(1, "Arquivo vazio"),
});

const confirmItemSchema = z.object({
  categoryId: z.string().uuid("Categoria inválida"),
});

function handleError(error: unknown, res: Response) {
  if (error instanceof ImportError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
}

export async function index(req: AuthenticatedRequest, res: Response) {
  const batches = await listImportBatches(req.userId!);
  return res.json(batches);
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const parsed = createBatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const batch = await createImportBatch({ userId: req.userId!, ...parsed.data });
    return res.status(201).json(batch);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function show(req: AuthenticatedRequest, res: Response) {
  try {
    const batch = await getImportBatch(req.userId!, req.params.id);
    return res.json(batch);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    await deleteImportBatch(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}

export async function acceptMatch(req: AuthenticatedRequest, res: Response) {
  try {
    const item = await acceptSuggestedMatch(req.userId!, req.params.itemId);
    return res.json(item);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function confirmItem(req: AuthenticatedRequest, res: Response) {
  const parsed = confirmItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const item = await createTransactionFromItem(req.userId!, req.params.itemId, parsed.data.categoryId);
    return res.json(item);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function ignore(req: AuthenticatedRequest, res: Response) {
  try {
    const item = await ignoreItem(req.userId!, req.params.itemId);
    return res.json(item);
  } catch (error) {
    return handleError(error, res);
  }
}
