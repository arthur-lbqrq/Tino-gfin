-- CreateEnum
CREATE TYPE "ImportFormat" AS ENUM ('OFX', 'CSV');

-- CreateEnum
CREATE TYPE "ImportedTransactionStatus" AS ENUM ('PENDENTE', 'SUGERIDO', 'CONFIRMADO', 'IGNORADO');

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "format" "ImportFormat" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imported_transactions" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "externalId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "ImportedTransactionStatus" NOT NULL DEFAULT 'PENDENTE',
    "linkedTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imported_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "imported_transactions_batchId_idx" ON "imported_transactions"("batchId");

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_transactions" ADD CONSTRAINT "imported_transactions_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_transactions" ADD CONSTRAINT "imported_transactions_linkedTransactionId_fkey" FOREIGN KEY ("linkedTransactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
