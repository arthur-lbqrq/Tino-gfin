import { Link } from "react-router-dom";
import { Plan } from "@/lib/types";

const PLAN_LABEL: Record<Plan, string> = { FREE: "Free", PRO: "Pro", BUSINESS: "Business" };

interface UpgradeRequiredProps {
  feature: string;
  minPlan: Exclude<Plan, "FREE">;
}

export function UpgradeRequired({ feature, minPlan }: UpgradeRequiredProps) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--primary-soft)",
          color: "var(--primary-dark)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          fontSize: 20,
        }}
      >
        🔒
      </div>
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>{feature} é um recurso {PLAN_LABEL[minPlan]}</h3>
      <p style={{ fontSize: 14, color: "var(--ink-faint)", maxWidth: 380, margin: "0 auto 20px" }}>
        Faça upgrade pra desbloquear {feature.toLowerCase()} e o resto do motor de insights do Tino.
      </p>
      <Link to="/planos" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
        Ver planos
      </Link>
    </div>
  );
}
