import { Router, Response, NextFunction } from "express";
import { authMiddleware, AuthenticatedRequest } from "@/auth/auth.middleware";
import { generateDueTransactions } from "@/recurring-transactions/recurring-transactions.service";
import { summary, cashflow, categoryBreakdown, dailyExpenses } from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);

// Checagem lazy: toda vez que o usuário abre o dashboard, materializa as
// transações de recorrências ativas que já venceram, antes de calcular os números.
async function syncRecurringTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await generateDueTransactions(req.userId!);
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno ao sincronizar recorrências." });
  }
}

dashboardRoutes.use(syncRecurringTransactions);
dashboardRoutes.get("/summary", summary);
dashboardRoutes.get("/cashflow", cashflow);
dashboardRoutes.get("/category-breakdown", categoryBreakdown);
dashboardRoutes.get("/daily-expenses", dailyExpenses);
