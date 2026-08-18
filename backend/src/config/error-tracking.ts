import * as Sentry from "@sentry/node";
import { ErrorRequestHandler } from "express";
import { env } from "./env";

// Sem SENTRY_DSN configurado, Sentry.init() com dsn undefined é um no-op
// documentado do próprio SDK — nada é capturado nem enviado, sem precisar de
// um if espalhado pelo código. Só some do "nada rastreado" quando a chave existir.
export function initErrorTracking() {
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: 0.1,
  });
}

export function captureError(error: unknown) {
  Sentry.captureException(error);
}

export const errorTrackingHandler: ErrorRequestHandler = (err, _req, res, next) => {
  Sentry.captureException(err);
  next(err);
};
