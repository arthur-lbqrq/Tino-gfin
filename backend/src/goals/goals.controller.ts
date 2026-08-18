import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import {
  createGoal,
  deleteGoal,
  findOwnedGoal,
  GoalError,
  listGoalsWithProgress,
  updateGoal,
} from "./goals.service";

const createGoalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  targetAmount: z.number().positive("Valor da meta deve ser maior que zero"),
  targetDate: z.coerce.date().optional(),
  accountId: z.string().uuid("Conta inválida"),
});

const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  targetAmount: z.number().positive().optional(),
  targetDate: z.coerce.date().nullable().optional(),
});

function handleError(error: unknown, res: Response) {
  if (error instanceof GoalError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
}

export async function index(req: AuthenticatedRequest, res: Response) {
  const goals = await listGoalsWithProgress(req.userId!);
  return res.json(goals);
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const parsed = createGoalSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const goal = await createGoal({ userId: req.userId!, ...parsed.data });
    return res.status(201).json(goal);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function show(req: AuthenticatedRequest, res: Response) {
  try {
    const goal = await findOwnedGoal(req.userId!, req.params.id);
    return res.json(goal);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const parsed = updateGoalSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const goal = await updateGoal(req.userId!, req.params.id, parsed.data);
    return res.json(goal);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    await deleteGoal(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}
