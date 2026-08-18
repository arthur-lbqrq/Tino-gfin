# Tino — Fase 2: Contas, Recorrências e Orçamentos

Escopo: ativar `Account`, `RecurringTransaction` e `Budget` (já existem no schema Prisma, mas
não têm módulo/API/insight implementados) e conectar cada um ao motor de insights.

Ordem de implementação: **Account → RecurringTransaction → Budget**, porque Transaction passa
a depender de `accountId`, e Budget se apoia em Category (já existente) sem depender dos outros dois.

---

## 1. Account (contas/carteiras)

### Modelo (revisar no schema atual)
Campos esperados: `id`, `userId`, `name`, `type` (`CHECKING | CASH | CARD_WALLET | OTHER`),
`initialBalance`, `currentBalance` (derivado ou persistido — decidir), `createdAt`.

### Módulo `src/accounts/`
- `accounts.routes.ts` — CRUD básico, tudo atrás de `authMiddleware`
- `accounts.controller.ts` — Zod: `name` obrigatório, `type` enum, `initialBalance` number ≥ 0
- `accounts.service.ts` — `AccountError` customizado; usa `@/lib/prisma` (singleton — não instanciar novo)

### Mudança em Transaction
- `Transaction` passa a exigir `accountId` (FK). Precisa de migration + backfill: transações
  existentes recebem uma conta "Padrão" criada automaticamente por usuário.
- `transactions.service.ts` passa a filtrar/agrupar também por `accountId`.

### Mudança em Dashboard
- Agregações passam a poder ser filtradas por conta, e o resumo geral soma saldo de todas as contas.

### Insight novo habilitado
- "Sua conta [X] está com saldo baixo (R$Y), mas você tem R$Z somando as outras contas" — evita
  o insight de fluxo de caixa mentir por estar olhando só uma conta.

---

## 2. RecurringTransaction (recorrências)

### Modelo (revisar no schema atual)
Campos esperados: `id`, `userId`, `accountId`, `categoryId`, `description`, `amount`, `type`
(`INCOME | EXPENSE`), `frequency` (`WEEKLY | MONTHLY | YEARLY`), `dayOfMonth` ou `startDate`,
`endDate` (nullable), `isActive`.

### Módulo `src/recurring-transactions/`
- CRUD padrão seguindo o mesmo trio routes/controller/service
- `recurring-transactions.service.ts` inclui `generateDueTransactions()` — função que, ao rodar
  (cron ou lazy-check no login/dashboard), materializa as transações do período em `Transaction`
  reais vinculadas à recorrência (`sourceRecurringId`).

### Decisão a tomar com o Claude Code
Cron job real (node-cron) vs. checagem lazy toda vez que o usuário abre o dashboard. Para MVP,
lazy é mais simples e sem infra extra — sugiro começar por aí.

### Insight novo habilitado
- Separação despesas fixas vs. variáveis nos alertas existentes
- "Seus compromissos fixos dos próximos 30 dias somam R$X — isso consome Y% do seu saldo atual"
- Projeção de caixa fica muito mais precisa (recorrências são certeza, não estimativa)

---

## 3. Budget (orçamento por categoria)

### Modelo (revisar no schema atual)
Campos esperados: `id`, `userId`, `categoryId`, `monthlyLimit`, `month`/`year` ou recorrente
por padrão (decidir se orçamento é "por mês específico" ou "vale todo mês até mudar").

### Módulo `src/budgets/`
- CRUD padrão
- `budgets.service.ts` — `getBudgetStatus(userId, month)`: retorna gasto atual vs. limite por categoria

### Insight novo habilitado
- "Você já usou 85% do orçamento de [Categoria] e ainda faltam 12 dias no mês"
- "Você estourou o orçamento de [Categoria] em R$X este mês"

---

## Ordem sugerida de execução no Claude Code

1. Account (schema + módulo + migration de Transaction)
2. RecurringTransaction (schema + módulo + geração lazy)
3. Budget (schema + módulo)
4. Novas regras no motor de insights consumindo os três

---

## Prompt para colar no Claude Code

```
Estou expandindo o backend do Tino (Node + TypeScript + Express + Prisma + PostgreSQL).
Convenções do projeto: cada módulo de domínio fica em src/<modulo>/ com três arquivos
(<modulo>.routes.ts, <modulo>.controller.ts, <modulo>.service.ts); validação sempre com
Zod no controller, nunca no service; erros de domínio são classes que estendem Error com
statusCode; toda rota autenticada usa authMiddleware de src/auth/auth.middleware.ts,
que injeta req.userId; Prisma é sempre importado do singleton em @/lib/prisma, nunca
instanciado localmente; rodar npx tsc --noEmit antes de considerar qualquer módulo pronto.

Primeiro, leia o schema.prisma atual e me mostre os modelos Account, RecurringTransaction
e Budget como estão definidos hoje, e o modelo Transaction atual, antes de qualquer mudança.

Depois, vamos implementar em três etapas, uma por vez, esperando minha aprovação entre
cada uma:

1. Account: módulo CRUD completo seguindo o padrão do projeto. Adicionar accountId
   obrigatório em Transaction (com migration e criação automática de uma conta "Padrão"
   para usuários existentes, pra não quebrar dados atuais). Ajustar transactions.service.ts
   e o dashboard para considerar accountId.

2. RecurringTransaction: módulo CRUD completo. Implementar generateDueTransactions()
   no service, que materializa transações reais a partir das recorrências ativas — checagem
   lazy disparada quando o usuário acessa o dashboard, sem cron por enquanto.

3. Budget: módulo CRUD completo, com getBudgetStatus(userId, month) retornando gasto
   atual vs. limite por categoria.

Comece pela etapa 1. Antes de escrever código, me confirme o plano de migration da
Transaction (como vai lidar com dados existentes sem accountId).
```
