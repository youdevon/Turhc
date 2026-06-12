import { prisma } from "./db";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "./cache-tags";
import { timed } from "./performance";
import { createAuditLog, getClientIp } from "./audit";
import { sendEnquiryNotificationEmail } from "./mail";
import { getEnquiryDisplayName } from "./enquiry-types";
import type { EnquiryStatus } from "@prisma/client";
import { headers } from "next/headers";

export type CreateEnquiryInput = {
  firstName: string;
  lastName: string;
  companyName?: string | null;
  email: string;
  phone?: string | null;
  enquiryType: string;
  subject?: string | null;
  message: string;
  relatedTenderRef?: string | null;
  relatedProjectRef?: string | null;
};

export async function createEnquiry(input: CreateEnquiryInput) {
  const fullName = `${input.firstName} ${input.lastName}`.trim();

  const enquiry = await prisma.enquiry.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      fullName,
      companyName: input.companyName?.trim() || null,
      email: input.email,
      phone: input.phone?.trim() || null,
      enquiryType: input.enquiryType,
      subject: input.subject?.trim() || null,
      message: input.message,
      relatedTenderRef: input.relatedTenderRef?.trim() || null,
      relatedProjectRef: input.relatedProjectRef?.trim() || null,
      status: "NEW",
      isRead: false,
    },
  });

  let hdrs: Headers | null = null;
  try {
    hdrs = await headers();
  } catch {
    // headers() unavailable outside request context
  }

  await createAuditLog({
    action: "ENQUIRY_CREATED",
    module: "Enquiries",
    recordName: getEnquiryDisplayName(enquiry),
    recordId: enquiry.id,
    ipAddress: hdrs ? getClientIp(hdrs) : null,
    summary: `New enquiry submitted by ${getEnquiryDisplayName(enquiry)} (${enquiry.email})`,
    details: {
      enquiryType: enquiry.enquiryType,
      email: enquiry.email,
    },
  });

  const emailResult = await sendEnquiryNotificationEmail(enquiry);

  const updated = await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: emailResult.success
      ? {
          emailForwarded: true,
          emailForwardedAt: new Date(),
          emailForwardError: null,
        }
      : {
          emailForwarded: false,
          emailForwardError: emailResult.error,
        },
  });

  if (emailResult.success) {
    await createAuditLog({
      action: "ENQUIRY_UPDATED",
      module: "Enquiries",
      recordName: getEnquiryDisplayName(updated),
      recordId: updated.id,
      summary: `Enquiry notification email forwarded for ${getEnquiryDisplayName(updated)}`,
    });
  } else {
    await createAuditLog({
      action: "ENQUIRY_UPDATED",
      module: "Enquiries",
      recordName: getEnquiryDisplayName(updated),
      recordId: updated.id,
      summary: `SMTP forwarding failed for enquiry from ${getEnquiryDisplayName(updated)}`,
      details: { error: emailResult.error },
    });
  }

  return updated;
}

export type EnquiryListFilter = "all" | "unread" | "read" | "deleted" | EnquiryStatus;

export function unreadEnquiryWhere() {
  return {
    isDeleted: false,
    OR: [{ isRead: false }, { status: "NEW" as const }],
  };
}

export function activeEnquiryWhere() {
  return { isDeleted: false };
}

export function buildEnquiryWhere(filter: EnquiryListFilter, search: string) {
  const conditions: Record<string, unknown>[] = [];

  if (filter === "deleted") {
    conditions.push({ isDeleted: true });
  } else {
    conditions.push({ isDeleted: false });
  }

  switch (filter) {
    case "unread":
      conditions.push({ OR: [{ isRead: false }, { status: "NEW" }] });
      break;
    case "read":
      conditions.push({ isRead: true });
      break;
    case "IN_PROGRESS":
    case "RESPONDED":
    case "ARCHIVED":
    case "NEW":
      conditions.push({ status: filter });
      break;
    default:
      break;
  }

  const q = search.trim();
  if (q) {
    conditions.push({
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
        { enquiryType: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return conditions.length === 1 ? conditions[0] : { AND: conditions };
}

export const ENQUIRIES_PAGE_SIZE = 20;

/** Mark read when an admin opens the detail page — no revalidatePath (safe during render). */
export async function markEnquiryReadOnView(id: string, reader: string) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry || enquiry.isDeleted) return null;
  if (enquiry.isRead && enquiry.status !== "NEW") return enquiry;

  const updated = await prisma.enquiry.update({
    where: { id },
    data: {
      isRead: true,
      readAt: enquiry.readAt ?? new Date(),
      readBy: enquiry.readBy ?? reader,
      status: enquiry.status === "NEW" ? "READ" : enquiry.status,
    },
  });

  if (!enquiry.isRead) {
    await createAuditLog({
      action: "ENQUIRY_READ",
      module: "Enquiries",
      recordName: getEnquiryDisplayName(updated),
      recordId: updated.id,
      summary: `${reader} opened enquiry from ${getEnquiryDisplayName(updated)}`,
    });
  }

  return updated;
}

export async function loadEnquiriesList(params: {
  filter: EnquiryListFilter;
  search: string;
  page: number;
}) {
  const where = buildEnquiryWhere(params.filter, params.search);
  const page = Math.max(1, params.page);

  const [enquiries, total, unreadCount] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ENQUIRIES_PAGE_SIZE,
      take: ENQUIRIES_PAGE_SIZE,
    }),
    prisma.enquiry.count({ where }),
    prisma.enquiry.count({ where: unreadEnquiryWhere() }),
  ]);

  return { enquiries, total, unreadCount, page };
}

export async function getUnreadEnquiryCount(): Promise<number> {
  return getUnreadEnquiryCountCached();
}

const getUnreadEnquiryCountCrossRequest = unstable_cache(
  async (): Promise<number> => {
    try {
      return await timed("getUnreadEnquiryCount", () =>
        prisma.enquiry.count({ where: unreadEnquiryWhere() })
      );
    } catch (error) {
      console.error("Failed to load unread enquiry count:", error);
      return 0;
    }
  },
  ["unread-enquiry-count"],
  { tags: [CACHE_TAGS.unreadEnquiries], revalidate: 30 }
);

const getUnreadEnquiryCountCached = cache(async (): Promise<number> => {
  return getUnreadEnquiryCountCrossRequest();
});
