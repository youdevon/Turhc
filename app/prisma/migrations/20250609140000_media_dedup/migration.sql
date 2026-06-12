-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "caption" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "fileHash" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "uploadedBy" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "MediaAsset" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MediaAsset_originalName_idx" ON "MediaAsset"("originalName");
CREATE INDEX IF NOT EXISTS "MediaAsset_size_idx" ON "MediaAsset"("size");
CREATE INDEX IF NOT EXISTS "MediaAsset_width_height_idx" ON "MediaAsset"("width", "height");
CREATE INDEX IF NOT EXISTS "MediaAsset_fileHash_idx" ON "MediaAsset"("fileHash");
CREATE INDEX IF NOT EXISTS "MediaAsset_isDeleted_idx" ON "MediaAsset"("isDeleted");
