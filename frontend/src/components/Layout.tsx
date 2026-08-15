import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Tino</div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            Dashboard
          </NavLink>
          <NavLink
            to="/transactions"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            Transações
          </NavLink>
          <NavLink
            to="/accounts"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            Contas
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <p style={{ fontSize: 13, marginBottom: 10, color: "var(--ink-faint)" }}>{user?.name}</p>
          <button className="logout-btn" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
