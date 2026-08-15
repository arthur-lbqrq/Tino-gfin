export type TransactionType = "RECEITA" | "DESPESA";
export type AccountType = "CORRENTE" | "CARTEIRA" | "CARTAO_CREDITO" | "POUPANCA";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  isDefault: boolean;
  userId: string | null;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: string;
  creditLimit: string | null;
  closingDay: number | null;
  dueDay: number | null;
  createdAt: string;
}

export interface AccountBalance {
  balance: number;
  initialBalance: string;
  receitas: number;
  despesas: number;
}

export interface Invoice {
  id: string;
  accountId: string;
  referenceMonth: string;
  closingDate: string;
  dueDate: string;
  paid: boolean;
  total: number;
  transactionCount?: number;
  transactions?: Transaction[];
}

export interface CreditLimitStatus {
  limit: number;
  used: number;
  available: number;
  usagePercent: number;
  overLimit: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  description: string | null;
  date: string;
  category: Category;
  accountId?: string | null;
  account?: Account | null;
  invoiceId?: string | null;
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
}

export interface DashboardSummary {
  saldoAtual: number;
  receitas: number;
  despesas: number;
  resultado: number;
}

export interface CashflowPoint {
  month: string;
  receitas: number;
  despesas: number;
  resultado: number;
}

export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  type: string;
  severity: InsightSeverity;
  message: string;
  data: Record<string, number | string>;
}
