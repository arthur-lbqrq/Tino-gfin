-- A migration anterior (make_transaction_account_required) só criava conta "Padrão"
-- para usuários que já tinham transações órfãs (accountId nulo). Usuários existentes
-- sem nenhuma transação ainda (ex: cadastrados antes do accountId virar obrigatório)
-- ficaram sem nenhuma conta e travados pra lançar a primeira transação. Este backfill
-- cobre todo usuário que hoje tem zero contas, igual ao que registerUser já faz no cadastro.
INSERT INTO "accounts" ("id", "userId", "name", "type", "initialBalance", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", 'Padrão', 'CORRENTE', 0, now(), now()
FROM "users" u
WHERE NOT EXISTS (
  SELECT 1 FROM "accounts" a WHERE a."userId" = u."id"
);
