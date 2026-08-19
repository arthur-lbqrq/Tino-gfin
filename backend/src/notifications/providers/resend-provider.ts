import { Resend } from "resend";
import { env } from "@/config/env";
import { EmailMessage, EmailProvider } from "./email-provider";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  private readonly client: Resend;

  constructor() {
    if (!env.resendApiKey) {
      throw new Error("EMAIL_PROVIDER=resend mas RESEND_API_KEY não está definido.");
    }
    this.client = new Resend(env.resendApiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: env.emailFrom,
      to: message.to,
      subject: message.subject,
      text: message.body,
    });

    if (error) {
      throw new Error(`Falha ao enviar e-mail via Resend: ${error.message}`);
    }
  }
}
