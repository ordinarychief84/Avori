-- CreateEnum
CREATE TYPE "UgcSource" AS ENUM ('REVIEW', 'UPLOAD', 'SOCIAL');

-- CreateEnum
CREATE TYPE "UgcStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');

-- CreateTable
CREATE TABLE "UgcItem" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "source" "UgcSource" NOT NULL DEFAULT 'UPLOAD',
    "status" "UgcStatus" NOT NULL DEFAULT 'PENDING',
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "creditName" TEXT,
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewId" TEXT,
    "socialPostId" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UgcItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UgcItem_brandId_status_sort_idx" ON "UgcItem"("brandId", "status", "sort");

-- CreateIndex
CREATE INDEX "UgcItem_brandId_reviewId_idx" ON "UgcItem"("brandId", "reviewId");

-- AddForeignKey
ALTER TABLE "UgcItem" ADD CONSTRAINT "UgcItem_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
