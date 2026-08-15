import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { index, create, show, update, remove, generatePending } from "./recurring-transactions.controller";

export const recurringTransactionsRoutes = Router();

recurringTransactionsRoutes.use(authMiddleware);
recurringTransactionsRoutes.get("/", index);
recurringTransactionsRoutes.post("/", create);
recurringTransactionsRoutes.get("/:id", show);
recurringTransactionsRoutes.put("/:id", update);
recurringTransactionsRoutes.delete("/:id", remove);
recurringTransactionsRoutes.post("/generate", generatePending);
