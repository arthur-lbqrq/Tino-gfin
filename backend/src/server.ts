import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { initErrorTracking, errorTrackingHandler } from "@/config/error-tracking";
import { authRoutes } from "@/auth/auth.routes";
import { categoryRoutes } from "@/categories/category.routes";
import { transactionRoutes } from "@/transactions/transaction.routes";
import { dashboardRoutes } from "@/dashboard/dashboard.routes";
import { insightRoutes } from "@/insights/insight.routes";
import { accountsRoutes } from "@/accounts/accounts.routes";
import { recurringTransactionsRoutes } from "@/recurring-transactions/recurring-transactions.routes";
import { budgetRoutes } from "@/budgets/budget.routes";
import { reportsRoutes } from "@/reports/reports.routes";
import { goalsRoutes } from "@/goals/goals.routes";
import { importsRoutes } from "@/imports/imports.routes";
import { meiRoutes } from "@/mei/mei.routes";
import { billingRoutes } from "@/billing/billing.routes";
import { notificationRoutes } from "@/notifications/notification.routes";

initErrorTracking();

const app = express();

// crossOriginResourcePolicy "same-origin" (padrão do helmet) faz o navegador
// bloquear a resposta quando ela vem de outra origem — exatamente o caso do
// frontend (porta 5173/domínio do host estático) chamando a API (porta 3333/
// outro domínio). "cross-origin" mantém os outros headers de segurança e só
// libera isso, que já é controlado pela allowlist do CORS logo abaixo.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.allowedOrigins,
  })
);
// Limite maior que o padrão (100kb) porque extratos OFX/CSV são enviados como
// texto no corpo da requisição e podem passar disso com poucos meses de histórico.
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Login/registro são o alvo óbvio de força bruta — 20 tentativas por IP a
// cada 15 min é folgado pro uso normal e incômodo o suficiente pra um ataque.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente de novo em alguns minutos." },
});

app.use("/auth", authRateLimit, authRoutes);
app.use("/categories", categoryRoutes);
app.use("/transactions", transactionRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/insights", insightRoutes);
app.use("/accounts", accountsRoutes);
app.use("/recurring-transactions", recurringTransactionsRoutes);
app.use("/budgets", budgetRoutes);
app.use("/reports", reportsRoutes);
app.use("/goals", goalsRoutes);
app.use("/imports", importsRoutes);
app.use("/mei", meiRoutes);
app.use("/billing", billingRoutes);
app.use("/notifications", notificationRoutes);

// Precisa vir depois de todas as rotas: captura qualquer erro que escapou de
// um try/catch de controller antes de responder — sem isso, esse tipo de erro
// nem chegava no Sentry.
app.use(errorTrackingHandler);

// Handler final: garante JSON mesmo pro erro que ninguém previu, em vez da
// página HTML de erro padrão do Express.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Erro interno." });
});

app.listen(env.port, () => {
  console.log(`🚀 Faro API rodando em http://localhost:${env.port}`);
});
