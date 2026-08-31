import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Plan } from "@/lib/types";

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

const PLAN_RANK: Record<Plan, number> = { FREE: 0, PRO: 1, BUSINESS: 2 };

export function Planos() {
  const { plan, refreshPlan } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSwitchPlan(target: Plan) {
    setLoadingPlan(target);
    setMessage(null);
    setError(null);
    try {
      await api.patch("/billing/plan", { plan: target });
      await refreshPlan();
      // TODO: remover texto de placeholder quando Asaas estiver integrado.
      // Ainda não existe cobrança real (PIX/boleto) — a troca abaixo só
      // atualiza o plano direto no banco, pra destravar o produto pra teste.
      setMessage(
        `Em breve: pagamento via PIX/boleto (Asaas). Por enquanto, seu plano foi atualizado diretamente para ${TIERS.find((t) => t.plan === target)?.name} para fins de teste.`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao trocar de plano.");
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

      <div className="pricing-grid" style={{ gap: 20 }}>
        {TIERS.map((tier) => {
          const isCurrent = plan?.plan === tier.plan;
          const isDowngrade = plan ? PLAN_RANK[tier.plan] < PLAN_RANK[plan.plan] : false;

          return (
            <div key={tier.plan} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, letterSpacing: "0.01em" }}>{tier.name}</h3>
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

              <button
                className={isDowngrade ? "btn-secondary" : "btn-primary"}
                onClick={() => handleSwitchPlan(tier.plan)}
                disabled={isCurrent || loadingPlan !== null}
              >
                {isCurrent
                  ? "Plano atual"
                  : loadingPlan === tier.plan
                    ? "Aguarde..."
                    : isDowngrade
                      ? `Voltar para ${tier.name}`
                      : `Assinar ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
