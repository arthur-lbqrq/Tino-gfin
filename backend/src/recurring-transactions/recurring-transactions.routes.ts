import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { resolvePlan, requirePlan } from "@/billing/plan.middleware";
import { index, create, show, update, remove, generatePending, deferOptions, defer } from "./recurring-transactions.controller";

export const recurringTransactionsRoutes = Router();

recurringTransactionsRoutes.use(authMiddleware, resolvePlan, requirePlan("PRO"));
recurringTransactionsRoutes.get("/", index);
recurringTransactionsRoutes.post("/", create);
recurringTransactionsRoutes.get("/:id", show);
recurringTransactionsRoutes.put("/:id", update);
recurringTransactionsRoutes.delete("/:id", remove);
recurringTransactionsRoutes.post("/generate", generatePending);
recurringTransactionsRoutes.get("/:id/defer-options", deferOptions);
recurringTransactionsRoutes.post("/:id/defer", defer);
