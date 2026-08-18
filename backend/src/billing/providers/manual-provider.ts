import { CheckoutSession, PaymentProvider, WebhookEvent } from "./payment-provider";

// Ativo por padrão até um gateway real (Mercado Pago/Stripe) ser configurado.
// Não processa pagamento nenhum — "checkout" só avisa que ainda não está
// disponível, e não existe webhook de verdade chegando (ver billing.routes.ts).
// Planos pagos nesse modo só saem concedidos manualmente via
// PUT /billing/admin/grant (rota protegida por ADMIN_EMAIL).
export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual";

  async createCheckoutSession(): Promise<CheckoutSession> {
    return {
      url: null,
      providerSessionId: null,
      pending: true,
      message:
        "Pagamento ainda não está disponível. Fale com a gente que liberamos seu plano manualmente enquanto isso.",
    };
  }

  async cancelSubscription(): Promise<void> {
    // nada a cancelar num gateway que nunca cobrou de verdade
  }

  parseWebhookEvent(): WebhookEvent {
    throw new Error("O provedor manual não recebe webhooks — nenhum gateway real está configurado ainda.");
  }
}
