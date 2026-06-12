"use server";

import { revalidatePath } from "next/cache";
import { revalidateUnreadEnquiries } from "./revalidate-public";
import { EnquiryStatus } from "@prisma/client";
import { prisma } from "./db";
import { auditContentAction, requireAdmin } from "./admin-actions";
import { getEnquiryDisplayName } from "./enquiry-types";
import { getUnreadEnquiryCount } from "./enquiry-service";
import { sendTestEmail } from "./mail";
import { formatShortDate } from "./utils";

async function getActiveEnquiryOrThrow(id: string) {
  const enquiry = await prisma.enquiry.findFirst({
    where: { id, isDeleted: false },
  });
  if (!enquiry) throw new Error("Enquiry not found");
  return enquiry;
}

function revalidateEnquiries(id?: string) {
  revalidateUnreadEnquiries();
  revalidatePath("/admin/enquiries");
  if (id) revalidatePath(`/admin/enquiries/${id}`);
}

export { getUnreadEnquiryCount };

export async function markEnquiryRead(id: string, options?: { auto?: boolean }) {
  const session = await requireAdmin();
  const enquiry = await getActiveEnquiryOrThrow(id);

  if (enquiry.isRead && enquiry.status !== "NEW") {
    return enquiry;
  }

  const reader = session.user.name ?? session.user.email ?? "Admin";
  const updated = await prisma.enquiry.update({
    where: { id },
    data: {
      isRead: true,
      readAt: enquiry.readAt ?? new Date(),
      readBy: enquiry.readBy ?? reader,
      status: enquiry.status === "NEW" ? "READ" : enquiry.status,
    },
  });

  if (!options?.auto) {
    await auditContentAction({
      action: "ENQUIRY_READ",
      module: "Enquiries",
      recordName: getEnquiryDisplayName(updated),
      recordId: updated.id,
      summary: `Marked enquiry from ${getEnquiryDisplayName(updated)} as read`,
    });
  } else if (!enquiry.isRead) {
    await auditContentAction({
      action: "ENQUIRY_READ",
      module: "Enquiries",
      recordName: getEnquiryDisplayName(updated),
      recordId: updated.id,
      summary: `${reader} opened enquiry from ${getEnquiryDisplayName(updated)}`,
    });
  }

  revalidateEnquiries(id);
  return updated;
}

export async function markEnquiryUnread(id: string) {
  await requireAdmin();
  const enquiry = await getActiveEnquiryOrThrow(id);

  const updated = await prisma.enquiry.update({
    where: { id },
    data: {
      isRead: false,
      status: enquiry.status === "ARCHIVED" ? enquiry.status : "NEW",
    },
  });

  await auditContentAction({
    action: "ENQUIRY_UPDATED",
    module: "Enquiries",
    recordName: getEnquiryDisplayName(updated),
    recordId: updated.id,
    summary: `Marked enquiry from ${getEnquiryDisplayName(updated)} as unread`,
  });

  revalidateEnquiries(id);
  return updated;
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus) {
  const session = await requireAdmin();
  const enquiry = await getActiveEnquiryOrThrow(id);
  const reader = session.user.name ?? session.user.email ?? "Admin";

  const updated = await prisma.enquiry.update({
    where: { id },
    data: {
      status,
      isRead: status === "NEW" ? false : true,
      readAt: status === "NEW" ? null : enquiry.readAt ?? new Date(),
      readBy: status === "NEW" ? null : enquiry.readBy ?? reader,
    },
  });

  await auditContentAction({
    action: "ENQUIRY_UPDATED",
    module: "Enquiries",
    recordName: getEnquiryDisplayName(updated),
    recordId: updated.id,
    summary:
      status === "ARCHIVED"
        ? `Archived enquiry from ${getEnquiryDisplayName(updated)}`
        : `Changed enquiry status to ${status.replace("_", " ").toLowerCase()} for ${getEnquiryDisplayName(updated)}`,
    details: { status: { from: enquiry.status, to: status } },
  });

  revalidateEnquiries(id);
  return updated;
}

export async function saveEnquiryInternalNotes(id: string, internalNotes: string) {
  await requireAdmin();
  const enquiry = await getActiveEnquiryOrThrow(id);

  const updated = await prisma.enquiry.update({
    where: { id },
    data: { internalNotes: internalNotes.trim() || null },
  });

  await auditContentAction({
    action: "ENQUIRY_UPDATED",
    module: "Enquiries",
    recordName: getEnquiryDisplayName(updated),
    recordId: updated.id,
    summary: `Updated internal notes for enquiry from ${getEnquiryDisplayName(updated)}`,
  });

  revalidateEnquiries(id);
  return updated;
}

export async function deleteEnquiry(id: string) {
  const session = await requireAdmin();
  if (!id?.trim()) throw new Error("Invalid enquiry");

  const enquiry = await getActiveEnquiryOrThrow(id);
  const actor = session.user.name ?? session.user.email ?? "Admin";
  const name = getEnquiryDisplayName(enquiry);
  const submitted = formatShortDate(enquiry.createdAt);

  await prisma.enquiry.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: actor,
    },
  });

  await auditContentAction({
    action: "ENQUIRY_DELETED",
    module: "Enquiries",
    recordName: name,
    recordId: id,
    summary: `Deleted enquiry from ${name} <${enquiry.email}> submitted on ${submitted}.`,
    details: {
      email: enquiry.email,
      submittedAt: enquiry.createdAt.toISOString(),
      deletedBy: actor,
    },
  });

  revalidateEnquiries(id);
  return { success: true as const };
}

export async function restoreEnquiry(id: string) {
  const session = await requireAdmin();
  if (!id?.trim()) throw new Error("Invalid enquiry");

  const enquiry = await prisma.enquiry.findFirst({
    where: { id, isDeleted: true },
  });
  if (!enquiry) throw new Error("Deleted enquiry not found");

  const actor = session.user.name ?? session.user.email ?? "Admin";
  const name = getEnquiryDisplayName(enquiry);

  const updated = await prisma.enquiry.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  });

  await auditContentAction({
    action: "ENQUIRY_UPDATED",
    module: "Enquiries",
    recordName: name,
    recordId: id,
    summary: `Restored deleted enquiry from ${name} <${enquiry.email}>`,
    details: { restoredBy: actor },
  });

  revalidateEnquiries(id);
  return updated;
}

export async function sendEnquiryTestEmail(recipient: string) {
  await requireAdmin();
  const result = await sendTestEmail(recipient);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result;
}
