import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { FlowDivider } from "@/components/FlowDivider";

export function Register() {
  const { register, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await register(name, email, password);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar sua conta.");
    }
  }

  async function handleResend() {
    setResent(false);
    try {
      await api.post("/auth/resend-verification", { email });
      setResent(true);
    } catch {
      // silencioso: o endpoint sempre responde 200, um erro aqui só pode ser
      // rede/servidor fora do ar — nada de novo pra mostrar além do que já está na tela
    }
  }

  if (submitted) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">Tino</div>
          <p className="auth-tagline">Confirme seu e-mail</p>
          <FlowDivider />

          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele pra
            ativar sua conta — depois é só entrar normalmente.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={handleResend}
            style={{ width: "100%", marginTop: 20 }}
          >
            Reenviar e-mail de confirmação
          </button>
          {resent && (
            <p style={{ fontSize: 13, color: "var(--primary)", marginTop: 8, textAlign: "center" }}>
              Reenviado — confira sua caixa de entrada.
            </p>
          )}

          <p className="auth-switch">
            <Link to="/login">Voltar para o login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">Tino</div>
        <p className="auth-tagline">Crie sua conta gratuita</p>
        <FlowDivider />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 12, textAlign: "center" }}>
          Ao criar conta, você concorda com os <Link to="/termos">Termos de Uso</Link> e a{" "}
          <Link to="/privacidade">Política de Privacidade</Link>.
        </p>

        <p className="auth-switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
