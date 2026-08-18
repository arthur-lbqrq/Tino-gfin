# Tino — Fase 2b: Novas Regras no Motor de Insights

Escopo: o motor de insights (rule-based, `src/insights/`) ainda não usa os dados de
Account, RecurringTransaction e Budget. Esta etapa fecha esse ciclo, adicionando 4 regras
novas sem tocar na arquitetura existente do motor.

Pré-requisito: Account, RecurringTransaction e Budget já implementados (backend + frontend).

---

## Regras novas

### 1. Estouro / proximidade de orçamento
- **Fonte de dado:** `Budget` (limite por categoria) + soma de `Transaction` do mês na categoria
- **Gatilho:** gasto atual ≥ 80% do limite (aviso) ou > 100% do limite (alerta crítico)
- **Severidade:** `warning` aos 80%, `critical` ao estourar
- **Texto exemplo:** "Você já usou 85% do orçamento de Fornecedores e faltam 12 dias no mês"
  / "Você estourou o orçamento de Fornecedores em R$340 este mês"

### 2. Compromissos fixos futuros
- **Fonte de dado:** `RecurringTransaction` ativas com `dayOfMonth`/`startDate` caindo nos
  próximos 30 dias, somadas por tipo (INCOME/EXPENSE)
- **Gatilho:** sempre gera (é informativo), mas sobe de severidade se a soma de despesas
  fixas futuras for maior que o saldo atual disponível
- **Texto exemplo:** "Seus compromissos fixos dos próximos 30 dias somam R$2.400 — isso
  consome 68% do seu saldo atual"

### 3. Projeção de caixa com separação fixo/variável
- **Fonte de dado:** substitui a lógica atual de projeção (que hoje provavelmente trata
  histórico como um bloco só). Passa a separar:
  - Base certa: recorrências ativas nos próximos N dias (valor exato, não estimado)
  - Base estimada: média histórica das transações NÃO vinculadas a uma recorrência
    (`sourceRecurringId IS NULL`)
- **Gatilho:** igual à regra de projeção existente, mas o cálculo interno muda
- **Texto exemplo:** mantém o padrão atual ("nesse ritmo seu caixa fica negativo em 18
  dias"), mas o número fica mais confiável

### 4. Saldo consolidado multi-conta
- **Fonte de dado:** soma de `currentBalance`/saldo calculado de todas as `Account` do usuário
- **Gatilho:** dispara quando uma conta específica está com saldo baixo, MAS o total
  consolidado ainda está positivo — evita alarme falso
- **Texto exemplo:** "Sua conta Caixa está com saldo baixo (R$120), mas você tem R$3.200
  somando as outras contas"
- **Cuidado:** essa regra deve **suprimir ou suavizar** o insight antigo de "saldo baixo"
  que hoje provavelmente olha só uma conta ou o total sem essa distinção — checar se há
  conflito/duplicação com regra existente antes de adicionar

---

## Onde encaixar no motor existente

Sem saber a estrutura exata de `src/insights/insights.service.ts`, o padrão mais provável
(rule-based engine) é algo como um array de funções de regra, cada uma retornando
`InsightTicket | null`. As 4 regras acima devem seguir o mesmo formato das regras
já existentes (mesma assinatura de função, mesmo enum de severidade, mesma forma de
retorno) — por isso o primeiro passo do prompt abaixo é pedir pro Claude Code mostrar
uma regra existente como referência antes de escrever as novas.

---

## Prompt para colar no Claude Code

```
Estou expandindo o motor de insights do Tino (backend Node + TypeScript + Express +
Prisma). O motor é baseado em regras, em src/insights/. Account, RecurringTransaction
e Budget já estão implementados (schema, módulo, frontend) — só o motor de insights
ainda não usa esses dados.

Convenções do projeto: cada módulo de domínio segue o padrão routes/controller/service;
validação com Zod no controller; erros de domínio como classes estendendo Error com
statusCode; toda rota autenticada usa authMiddleware injetando req.userId; Prisma
sempre pelo singleton em @/lib/prisma; rodar npx tsc --noEmit antes de considerar
qualquer módulo pronto.

Primeiro, me mostre como uma regra de insight existente está implementada hoje em
src/insights/ (assinatura de função, formato de retorno, enum de severidade, e como
as regras são registradas/executadas), pra eu confirmar que as novas regras vão seguir
o mesmo padrão.

Depois, vamos adicionar 4 regras novas, uma por vez, esperando minha aprovação entre
cada uma:

1. Estouro/proximidade de orçamento: usa Budget + soma de Transaction do mês por
   categoria. Warning aos 80% do limite, critical acima de 100%.

2. Compromissos fixos futuros: soma RecurringTransaction ativas com vencimento nos
   próximos 30 dias, separado por INCOME/EXPENSE. Sobe de severidade se despesas
   fixas futuras superarem o saldo atual disponível.

3. Projeção de caixa revisada: ajustar a regra de projeção existente para separar
   base certa (recorrências ativas) de base estimada (média histórica de transações
   SEM sourceRecurringId), em vez de tratar tudo como uma média única.

4. Saldo consolidado multi-conta: somar currentBalance de todas as Account do usuário.
   Se uma conta específica estiver com saldo baixo mas o total consolidado for
   positivo, gerar um insight mais brando explicando isso — e verificar se existe
   conflito com alguma regra de "saldo baixo" já implementada, pra não duplicar ou
   contradizer.

Comece me mostrando a regra existente como referência.
```
