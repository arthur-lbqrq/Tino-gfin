import { NextFunction, Response } from "express";
import { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import { planAtLeast, PLAN_LABELS } from "./plan-limits";

export interface PlanAwareRequest extends AuthenticatedRequest {
  plan?: Plan;
}

// Roda depois de authMiddleware. Busca o plano direto no banco (não no token)
// porque um upgrade precisa valer na hora, sem esperar o usuário deslogar e
// logar de novo — mesmo raciocínio do resolveCompany desenhado pra multiempresa.
export async function resolvePlan(req: PlanAwareRequest, res: Response, next: NextFunction) {
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { plan: true } });
  req.plan = user?.plan ?? "FREE";
  next();
}

export function requirePlan(minimum: Exclude<Plan, "FREE">) {
  return (req: PlanAwareRequest, res: Response, next: NextFunction) => {
    const plan = req.plan ?? "FREE";

    if (!planAtLeast(plan, minimum)) {
      return res.status(402).json({
        message: `Esse recurso exige o plano ${PLAN_LABELS[minimum]} ou superior.`,
        requiredPlan: minimum,
        currentPlan: plan,
      });
    }

    return next();
  };
}
