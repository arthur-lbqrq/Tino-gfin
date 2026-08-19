import { env } from "@/config/env";
import { emailProvider } from "@/notifications/notification.service";

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${env.frontendUrl}/verify-email?token=${token}`;

  await emailProvider.send({
    to: email,
    subject: "Confirme seu e-mail no Tino",
    body: `Confirme seu e-mail clicando no link abaixo:\n\n${link}\n\nSe você não criou uma conta no Tino, pode ignorar este e-mail.`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${env.frontendUrl}/reset-password?token=${token}`;

  await emailProvider.send({
    to: email,
    subject: "Redefinição de senha — Tino",
    body: `Recebemos um pedido pra redefinir sua senha. Clique no link abaixo pra criar uma nova senha:\n\n${link}\n\nSe você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.`,
  });
}
