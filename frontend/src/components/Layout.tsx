import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { VerificationBanner } from "@/components/VerificationBanner";

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 13h6V3H3v10Zm0 8h6v-6H3v6Zm12 0h6V11h-6v10Zm0-18v6h6V3h-6Z" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3v14M7 17 3 13M7 17l4-4" />
      <path d="M17 21V7M17 7l4 4M17 7l-4 4" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

function BudgetsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function GoalsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function ImportsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

function MeiIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 12h6M9 16h6M9 8h3" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19V9M10 19V5M16 19v-7M20 19H4" />
    </svg>
  );
}

function PlansIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

const PLAN_LABEL: Record<string, string> = { FREE: "Free", PRO: "Pro", BUSINESS: "Business" };

export function Layout() {
  const { user, plan, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Fecha o menu sempre que a rota muda — sem isso, o drawer ficaria aberto
  // por cima da tela depois de tocar num link de navegação.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Trava o scroll do fundo enquanto o drawer está aberto no mobile.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <div className="sidebar-brand">Tino</div>
      </div>

      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">Tino</div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <DashboardIcon />
            Dashboard
          </NavLink>
          <NavLink
            to="/transactions"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <TransactionsIcon />
            Transações
          </NavLink>
          <NavLink
            to="/accounts"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <AccountsIcon />
            Contas
          </NavLink>
          <NavLink
            to="/budgets"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <BudgetsIcon />
            Orçamentos
          </NavLink>
          <NavLink
            to="/goals"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <GoalsIcon />
            Metas
          </NavLink>
          <NavLink
            to="/importar"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <ImportsIcon />
            Importar
          </NavLink>
          <NavLink
            to="/relatorios"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <ReportsIcon />
            Relatórios
          </NavLink>
          <NavLink
            to="/mei"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <MeiIcon />
            Fiscal MEI
          </NavLink>
          <NavLink
            to="/planos"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <PlansIcon />
            Planos
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <p style={{ fontSize: 13, marginBottom: 2, color: "var(--ink-faint)" }}>{user?.name}</p>
          {plan && (
            <p style={{ fontSize: 12, marginBottom: 6, color: "var(--primary-dark)", fontWeight: 600 }}>
              Plano {PLAN_LABEL[plan.plan] ?? plan.plan}
            </p>
          )}
          <Link
            to="/configuracoes"
            style={{ fontSize: 12, color: "var(--ink-faint)", display: "block", marginBottom: 10 }}
          >
            Configurações
          </Link>
          <button className="logout-btn" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        {user && !user.emailVerified && <VerificationBanner email={user.email} />}
        <Outlet />
      </main>
    </div>
  );
}
