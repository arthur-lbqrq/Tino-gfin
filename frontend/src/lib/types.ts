export type TransactionType = "RECEITA" | "DESPESA";
export type AccountType = "CORRENTE" | "CARTEIRA" | "CARTAO_CREDITO" | "POUPANCA";

export interface User {
  id: string;
  name: string;
  email: string;
}

export type Plan = "FREE" | "PRO" | "BUSINESS";
export type PlanStatus = "ACTIVE" | "CANCELED" | "PAST_DUE";

export interface PlanState {
  plan: Plan;
  planStatus: PlanStatus;
  planRenewsAt: string | null;
  paymentProvider: string | null;
}

export interface CheckoutSession {
  url: string | null;
  providerSessionId: string | null;
  pending: boolean;
  message?: string;
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

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface CashflowPoint {
  month: string;
  receitas: number;
  despesas: number;
  resultado: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  category: Category;
  amount: string;
  referenceMonth: string;
  createdAt: string;
}

export interface BudgetStatus {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  usagePercent: number;
  overBudget: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  accountId: string;
  accountName: string;
  currentAmount: number;
  progressPercent: number;
  achieved: boolean;
  createdAt: string;
}

export type ImportFormat = "OFX" | "CSV";
export type ImportedTransactionStatus = "PENDENTE" | "SUGERIDO" | "CONFIRMADO" | "IGNORADO";

export interface ImportedTransactionItem {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: TransactionType;
  status: ImportedTransactionStatus;
  linkedTransactionId: string | null;
  linkedTransaction?: Transaction | null;
}

export interface ImportBatch {
  id: string;
  accountId: string;
  account?: Account;
  fileName: string;
  format: ImportFormat;
  createdAt: string;
  items?: ImportedTransactionItem[];
  _count?: { items: number };
}

export interface MeiStatus {
  year: number;
  revenueLimit: number;
  currentRevenue: number;
  usagePercent: number;
  overLimit: boolean;
  projectedRevenue: number;
  projectedOverLimit: boolean;
  monthsElapsed: number;
}

export interface MeiSettings {
  dasMonthlyAmount: number | null;
  meiRevenueLimit: number | null;
}

export interface DreCategoryLine {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface DreReport {
  startDate: string;
  endDate: string;
  receitas: { items: DreCategoryLine[]; total: number };
  despesas: { items: DreCategoryLine[]; total: number };
  resultado: number;
}

export interface PeriodComparisonPoint {
  label: string;
  startDate: string;
  endDate: string;
  receitas: number;
  despesas: number;
  resultado: number;
}

export interface DailyExpensePoint {
  day: number;
  total: number;
}

export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  type: string;
  severity: InsightSeverity;
  message: string;
  data: Record<string, number | string>;
}
