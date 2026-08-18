import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { resolvePlan, requirePlan } from "@/billing/plan.middleware";
import { status, showSettings, updateSettings, annualReportPdf } from "./mei.controller";

export const meiRoutes = Router();

meiRoutes.use(authMiddleware, resolvePlan, requirePlan("PRO"));

meiRoutes.get("/status", status);
meiRoutes.get("/settings", showSettings);
meiRoutes.put("/settings", updateSettings);
meiRoutes.get("/annual-report.pdf", annualReportPdf);
