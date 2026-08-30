import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { FlowDivider } from "@/components/FlowDivider";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      // O backend sempre responde 200 aqui, exista ou não o e-mail — nunca
      // revela se uma conta está cadastrada. A mensagem é a mesma em qualquer caso.
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">Faro</div>
          <p className="auth-tagline">Verifique seu e-mail</p>
          <FlowDivider />

          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Se <strong>{email}</strong> estiver cadastrado, enviamos um link pra você criar
            uma senha nova. Confira sua caixa de entrada (e o spam).
          </p>

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
        <div className="auth-brand">Faro</div>
        <p className="auth-tagline">Esqueceu sua senha?</p>
        <FlowDivider />

        <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 20 }}>
          Informe o e-mail da sua conta e enviamos um link pra você criar uma senha nova.
        </p>

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

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Enviando..." : "Enviar link de redefinição"}
          </button>
        </form>

        <p className="auth-switch">
          Lembrou a senha? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
