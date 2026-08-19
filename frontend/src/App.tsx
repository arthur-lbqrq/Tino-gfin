import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { VerifyEmail } from "@/pages/VerifyEmail";
import { Dashboard } from "@/pages/Dashboard";
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

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos" element={<TermsOfService />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
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
