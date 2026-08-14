# Integrando os novos módulos

No arquivo principal onde as rotas já existentes (auth, categories, transactions) são
registradas no Express, adicione:

```typescript
import accountsRoutes from "./accounts/accounts.routes";
import recurringTransactionsRoutes from "./recurring-transactions/recurring-transactions.routes";

app.use("/accounts", accountsRoutes);
app.use("/recurring-transactions", recurringTransactionsRoutes);
```

## Antes de rodar

1. Aplicar o `schema.prisma` atualizado (contas, faturas, recorrências, orçamento):
   ```
   npx prisma migrate dev --name add_accounts_recurring_budget
   npx prisma generate
   ```
2. Rodar `npx tsc --noEmit` pra garantir que os tipos do Prisma Client batem com os
   dois módulos novos (o client precisa estar regenerado primeiro).

## Endpoints criados

**Accounts** (`/accounts`, todos autenticados)
- `POST /accounts` — cria conta (corrente, carteira, cartão de crédito, poupança)
- `GET /accounts` — lista contas do usuário
- `GET /accounts/:id` — detalhe de uma conta
- `GET /accounts/:id/balance` — saldo atual calculado
- `PUT /accounts/:id` — atualiza conta
- `DELETE /accounts/:id` — remove conta (bloqueia se houver transações vinculadas)

**Recurring transactions** (`/recurring-transactions`, todos autenticados)
- `POST /recurring-transactions` — cria uma recorrência (assinatura, salário, aluguel...)
- `GET /recurring-transactions` — lista recorrências do usuário
- `GET /recurring-transactions/:id` — detalhe
- `PUT /recurring-transactions/:id` — atualiza (inclui pausar via `active: false`)
- `DELETE /recurring-transactions/:id` — remove
- `POST /recurring-transactions/generate` — gera as transações pendentes até hoje
  (chamar isso é manual por enquanto; no futuro vira um job de cron)

## O que ainda falta pra fechar o módulo

- Endpoint de transferência entre contas (cria duas transactions linkadas por
  `transferPairId`) — não entrou aqui porque acho que faz mais sentido morar no
  módulo `transactions` já existente, não em `accounts`. Posso montar em seguida.
- Módulo `budgets` (orçamento por categoria) — o schema já suporta, só falta o
  routes/controller/service, mesmo padrão dos outros.
- Geração automática de fatura (`Invoice`) pra transações de cartão de crédito —
  hoje o schema permite, mas a lógica de criar/fechar fatura ainda não foi escrita.
