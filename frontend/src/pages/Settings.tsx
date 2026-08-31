import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";

const PLAN_LABEL: Record<string, string> = { FREE: "Free", PRO: "Pro", BUSINESS: "Business" };

export function Settings() {
  const { user, plan, logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDeleting(true);
    try {
      await api.delete("/auth/me", { password });
      logout();
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir a conta.");
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Configurações</h1>
        <p>Sua conta, seus dados e como excluí-los.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Conta</h3>
        <p style={{ fontSize: 14 }}>{user?.name} · {user?.email}</p>
        <p style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 12 }}>
          Leia a <Link to="/privacidade">Política de Privacidade</Link> e os{" "}
          <Link to="/termos">Termos de Uso</Link>.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Plano</h3>
          <p style={{ fontSize: 14 }}>
            Você está no <strong>{plan ? PLAN_LABEL[plan.plan] ?? plan.plan : "..."}</strong>.
          </p>
        </div>
        <Link to="/planos" className="btn-secondary">
          {plan?.plan === "FREE" ? "Ver planos" : "Gerenciar plano"}
        </Link>
      </div>

      <div className="card" style={{ borderColor: "var(--signal-red)" }}>
        <h3 style={{ fontSize: 16, marginBottom: 8, color: "var(--signal-red)" }}>Excluir conta</h3>
        <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 16 }}>
          Remove permanentemente sua conta e tudo vinculado a ela — transações, contas, orçamentos, metas,
          importações. Não tem volta.
        </p>

        {!confirming ? (
          <button className="delete-btn" onClick={() => setConfirming(true)}>
            Quero excluir minha conta
          </button>
        ) : (
          <form onSubmit={handleDelete}>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirme sua senha pra continuar</label>
              <input
                id="confirm-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="delete-btn" disabled={deleting}>
                {deleting ? "Excluindo..." : "Confirmar exclusão definitiva"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setConfirming(false)} disabled={deleting}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
