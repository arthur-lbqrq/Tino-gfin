import { Response } from "express";
import { PlanAwareRequest } from "@/billing/plan.middleware";
import { generateInsights } from "./insight.service";

export async function index(req: PlanAwareRequest, res: Response) {
  try {
    const insights = await generateInsights(req.userId!, req.plan ?? "FREE");
    return res.json(insights);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro interno ao gerar insights." });
  }
}
