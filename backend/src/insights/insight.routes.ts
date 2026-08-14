import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { index } from "./insight.controller";

export const insightRoutes = Router();

insightRoutes.use(authMiddleware);
insightRoutes.get("/", index);
