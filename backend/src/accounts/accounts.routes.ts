import { Router } from "express";
import { accountsController } from "./accounts.controller";
import { authMiddleware } from "@/auth/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", accountsController.create);
router.get("/", accountsController.list);
router.get("/:id", accountsController.getOne);
router.get("/:id/balance", accountsController.getBalance);
router.put("/:id", accountsController.update);
router.delete("/:id", accountsController.remove);

export const accountsRoutes = router;
