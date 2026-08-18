import { Plan } from "@prisma/client";

// Ordem dos planos, do mais restrito ao mais completo — usado pra checagens
// tipo "esse recurso exige pelo menos Pro" sem precisar de um if por plano.
export const PLAN_RANK: Record<Plan, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
};

export function planAtLeast(plan: Plan, minimum: Plan): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[minimum];
}

// null = sem limite.
export const ACCOUNT_LIMIT_BY_PLAN: Record<Plan, number | null> = {
  FREE: 1,
  PRO: null,
  BUSINESS: null,
};

// No Free, o motor de insights só mostra os dois mais básicos (comparação com
// a média histórica e projeção simples de saldo) — o resto exige Pro. Isso é
// silencioso de propósito: o Free não vê "faltam N insights", só vê menos.
export const FREE_INSIGHT_TYPES = new Set(["expense_above_average", "cashflow_projection"]);

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
};
