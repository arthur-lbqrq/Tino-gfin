-- Backfill: cria uma conta "Padrão" (CORRENTE) para cada usuário que tem
-- transações sem accountId, e aponta essas transações pra ela. Necessário
-- pra poder tornar accountId obrigatório sem quebrar dados existentes.
INSERT INTO "accounts" ("id", "userId", "name", "type", "initialBalance", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", 'Padrão', 'CORRENTE', 0, now(), now()
FROM "users" u
WHERE EXISTS (
  SELECT 1 FROM "transactions" t WHERE t."userId" = u."id" AND t."accountId" IS NULL
);

UPDATE "transactions" t
SET "accountId" = a."id"
FROM "accounts" a
WHERE t."accountId" IS NULL
  AND a."userId" = t."userId"
  AND a."name" = 'Padrão'
  AND a."type" = 'CORRENTE';

-- AlterTable
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_accountId_fkey";
ALTER TABLE "transactions" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
