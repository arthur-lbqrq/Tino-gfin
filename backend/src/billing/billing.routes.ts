import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { currentPlan, checkout, webhook, grant } from "./billing.controller";

export const billingRoutes = Router();

billingRoutes.use(authMiddleware);

billingRoutes.get("/plan", currentPlan);
billingRoutes.post("/checkout", checkout);
billingRoutes.put("/admin/grant", grant);

// Quando um gateway real for plugado: essa rota precisa do corpo cru (Buffer),
// não do JSON já parseado, pra validar a assinatura do webhook. Nesse ponto,
// registrar express.raw({ type: "application/json" }) só nessa rota, em
// server.ts, antes do express.json() global.
billingRoutes.post("/webhook", webhook);
