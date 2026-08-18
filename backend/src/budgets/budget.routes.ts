import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { resolvePlan, requirePlan } from "@/billing/plan.middleware";
import { index, status, create, show, update, remove } from "./budget.controller";

export const budgetRoutes = Router();

budgetRoutes.use(authMiddleware, resolvePlan, requirePlan("PRO"));

budgetRoutes.get("/", index);
budgetRoutes.get("/status", status);
budgetRoutes.post("/", create);
budgetRoutes.get("/:id", show);
budgetRoutes.put("/:id", update);
budgetRoutes.delete("/:id", remove);
