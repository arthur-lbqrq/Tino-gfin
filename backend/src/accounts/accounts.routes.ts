import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { resolvePlan } from "@/billing/plan.middleware";
import { index, create, show, update, remove, balance } from "./accounts.controller";
import { index as invoicesIndex, show as invoiceShow, pay as invoicePay, creditLimit } from "@/invoices/invoice.controller";

export const accountsRoutes = Router();

accountsRoutes.use(authMiddleware);

accountsRoutes.get("/", index);
accountsRoutes.post("/", resolvePlan, create);
accountsRoutes.get("/:id", show);
accountsRoutes.put("/:id", update);
accountsRoutes.delete("/:id", remove);
accountsRoutes.get("/:id/balance", balance);

// Sub-recursos de fatura, só fazem sentido pra contas do tipo cartão de crédito
accountsRoutes.get("/:accountId/invoices", invoicesIndex);
accountsRoutes.get("/:accountId/invoices/:invoiceId", invoiceShow);
accountsRoutes.patch("/:accountId/invoices/:invoiceId/pay", invoicePay);
accountsRoutes.get("/:accountId/credit-limit", creditLimit);
