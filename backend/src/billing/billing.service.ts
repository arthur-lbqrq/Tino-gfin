import { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { PaymentProvider } from "./providers/payment-provider";
import { ManualPaymentProvider } from "./providers/manual-provider";

export class BillingError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

// Ponto único de troca de gateway: adicionar um MercadoPagoProvider ou
// StripeProvider real aqui quando a conta existir, sem mexer no resto do módulo.
function resolveProvider(): PaymentProvider {
  switch (env.paymentProvider) {
    case "manual":
    default:
      return new ManualPaymentProvider();
  }
}

export const paymentProvider = resolveProvider();

export async function getUserPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planStatus: true, planRenewsAt: true, paymentProvider: true },
  });
  if (!user) throw new BillingError("Usuário não encontrado.", 404);
  return user;
}

export async function startCheckout(userId: string, plan: Exclude<Plan, "FREE">) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new BillingError("Usuário não encontrado.", 404);

  return paymentProvider.createCheckoutSession({ userId, email: user.email, plan });
}

// Concessão manual de plano — usada enquanto não existe gateway real, pra
// liberar early adopters sem cobrar ainda. Chamada só pela rota protegida por
// ADMIN_EMAIL (ver billing.controller.ts).
export async function grantPlanManually(targetUserId: string, plan: Plan) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new BillingError("Usuário não encontrado.", 404);

  return prisma.user.update({
    where: { id: targetUserId },
    data: {
      plan,
      planStatus: "ACTIVE",
      planRenewsAt: null,
      paymentProvider: plan === "FREE" ? null : "manual",
    },
    select: { id: true, email: true, plan: true, planStatus: true },
  });
}

export async function applyWebhookEvent(rawBody: Buffer, signature: string | undefined) {
  const event = paymentProvider.parseWebhookEvent(rawBody, signature);

  const user = await prisma.user.findFirst({ where: { paymentCustomerId: event.paymentCustomerId } });
  if (!user) throw new BillingError("Cliente do gateway de pagamento não corresponde a nenhum usuário.", 404);

  if (event.type === "subscription_activated" && event.plan) {
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: event.plan, planStatus: "ACTIVE", paymentSubscriptionId: event.paymentSubscriptionId },
    });
  } else if (event.type === "subscription_canceled") {
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "FREE", planStatus: "CANCELED" },
    });
  } else if (event.type === "subscription_past_due") {
    await prisma.user.update({ where: { id: user.id }, data: { planStatus: "PAST_DUE" } });
  }
}
