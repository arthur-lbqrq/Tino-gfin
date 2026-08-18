import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { sendOwnDigest, sendAllDigests } from "./notification.controller";

export const notificationRoutes = Router();

notificationRoutes.use(authMiddleware);

notificationRoutes.post("/digest", sendOwnDigest);
notificationRoutes.post("/digest/all", sendAllDigests);
