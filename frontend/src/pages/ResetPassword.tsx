import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { FlowDivider } from "@/components/FlowDivider";

const MIN_PASSWORD_LENGTH = 6;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      navigate("/login", {
        replace: true,
        state: { message: "Senha redefinida com sucesso. Entre com sua nova senha." },
      });
    } catch (err) {
      // Único erro real que esse endpoint devolve fora de validação de input é
      // token inválido/expirado — não adianta deixar o formulário aberto pra
      // tentar de novo, o link em si que já não serve mais.
      setTokenError(err instanceof ApiError ? err.message : "Não foi possível redefinir sua senha.");
    } finally {
      setLoading(false);
    }
  }

  if (!token || tokenError) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">Faro</div>
          <p className="auth-tagline">Redefinir senha</p>
          <FlowDivider />

          <p className="error-text">
            {tokenError ?? "Link de redefinição inválido — faltando o token."}
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 12 }}>
            O link pode ter expirado (validade de 1h) ou já ter sido usado. Peça um novo
            link de redefinição.
          </p>

          <Link
            to="/forgot-password"
            className="btn-primary"
            style={{ display: "block", textAlign: "center", marginTop: 20, textDecoration: "none" }}
          >
            Pedir novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">Faro</div>
        <p className="auth-tagline">Crie uma senha nova</p>
        <FlowDivider />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Nova senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirme a nova senha</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>

          {formError && <p className="error-text">{formError}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
