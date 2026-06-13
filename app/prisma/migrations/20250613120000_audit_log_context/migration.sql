-- Richer audit context for non-technical review and filtering
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "httpMethod" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "route" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actingOnBehalfOf" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "businessContext" TEXT;

CREATE INDEX IF NOT EXISTS "AuditLog_category_createdAt_idx" ON "AuditLog"("category", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- Backfill category from action for existing rows
UPDATE "AuditLog"
SET "category" = CASE
  WHEN "action"::text IN ('LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_RESET') THEN 'Authentication'
  WHEN "action"::text = 'PERMISSION_CHANGED' THEN 'Authorization'
  WHEN "action"::text IN ('VIEWED', 'ENQUIRY_READ', 'EXPORTED') THEN 'Access'
  WHEN "action"::text IN ('USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'USER_DELETED', 'SETTINGS_CHANGED') THEN 'Admin'
  WHEN "module" = 'System' OR "actorEmail" = 'system' THEN 'System'
  ELSE 'Data'
END
WHERE "category" IS NULL;

-- Append-only enforcement at the database layer
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog records are append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_append_only ON "AuditLog";
CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_mutation();
