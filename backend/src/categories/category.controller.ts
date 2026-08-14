import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryError,
} from "./category.service";

const categorySchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  type: z.enum(["RECEITA", "DESPESA"]),
});

const updateCategorySchema = categorySchema.partial();

function handleError(error: unknown, res: Response) {
  if (error instanceof CategoryError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
}

export async function index(req: AuthenticatedRequest, res: Response) {
  const categories = await listCategories(req.userId!);
  return res.json(categories);
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const parsed = categorySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const category = await createCategory({ userId: req.userId!, ...parsed.data });
    return res.status(201).json(category);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const parsed = updateCategorySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const category = await updateCategory(req.userId!, req.params.id, parsed.data);
    return res.json(category);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    await deleteCategory(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}
