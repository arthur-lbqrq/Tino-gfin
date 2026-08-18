import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { resolvePlan, requirePlan } from "@/billing/plan.middleware";
import { comparison, dre, drePdf, dreXlsx, exportCsv, exportPdf, exportXlsx } from "./reports.controller";

export const reportsRoutes = Router();

reportsRoutes.use(authMiddleware, resolvePlan, requirePlan("BUSINESS"));

reportsRoutes.get("/transactions.csv", exportCsv);
reportsRoutes.get("/transactions.pdf", exportPdf);
reportsRoutes.get("/transactions.xlsx", exportXlsx);
reportsRoutes.get("/dre", dre);
reportsRoutes.get("/dre.pdf", drePdf);
reportsRoutes.get("/dre.xlsx", dreXlsx);
reportsRoutes.get("/comparison", comparison);
