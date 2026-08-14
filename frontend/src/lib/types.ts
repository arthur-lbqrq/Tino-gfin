export type TransactionType = "RECEITA" | "DESPESA";

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

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  description: string | null;
  date: string;
  category: Category;
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
