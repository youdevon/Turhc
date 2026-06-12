-- Extend AuditAction enum with human-readable audit categories
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'LOGOUT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PERMISSION_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'VIEWED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EXPORTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Human-readable audit fields (append-only audit trail)
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorRole" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "displayAction" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "targetType" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "targetName" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "changes" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "outcome" TEXT NOT NULL DEFAULT 'Success';
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "failReason" TEXT;

CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_actorEmail_createdAt_idx" ON "AuditLog"("actorEmail", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_module_recordName_idx" ON "AuditLog"("module", "recordName");
CREATE INDEX IF NOT EXISTS "AuditLog_targetType_targetName_idx" ON "AuditLog"("targetType", "targetName");
CREATE INDEX IF NOT EXISTS "AuditLog_displayAction_createdAt_idx" ON "AuditLog"("displayAction", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_outcome_createdAt_idx" ON "AuditLog"("outcome", "createdAt");
