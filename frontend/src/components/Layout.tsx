import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { VerificationBanner } from "@/components/VerificationBanner";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CashProjectionChart } from "@/components/CashProjectionChart";
import { api } from "@/lib/api";
import { CashProjection, Commitment } from "@/lib/types";

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

const PLAN_LABEL: Record<string, string> = { FREE: "plano grátis", PRO: "plano pro", BUSINESS: "plano business" };

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  badge?: string;
  dot?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function initialsOf(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Layout() {
  const { user, plan, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const [projection, setProjection] = useState<CashProjection | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);

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

  useEffect(() => {
    Promise.all([
      api.get<CashProjection>("/dashboard/cash-projection"),
      api.get<Commitment[]>("/dashboard/commitments"),
    ])
      .then(([projectionData, commitmentsData]) => {
        setProjection(projectionData);
        setCommitments(commitmentsData);
      })
      .catch(() => {
        // Estado Agora é um resumo de apoio — se falhar, a sidebar segue
        // funcional sem ele, sem quebrar a navegação.
      });
  }, []);

  const meiDueSoon = commitments.some((c) => c.id.startsWith("das:"));
  const compromissosCount = commitments.length;

  const navGroups: NavGroup[] = [
    {
      label: "Dia a dia",
      items: [
        { to: "/dashboard", label: "Dashboard", end: true },
        { to: "/transactions", label: "Transações" },
        { to: "/accounts", label: "Contas" },
      ],
    },
    {
      label: "Planejamento",
      items: [
        { to: "/compromissos", label: "Compromissos", badge: compromissosCount > 0 ? String(compromissosCount) : undefined },
        { to: "/budgets", label: "Orçamentos" },
        { to: "/goals", label: "Metas" },
      ],
    },
    {
      label: "MEI",
      items: [
        { to: "/mei", label: "Fiscal MEI", dot: meiDueSoon },
        { to: "/importar", label: "Importar" },
        { to: "/relatorios", label: "Relatórios" },
      ],
    },
  ];

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
        <div className="sidebar-brand">
          <Logo size={25} wordmarkFontSize={22} />
        </div>
      </div>

      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Logo size={25} wordmarkFontSize={22} />
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="sidebar-nav-group" key={group.label}>
              <div className="sidebar-nav-group-label mono">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span>{item.label}</span>
                  {item.badge && <span className="sidebar-badge mono">{item.badge}</span>}
                  {item.dot && <span className="sidebar-dot" aria-label="atenção" />}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {projection && (
            <div className="estado-agora-card">
              <div className="estado-agora-label mono">Estado agora</div>
              <div className="estado-agora-status">
                <span className={`estado-agora-dot ${projection.daysToNegative !== null ? "pulse" : ""}`} />
                <span className="estado-agora-status-text">
                  {projection.daysToNegative !== null ? "Alerta" : "Tudo em dia"}
                </span>
              </div>
              <div className="estado-agora-summary">
                {projection.daysToNegative !== null
                  ? `Caixa negativo previsto em ${projection.daysToNegative} dias`
                  : "Nenhum risco de caixa nos próximos 45 dias"}
              </div>
              <CashProjectionChart series={projection.series} zeroCrossingIndex={projection.zeroCrossingIndex} variant="mini" />
            </div>
          )}
          <div className="sidebar-account">
            <div className="sidebar-avatar mono">{initialsOf(user?.name)}</div>
            <div className="sidebar-account-info">
              <div className="sidebar-account-name">{user?.name}</div>
              <div className="sidebar-account-plan mono">{plan ? PLAN_LABEL[plan.plan] ?? plan.plan : ""}</div>
            </div>
            {plan?.plan === "FREE" && (
              <Link to="/planos" className="sidebar-upgrade mono">
                Pro
              </Link>
            )}
          </div>
          <ThemeToggle />

          <div className="sidebar-footer-links">
            <Link to="/configuracoes" className="mono">
              Configurações
            </Link>
            <button className="mono" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {user && !user.emailVerified && <VerificationBanner email={user.email} />}
        <Outlet />
      </main>
    </div>
  );
}
