import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { index, create, update, remove } from "./category.controller";

export const categoryRoutes = Router();

categoryRoutes.use(authMiddleware);
categoryRoutes.get("/", index);
categoryRoutes.post("/", create);
categoryRoutes.put("/:id", update);
categoryRoutes.delete("/:id", remove);
