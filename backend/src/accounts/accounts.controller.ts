import { Request, Response } from "express";
import { z } from "zod";
import { accountsService } from "./accounts.service";
import { AccountError } from "./accounts.errors";

const accountTypeEnum = z.enum(["CORRENTE", "CARTEIRA", "CARTAO_CREDITO", "POUPANCA"]);

const createAccountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: accountTypeEnum,
  initialBalance: z.number().default(0),
  creditLimit: z.number().positive().optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
});

const updateAccountSchema = createAccountSchema.partial().omit({ type: true });

function handleError(res: Response, error: unknown) {
  if (error instanceof AccountError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: "Erro interno do servidor." });
}

export const accountsController = {
  async create(req: Request, res: Response) {
    try {
      const data = createAccountSchema.parse(req.body);
      const account = await accountsService.create({ userId: req.userId!, ...data });
      return res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      return handleError(res, error);
    }
  },

  async list(req: Request, res: Response) {
    try {
      const accounts = await accountsService.listByUser(req.userId!);
      return res.json(accounts);
    } catch (error) {
      return handleError(res, error);
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const account = await accountsService.getById(req.userId!, req.params.id);
      return res.json(account);
    } catch (error) {
      return handleError(res, error);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = updateAccountSchema.parse(req.body);
      const account = await accountsService.update(req.userId!, req.params.id, data);
      return res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      return handleError(res, error);
    }
  },

  async remove(req: Request, res: Response) {
    try {
      await accountsService.delete(req.userId!, req.params.id);
      return res.status(204).send();
    } catch (error) {
      return handleError(res, error);
    }
  },

  async getBalance(req: Request, res: Response) {
    try {
      const balance = await accountsService.getBalance(req.userId!, req.params.id);
      return res.json(balance);
    } catch (error) {
      return handleError(res, error);
    }
  },
};
