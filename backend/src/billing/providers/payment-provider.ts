import { Plan } from "@prisma/client";

export interface CheckoutSession {
  url: string | null;
  providerSessionId: string | null;
  // true quando o provedor não processa pagamento de verdade ainda (modo
  // manual) — o frontend usa isso pra mostrar "em breve" em vez de redirecionar.
  pending: boolean;
  message?: string;
}

export interface WebhookEvent {
  type: "subscription_activated" | "subscription_canceled" | "subscription_past_due";
  paymentCustomerId: string;
  paymentSubscriptionId: string;
  plan?: Plan;
}

// Contrato que qualquer gateway real (Mercado Pago, Stripe) implementa.
// Enquanto nenhum estiver plugado, PAYMENT_PROVIDER=manual usa ManualPaymentProvider.
export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(input: { userId: string; email: string; plan: Exclude<Plan, "FREE"> }): Promise<CheckoutSession>;
  cancelSubscription(paymentSubscriptionId: string): Promise<void>;
  parseWebhookEvent(rawBody: Buffer, signature: string | undefined): WebhookEvent;
}
