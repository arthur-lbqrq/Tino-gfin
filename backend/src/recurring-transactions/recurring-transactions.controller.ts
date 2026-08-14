import { Request, Response } from "express";
import { z } from "zod";
import { recurringTransactionsService } from "./recurring-transactions.service";
import { RecurringTransactionError } from "./recurring-transactions.errors";

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

function handleError(res: Response, error: unknown) {
  if (error instanceof RecurringTransactionError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: "Erro interno do servidor." });
}

export const recurringTransactionsController = {
  async create(req: Request, res: Response) {
    try {
      const data = createRecurringSchema.parse(req.body);
      const recurring = await recurringTransactionsService.create({ userId: req.userId!, ...data });
      return res.status(201).json(recurring);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      return handleError(res, error);
    }
  },

  async list(req: Request, res: Response) {
    try {
      const recurrences = await recurringTransactionsService.listByUser(req.userId!);
      return res.json(recurrences);
    } catch (error) {
      return handleError(res, error);
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const recurring = await recurringTransactionsService.getById(req.userId!, req.params.id);
      return res.json(recurring);
    } catch (error) {
      return handleError(res, error);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = updateRecurringSchema.parse(req.body);
      const recurring = await recurringTransactionsService.update(req.userId!, req.params.id, data);
      return res.json(recurring);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      return handleError(res, error);
    }
  },

  async remove(req: Request, res: Response) {
    try {
      await recurringTransactionsService.delete(req.userId!, req.params.id);
      return res.status(204).send();
    } catch (error) {
      return handleError(res, error);
    }
  },

  // Endpoint manual pro MVP: gera as transações pendentes até hoje.
  // No futuro isso vira um job de cron e deixa de precisar ser chamado daqui.
  async generatePending(req: Request, res: Response) {
    try {
      const created = await recurringTransactionsService.generatePending(req.userId!);
      return res.status(201).json({ generated: created.length, transactions: created });
    } catch (error) {
      return handleError(res, error);
    }
  },
};
