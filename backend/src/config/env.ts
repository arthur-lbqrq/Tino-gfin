import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${key}`);
  }
  return value;
}

const PLACEHOLDER_JWT_SECRET = "troque-por-uma-string-aleatoria-longa";

// O header Origin que o navegador manda nunca tem barra no final — sem tirar
// isso aqui, "https://app.com/" configurado por engano no .env nunca bate com
// "https://app.com" e o CORS fica bloqueado silenciosamente (sem erro no boot).
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  // Lista separada por vírgula (ex: "https://app.tino.com,https://tino.com").
  // Sem isso configurado, CORS não libera nenhuma origin em produção — só
  // localhost, pra não subir com a API aberta pra qualquer site por engano.
  // Inclui algumas portas vizinhas porque o Vite sobe na próxima livre quando
  // 5173 está ocupada (outra instância presa, outro projeto etc.) — sem isso,
  // qualquer instância anterior que não morreu direito quebra o CORS de novo.
  allowedOrigins: process.env.FRONTEND_URL?.split(",").map((o) => stripTrailingSlash(o.trim())) ?? [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:4173",
  ],
  // "manual" até um gateway real (mercadopago/stripe) ser plugado.
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "manual",
  // Único e-mail autorizado a conceder plano manualmente (PUT /billing/admin/grant)
  // enquanto não existe um sistema de papéis de admin de verdade.
  adminEmail: process.env.ADMIN_EMAIL,
  // "console" loga em vez de enviar de verdade, até um provedor de e-mail
  // transacional (Resend, SendGrid) ser configurado.
  emailProvider: process.env.EMAIL_PROVIDER ?? "console",
  // Só é lido de verdade quando emailProvider === "resend" (ver resend-provider.ts).
  // Opcional aqui pra não travar o boot em ambientes que ainda usam o provider "console".
  resendApiKey: process.env.RESEND_API_KEY,
  // Remetente usado nos e-mails transacionais. O endereço de sandbox da Resend
  // funciona sem verificar domínio, útil enquanto isso não é configurado.
  emailFrom: process.env.EMAIL_FROM ?? "Tino <onboarding@resend.dev>",
  // Origin único usado pra montar links em e-mail (verificação, reset de senha).
  // Reaproveita o primeiro valor de FRONTEND_URL — allowedOrigins aceita uma lista
  // pro CORS, mas um e-mail só pode apontar pra um lugar.
  frontendUrl: stripTrailingSlash(process.env.FRONTEND_URL?.split(",")[0]?.trim() || "http://localhost:5173"),
  // DSN do Sentry — ausente = rastreio de erro desligado (no-op), não quebra nada.
  sentryDsn: process.env.SENTRY_DSN,
};

// Falha rápido no boot em produção em vez de rodar com um segredo de exemplo
// que está público neste repositório (.env.example) — travar aqui é melhor
// que descobrir depois que qualquer um podia forjar um token válido.
if (env.nodeEnv === "production" && env.jwtSecret === PLACEHOLDER_JWT_SECRET) {
  throw new Error(
    "JWT_SECRET ainda é o valor de exemplo do .env.example — gere um segredo real antes de rodar em produção."
  );
}
