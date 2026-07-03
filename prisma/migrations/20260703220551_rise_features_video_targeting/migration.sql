-- CreateEnum
CREATE TYPE "ReferralKind" AS ENUM ('CUSTOMER', 'EMPLOYEE', 'INFLUENCER');

-- AlterEnum
ALTER TYPE "CreditTxType" ADD VALUE 'CASHBACK';

-- AlterTable
ALTER TABLE "LoyaltyProgram" ADD COLUMN     "cashbackPct" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "kind" "ReferralKind" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "sort" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
