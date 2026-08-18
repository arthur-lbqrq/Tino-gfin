import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CheckoutSession, Plan } from "@/lib/types";

interface PlanTier {
  plan: Plan;
  name: string;
  price: string;
  tagline: string;
  features: string[];
}

const TIERS: PlanTier[] = [
  {
    plan: "FREE",
    name: "Free",
    price: "R$ 0",
    tagline: "Pra sentir o motor de insights funcionando.",
    features: [
      "1 conta",
      "Transações ilimitadas",
      "Dashboard completo",
      "2 insights básicos (média histórica e projeção simples)",
    ],
  },
  {
    plan: "PRO",
    name: "Pro",
    price: "R$ 29,90/mês",
    tagline: "O motor de insights inteiro, sem limite de conta.",
    features: [
      "Tudo do Free",
      "Contas ilimitadas",
      "Todos os insights (orçamento, recorrência, MEI, cartão...)",
      "Orçamentos, Metas e Recorrências",
      "Importação de extrato (OFX/CSV) e conciliação",
      "Módulo fiscal MEI",
      "Alerta crítico por e-mail",
    ],
  },
  {
    plan: "BUSINESS",
    name: "Business",
    price: "R$ 69,90/mês",
    tagline: "Pra quem já fecha os números com o contador.",
    features: [
      "Tudo do Pro",
      "DRE simplificado e comparativo de períodos",
      "Exportação de relatórios (PDF/Excel/CSV)",
      "Prioridade quando o multiusuário sair do ar",
    ],
  },
];

export function Planos() {
  const { plan, refreshPlan } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(target: Exclude<Plan, "FREE">) {
    setLoadingPlan(target);
    setMessage(null);
    setError(null);
    try {
      const session = await api.post<CheckoutSession>("/billing/checkout", { plan: target });
      if (session.pending) {
        setMessage(session.message ?? "Pagamento ainda não está disponível.");
      } else if (session.url) {
        window.location.href = session.url;
      }
      await refreshPlan();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao iniciar upgrade.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Planos</h1>
        <p>Free deixa você sentir o valor. Pro libera o motor inteiro. Business fecha a conta pro contador.</p>
      </div>

      {message && (
        <div className="card" style={{ marginBottom: 24, borderLeft: "3px solid var(--primary)" }}>
          <p style={{ margin: 0 }}>{message}</p>
        </div>
      )}
      {error && <p className="error-text" style={{ marginBottom: 24 }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {TIERS.map((tier) => {
          const isCurrent = plan?.plan === tier.plan;

          return (
            <div key={tier.plan} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>{tier.name}</h3>
                {isCurrent && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      padding: "3px 9px",
                      borderRadius: 100,
                      background: "var(--primary-soft)",
                      color: "var(--primary-dark)",
                    }}
                  >
                    Seu plano
                  </span>
                )}
              </div>

              <p className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>{tier.price}</p>
              <p style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 4, marginBottom: 16 }}>{tier.tagline}</p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", flex: 1 }}>
                {tier.features.map((feature) => (
                  <li key={feature} style={{ fontSize: 13.5, padding: "6px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--primary)" }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {tier.plan !== "FREE" && !isCurrent && (
                <button
                  className="btn-primary"
                  onClick={() => handleUpgrade(tier.plan as Exclude<Plan, "FREE">)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === tier.plan ? "Aguarde..." : `Assinar ${tier.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
