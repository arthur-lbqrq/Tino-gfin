import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { FlowDivider } from "@/components/FlowDivider";

export function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setUnverified(false);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar.");
      setUnverified(err instanceof ApiError && err.statusCode === 403);
    }
  }

  async function handleResend() {
    setResent(false);
    try {
      await api.post("/auth/resend-verification", { email });
      setResent(true);
    } catch {
      // endpoint sempre responde 200 — um erro aqui só seria rede/servidor fora do ar
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">Tino</div>
        <p className="auth-tagline">Transforme dados em decisões</p>
        <FlowDivider />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          {unverified && (
            <button
              type="button"
              onClick={handleResend}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                marginTop: -8,
                marginBottom: 16,
                color: "var(--primary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reenviar e-mail de confirmação
            </button>
          )}
          {resent && (
            <p style={{ fontSize: 13, color: "var(--primary)", marginTop: -8, marginBottom: 16 }}>
              Reenviado — confira sua caixa de entrada.
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-switch">
          Ainda não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
