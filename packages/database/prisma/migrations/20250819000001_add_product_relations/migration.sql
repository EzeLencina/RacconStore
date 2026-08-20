-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_RELATION_ADD';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_RELATION_REMOVE';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_RELATION_REORDER';

-- CreateEnum
CREATE TYPE "ProductRelationType" AS ENUM ('RELATED', 'ALTERNATIVE', 'COMPLEMENTARY');

-- CreateTable
CREATE TABLE "product_relations" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sourceProductId" TEXT NOT NULL,
  "targetProductId" TEXT NOT NULL,
  "type" "ProductRelationType" NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_relations_tenantId_sourceProductId_targetProductId__idx" ON "product_relations"("tenantId", "sourceProductId", "targetProductId", "type");

-- CreateIndex
CREATE INDEX "product_relations_tenantId_sourceProductId_type_position_idx" ON "product_relations"("tenantId", "sourceProductId", "type", "position");

-- CreateIndex
CREATE INDEX "product_relations_tenantId_targetProductId_idx" ON "product_relations"("tenantId", "targetProductId");

-- AddForeignKey
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;