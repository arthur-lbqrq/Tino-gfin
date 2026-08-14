import { Router } from "express";
import { recurringTransactionsController } from "./recurring-transactions.controller";
import { authMiddleware } from "@/auth/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", recurringTransactionsController.create);
router.get("/", recurringTransactionsController.list);
router.get("/:id", recurringTransactionsController.getOne);
router.put("/:id", recurringTransactionsController.update);
router.delete("/:id", recurringTransactionsController.remove);
router.post("/generate", recurringTransactionsController.generatePending);

export const recurringTransactionsRoutes = router;
