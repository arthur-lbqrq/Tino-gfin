import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FlowDivider } from "@/components/FlowDivider";
import { PageLoader } from "@/components/PageLoader";

type Status = "loading" | "success" | "error";

export function VerifyEmail() {
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  // O token é de uso único — sem esse guard, o StrictMode do React roda o
  // efeito duas vezes em dev e a segunda chamada erra por falta de token válido,
  // mesmo a primeira já tendo confirmado com sucesso.
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Link de confirmação inválido — faltando o token.");
      return;
    }

    api
      .post("/auth/verify-email", { token })
      .then(() => {
        setStatus("success");
        // Se já tinha uma sessão aberta (ex: verificou em outra aba), atualiza
        // o emailVerified em cache pra sumir com o aviso sem precisar relogar.
        refreshUser();
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Não foi possível confirmar seu e-mail.");
      });
  }, [token]);

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">Faro</div>
        <p className="auth-tagline">Confirmação de e-mail</p>
        <FlowDivider />

        {status === "loading" && <PageLoader />}

        {status === "success" && (
          <>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
              E-mail confirmado com sucesso. Sua conta já está ativa.
            </p>
            <Link to="/login" className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: 20, textDecoration: "none" }}>
              Entrar
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="error-text">{message}</p>
            <p style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 12 }}>
              O link pode ter expirado (validade de 24h) ou já ter sido usado. Peça um novo
              link na tela de login.
            </p>
            <Link to="/login" className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: 20, textDecoration: "none" }}>
              Voltar para o login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
