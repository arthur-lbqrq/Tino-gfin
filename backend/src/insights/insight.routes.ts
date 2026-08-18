import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { resolvePlan } from "@/billing/plan.middleware";
import { index } from "./insight.controller";

export const insightRoutes = Router();

insightRoutes.use(authMiddleware, resolvePlan);
insightRoutes.get("/", index);
