import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { resolvePlan, requirePlan } from "@/billing/plan.middleware";
import { index, create, show, remove, acceptMatch, confirmItem, ignore } from "./imports.controller";

export const importsRoutes = Router();

importsRoutes.use(authMiddleware, resolvePlan, requirePlan("PRO"));

importsRoutes.get("/", index);
importsRoutes.post("/", create);
importsRoutes.get("/:id", show);
importsRoutes.delete("/:id", remove);
importsRoutes.post("/items/:itemId/accept-match", acceptMatch);
importsRoutes.post("/items/:itemId/confirm", confirmItem);
importsRoutes.post("/items/:itemId/ignore", ignore);
