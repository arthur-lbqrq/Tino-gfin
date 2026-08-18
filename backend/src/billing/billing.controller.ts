import { Response } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import { BillingError, applyWebhookEvent, getUserPlan, grantPlanManually, startCheckout } from "./billing.service";

const checkoutSchema = z.object({
  plan: z.enum(["PRO", "BUSINESS"]),
});

const grantSchema = z.object({
  targetEmail: z.string().email(),
  plan: z.enum(["FREE", "PRO", "BUSINESS"]),
});

function handleError(error: unknown, res: Response) {
  if (error instanceof BillingError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
}

export async function currentPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await getUserPlan(req.userId!);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function checkout(req: AuthenticatedRequest, res: Response) {
  const parsed = checkoutSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const session = await startCheckout(req.userId!, parsed.data.plan);
    return res.json(session);
  } catch (error) {
    return handleError(error, res);
  }
}

// Sem verificação de assinatura própria de gateway ainda — cada adaptador real
// (Mercado Pago/Stripe) valida a assinatura dentro de parseWebhookEvent antes
// de chegar aqui. Enquanto o provedor é "manual", essa rota nunca é chamada
// por ninguém de fora — não existe webhook de verdade configurado.
export async function webhook(req: AuthenticatedRequest, res: Response) {
  try {
    await applyWebhookEvent(req.body, req.headers["x-webhook-signature"] as string | undefined);
    return res.status(200).json({ received: true });
  } catch (error) {
    return handleError(error, res);
  }
}

// Protegida por ADMIN_EMAIL — não é um sistema de papéis de verdade, é o
// mínimo pra você conceder plano a early adopters enquanto não existe gateway.
export async function grant(req: AuthenticatedRequest, res: Response) {
  const requester = await prisma.user.findUnique({ where: { id: req.userId! } });

  if (!env.adminEmail || requester?.email !== env.adminEmail) {
    return res.status(403).json({ message: "Sem permissão." });
  }

  const parsed = grantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const targetUser = await prisma.user.findUnique({ where: { email: parsed.data.targetEmail } });
  if (!targetUser) {
    return res.status(404).json({ message: "Usuário com esse e-mail não encontrado." });
  }

  try {
    const updated = await grantPlanManually(targetUser.id, parsed.data.plan);
    return res.json(updated);
  } catch (error) {
    return handleError(error, res);
  }
}
