import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { index, create, update, remove, removeInstallmentGroup } from "./transaction.controller";

export const transactionRoutes = Router();

transactionRoutes.use(authMiddleware);
transactionRoutes.get("/", index);
transactionRoutes.post("/", create);
transactionRoutes.put("/:id", update);
transactionRoutes.delete("/installments/:groupId", removeInstallmentGroup);
transactionRoutes.delete("/:id", remove);
