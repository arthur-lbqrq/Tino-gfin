import express from "express";
import cors from "cors";
import { env } from "@/config/env";
import { authRoutes } from "@/auth/auth.routes";
import { categoryRoutes } from "@/categories/category.routes";
import { transactionRoutes } from "@/transactions/transaction.routes";
import { dashboardRoutes } from "@/dashboard/dashboard.routes";
import { insightRoutes } from "@/insights/insight.routes";
import { accountsRoutes } from "@/accounts/accounts.routes";
import { recurringTransactionsRoutes } from "@/recurring-transactions/recurring-transactions.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/transactions", transactionRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/insights", insightRoutes);
app.use("/accounts", accountsRoutes);
app.use("/recurring-transactions", recurringTransactionsRoutes);

app.listen(env.port, () => {
  console.log(`🚀 Tino API rodando em http://localhost:${env.port}`);
});
