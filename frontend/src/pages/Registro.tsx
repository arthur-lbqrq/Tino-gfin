import { Link } from "react-router-dom";

// Placeholder — entra aqui o formulário real de registro (nome, email, senha)
// consumindo o endpoint de auth que já existe no backend.
export default function Registro() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--grafite)",
        color: "var(--texto-claro)",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <p className="mono" style={{ color: "var(--texto-claro-sec)", fontSize: "14px" }}>
        tela de registro — em construção
      </p>
      <Link to="/" style={{ color: "var(--sinal-2)", fontSize: "14px" }}>
        ← voltar para a landing
      </Link>
    </div>
  );
}
