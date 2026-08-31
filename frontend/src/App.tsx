import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { VerifyEmail } from "@/pages/VerifyEmail";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { Dashboard } from "@/pages/Dashboard";
import { Compromissos } from "@/pages/Compromissos";
import { Transactions } from "@/pages/Transactions";
import { Accounts } from "@/pages/Accounts";
import { CardInvoices } from "@/pages/CardInvoices";
import { Budgets } from "@/pages/Budgets";
import { Goals } from "@/pages/Goals";
import { Imports } from "@/pages/Imports";
import { ImportDetail } from "@/pages/ImportDetail";
import { Mei } from "@/pages/Mei";
import { Reports } from "@/pages/Reports";
import { Planos } from "@/pages/Planos";
import { Settings } from "@/pages/Settings";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { TermsOfService } from "@/pages/TermsOfService";

// Landing e as telas de autenticação nunca foram desenhadas pro tema escuro
// (dependem de combinações de --ink/--surface/--bg que não sobrevivem à
// inversão) — ficam sempre no claro, mesmo se o app estiver em modo escuro.
function PublicPage({ children }: { children: ReactNode }) {
  return <div className="force-light-theme">{children}</div>;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicPage><Landing /></PublicPage>} />
          <Route path="/login" element={<PublicPage><Login /></PublicPage>} />
          <Route path="/register" element={<PublicPage><Register /></PublicPage>} />
          <Route path="/verify-email" element={<PublicPage><VerifyEmail /></PublicPage>} />
          <Route path="/forgot-password" element={<PublicPage><ForgotPassword /></PublicPage>} />
          <Route path="/reset-password" element={<PublicPage><ResetPassword /></PublicPage>} />
          <Route path="/privacidade" element={<PublicPage><PrivacyPolicy /></PublicPage>} />
          <Route path="/termos" element={<PublicPage><TermsOfService /></PublicPage>} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/compromissos" element={<Compromissos />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/:accountId/invoices" element={<CardInvoices />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/importar" element={<Imports />} />
            <Route path="/importar/:batchId" element={<ImportDetail />} />
            <Route path="/mei" element={<Mei />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
