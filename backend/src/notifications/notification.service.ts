import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { planAtLeast } from "@/billing/plan-limits";
import { generateInsights } from "@/insights/insight.service";
import { EmailProvider } from "./providers/email-provider";
import { ConsoleEmailProvider } from "./providers/console-provider";
import { ResendEmailProvider } from "./providers/resend-provider";

function resolveProvider(): EmailProvider {
  switch (env.emailProvider) {
    case "resend":
      return new ResendEmailProvider();
    case "console":
    default:
      return new ConsoleEmailProvider();
  }
}

export const emailProvider = resolveProvider();

// Não reenvia o mesmo tipo de insight crítico pro mesmo usuário antes desse
// intervalo — evita virar spam quando o alerta continua verdadeiro dia após dia
// (ex: orçamento estourado não muda até o mês virar).
const RESEND_INTERVAL_HOURS = 20;

function formatDigestBody(messages: string[]): string {
  return messages.map((m) => `• ${m}`).join("\n");
}

// Gera os insights do usuário, filtra os críticos ainda não notificados dentro
// da janela de reenvio, e dispara um e-mail único com todos juntos (não um
// por insight). Pensado pra ser chamado por um agendador externo (cron do
// hosting) — não roda automaticamente a cada GET /insights.
export async function sendCriticalInsightDigest(userId: string): Promise<{ sent: boolean; count: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { sent: false, count: 0 };

  if (!planAtLeast(user.plan, "PRO")) {
    return { sent: false, count: 0 }; // notificação por e-mail é recurso Pro+
  }

  const insights = await generateInsights(userId, user.plan);
  const critical = insights.filter((i) => i.severity === "critical");
  if (critical.length === 0) return { sent: false, count: 0 };

  const cutoff = new Date(Date.now() - RESEND_INTERVAL_HOURS * 60 * 60 * 1000);
  const alreadyNotified = await prisma.insightNotification.findMany({
    where: { userId, insightType: { in: critical.map((i) => i.type) }, lastSentAt: { gte: cutoff } },
    select: { insightType: true },
  });
  const suppressed = new Set(alreadyNotified.map((n) => n.insightType));

  const toSend = critical.filter((i) => !suppressed.has(i.type));
  if (toSend.length === 0) return { sent: false, count: 0 };

  await emailProvider.send({
    to: user.email,
    subject: toSend.length === 1 ? "Faro: 1 alerta importante" : `Faro: ${toSend.length} alertas importantes`,
    body: formatDigestBody(toSend.map((i) => i.message)),
  });

  await Promise.all(
    toSend.map((insight) =>
      prisma.insightNotification.upsert({
        where: { userId_insightType: { userId, insightType: insight.type } },
        create: { userId, insightType: insight.type },
        update: { lastSentAt: new Date() },
      })
    )
  );

  return { sent: true, count: toSend.length };
}
