-- Content draft / preview workflow

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DRAFT_SAVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DRAFT_DISCARDED';

ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "draftData" TEXT;
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "draftEditedAt" TIMESTAMP(3);
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "draftEditedBy" TEXT;
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "publishedBy" TEXT;

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "draftData" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "draftEditedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "draftEditedBy" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "publishedBy" TEXT;

ALTER TABLE "Tender" ADD COLUMN IF NOT EXISTS "draftData" TEXT;
ALTER TABLE "Tender" ADD COLUMN IF NOT EXISTS "draftEditedAt" TIMESTAMP(3);
ALTER TABLE "Tender" ADD COLUMN IF NOT EXISTS "draftEditedBy" TEXT;
ALTER TABLE "Tender" ADD COLUMN IF NOT EXISTS "publishedBy" TEXT;

ALTER TABLE "NewsPost" ADD COLUMN IF NOT EXISTS "draftData" TEXT;
ALTER TABLE "NewsPost" ADD COLUMN IF NOT EXISTS "draftEditedAt" TIMESTAMP(3);
ALTER TABLE "NewsPost" ADD COLUMN IF NOT EXISTS "draftEditedBy" TEXT;
ALTER TABLE "NewsPost" ADD COLUMN IF NOT EXISTS "publishedBy" TEXT;

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "draftData" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "draftEditedAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "draftEditedBy" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "publishedBy" TEXT;

ALTER TABLE "BoardMember" ADD COLUMN IF NOT EXISTS "draftData" TEXT;
ALTER TABLE "BoardMember" ADD COLUMN IF NOT EXISTS "draftEditedAt" TIMESTAMP(3);
ALTER TABLE "BoardMember" ADD COLUMN IF NOT EXISTS "draftEditedBy" TEXT;
ALTER TABLE "BoardMember" ADD COLUMN IF NOT EXISTS "publishedBy" TEXT;

ALTER TABLE "LeadershipMember" ADD COLUMN IF NOT EXISTS "draftData" TEXT;
ALTER TABLE "LeadershipMember" ADD COLUMN IF NOT EXISTS "draftEditedAt" TIMESTAMP(3);
ALTER TABLE "LeadershipMember" ADD COLUMN IF NOT EXISTS "draftEditedBy" TEXT;
ALTER TABLE "LeadershipMember" ADD COLUMN IF NOT EXISTS "publishedBy" TEXT;

-- Ensure existing live content is marked published
UPDATE "Page" SET "status" = 'PUBLISHED', "publishedAt" = COALESCE("publishedAt", "createdAt") WHERE "status" IS NULL OR "slug" = 'home';
UPDATE "Project" SET "statusContent" = 'PUBLISHED', "publishedAt" = COALESCE("publishedAt", "createdAt") WHERE "statusContent" = 'DRAFT' AND "publishedAt" IS NOT NULL;
UPDATE "Tender" SET "statusContent" = 'PUBLISHED', "publishedAt" = COALESCE("publishedAt", "createdAt") WHERE "statusContent" = 'DRAFT' AND "publishedAt" IS NOT NULL;
UPDATE "NewsPost" SET "status" = 'PUBLISHED', "publishedAt" = COALESCE("publishedAt", "createdAt") WHERE "status" = 'DRAFT' AND "publishedAt" IS NOT NULL;
UPDATE "BoardMember" SET "status" = 'PUBLISHED', "publishedAt" = COALESCE("publishedAt", "createdAt") WHERE "status" = 'PUBLISHED' OR "publishedAt" IS NOT NULL;
UPDATE "LeadershipMember" SET "status" = 'PUBLISHED', "publishedAt" = COALESCE("publishedAt", "createdAt") WHERE "status" = 'PUBLISHED' OR "publishedAt" IS NOT NULL;
