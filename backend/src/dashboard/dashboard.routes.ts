import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { summary, cashflow } from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);
dashboardRoutes.get("/summary", summary);
dashboardRoutes.get("/cashflow", cashflow);
