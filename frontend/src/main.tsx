import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { Analytics } from "@vercel/analytics/react";
import { App } from "./App";
import { initErrorTracking } from "./lib/error-tracking";
import "./styles/global.css";

initErrorTracking();

function CrashFallback() {
  return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>Algo deu errado</h1>
      <p>Recarregue a página. Se continuar, já fomos avisados do problema.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<CrashFallback />}>
      <App />
      <Analytics />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
