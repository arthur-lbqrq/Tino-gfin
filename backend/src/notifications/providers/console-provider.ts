import { EmailMessage, EmailProvider } from "./email-provider";

// Ativo por padrão até um provedor transacional (Resend, SendGrid) ser
// configurado — loga em vez de enviar de verdade, pra não perder silenciosamente
// os disparos enquanto ninguém percebe que nenhum e-mail está saindo.
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:console] para ${message.to} — ${message.subject}\n${message.body}`);
  }
}
