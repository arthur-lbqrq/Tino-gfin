import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { resolvePlan, requirePlan } from "@/billing/plan.middleware";
import { index, create, show, update, remove } from "./goals.controller";

export const goalsRoutes = Router();

goalsRoutes.use(authMiddleware, resolvePlan, requirePlan("PRO"));

goalsRoutes.get("/", index);
goalsRoutes.post("/", create);
goalsRoutes.get("/:id", show);
goalsRoutes.put("/:id", update);
goalsRoutes.delete("/:id", remove);
