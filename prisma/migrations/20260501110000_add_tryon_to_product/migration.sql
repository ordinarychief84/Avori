-- CreateEnum
CREATE TYPE "TryOnCategory" AS ENUM ('NONE', 'LIPSTICK', 'LIP_GLOSS', 'BLUSH', 'EYESHADOW', 'EYELINER');

-- AlterTable
ALTER TABLE "Product"
  ADD COLUMN "tryOnEnabled"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tryOnCategory" "TryOnCategory" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "tryOnTint"     TEXT;
