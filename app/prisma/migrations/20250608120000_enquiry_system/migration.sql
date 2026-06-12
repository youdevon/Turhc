-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'READ', 'IN_PROGRESS', 'RESPONDED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ENQUIRY_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ENQUIRY_READ';
ALTER TYPE "AuditAction" ADD VALUE 'ENQUIRY_UPDATED';

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN "lastName" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN "fullName" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN "companyName" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN "enquiryType" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "Enquiry" ADD COLUMN "relatedTenderRef" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN "relatedProjectRef" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW';
ALTER TABLE "Enquiry" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Enquiry" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN "readBy" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN "internalNotes" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN "emailForwarded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Enquiry" ADD COLUMN "emailForwardedAt" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN "emailForwardError" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrate existing records
UPDATE "Enquiry"
SET
  "firstName" = COALESCE(NULLIF(split_part("name", ' ', 1), ''), "name"),
  "lastName" = CASE
    WHEN position(' ' in trim("name")) > 0 THEN trim(substring(trim("name") from position(' ' in trim("name")) + 1))
    ELSE '—'
  END,
  "fullName" = "name",
  "isRead" = "read",
  "status" = CASE WHEN "read" = true THEN 'READ'::"EnquiryStatus" ELSE 'NEW'::"EnquiryStatus" END,
  "updatedAt" = "createdAt";

ALTER TABLE "Enquiry" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Enquiry" ALTER COLUMN "lastName" SET NOT NULL;
ALTER TABLE "Enquiry" ALTER COLUMN "subject" DROP NOT NULL;

ALTER TABLE "Enquiry" DROP COLUMN "name";
ALTER TABLE "Enquiry" DROP COLUMN "read";
