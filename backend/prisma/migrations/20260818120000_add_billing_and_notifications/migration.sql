-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN "planStatus" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "planRenewsAt" TIMESTAMP(3),
ADD COLUMN "paymentProvider" TEXT,
ADD COLUMN "paymentCustomerId" TEXT,
ADD COLUMN "paymentSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "insight_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insight_notifications_userId_insightType_key" ON "insight_notifications"("userId", "insightType");

-- AddForeignKey
ALTER TABLE "insight_notifications" ADD CONSTRAINT "insight_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
