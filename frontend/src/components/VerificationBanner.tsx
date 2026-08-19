import { useState } from "react";
import { api } from "@/lib/api";

export function VerificationBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setSending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="verify-banner">
      <span>
        Confirme seu e-mail (<strong>{email}</strong>) pra garantir acesso total à sua conta.
      </span>
      {sent ? (
        <span className="verify-banner-sent">Reenviado — confira sua caixa de entrada.</span>
      ) : (
        <button type="button" onClick={handleResend} disabled={sending}>
          {sending ? "Enviando..." : "Reenviar e-mail"}
        </button>
      )}
    </div>
  );
}
