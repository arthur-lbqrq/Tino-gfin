import { Router } from "express";
import { authMiddleware } from "./auth.middleware";
import {
  register,
  login,
  deleteMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.delete("/me", authMiddleware, deleteMe);

authRoutes.post("/verify-email", verifyEmail);
authRoutes.post("/resend-verification", resendVerification);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password", resetPassword);
