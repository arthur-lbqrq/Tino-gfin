import { Response } from "express";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import { generateInsights } from "./insight.service";

export async function index(req: AuthenticatedRequest, res: Response) {
  try {
    const insights = await generateInsights(req.userId!);
    return res.json(insights);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro interno ao gerar insights." });
  }
}
