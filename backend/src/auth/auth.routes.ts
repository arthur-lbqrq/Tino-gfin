import { Router } from "express";
import { authMiddleware } from "./auth.middleware";
import { register, login, deleteMe } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.delete("/me", authMiddleware, deleteMe);
