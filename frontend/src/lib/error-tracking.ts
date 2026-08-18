import * as Sentry from "@sentry/react";

// Sem VITE_SENTRY_DSN configurado, Sentry.init() com dsn undefined não envia
// nada — mesmo comportamento no-op do lado do backend, sem if espalhado.
export function initErrorTracking() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}
