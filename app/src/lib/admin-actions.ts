"use server";

import { getServerSession } from "next-auth";
import { revalidatePublicSite } from "./revalidate-public";
import { headers } from "next/headers";
import { authOptions } from "./auth";
import { createAuditLog, getClientIp, getUserAgent, logAudit } from "./audit";
import type { AuditChangeMap } from "./audit";
import { AuditAction } from "@prisma/client";
import { formatAdminRole } from "./admin-greeting";
import type { HumanAuditAction } from "./audit-helpers";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

function enumToHumanAction(action: AuditAction): HumanAuditAction {
  const map: Partial<Record<AuditAction, HumanAuditAction>> = {
    LOGIN: "Logged In",
    LOGIN_FAILED: "Login Failed",
    LOGOUT: "Logged Out",
    CONTENT_CREATED: "Created",
    CONTENT_UPDATED: "Updated",
    CONTENT_PUBLISHED: "Approved",
    CONTENT_UNPUBLISHED: "Updated",
    CONTENT_ARCHIVED: "Updated",
    CONTENT_DELETED: "Deleted",
    DRAFT_SAVED: "Updated",
    DRAFT_DISCARDED: "Updated",
    FILE_UPLOADED: "Created",
    SETTINGS_CHANGED: "Updated",
    USER_CREATED: "Created",
    USER_UPDATED: "Updated",
    USER_DEACTIVATED: "Updated",
    USER_DELETED: "Deleted",
    ENQUIRY_CREATED: "Created",
    ENQUIRY_READ: "Viewed",
    ENQUIRY_UPDATED: "Updated",
    ENQUIRY_DELETED: "Deleted",
    PASSWORD_RESET: "Password Reset",
    PERMISSION_CHANGED: "Permission Changed",
    VIEWED: "Viewed",
    EXPORTED: "Exported",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return map[action] ?? "Updated";
}

export async function auditContentAction(params: {
  action: AuditAction;
  module: string;
  recordName: string;
  recordId?: string;
  summary?: string;
  details?: Record<string, unknown>;
  changes?: AuditChangeMap | null;
  outcome?: "Success" | "Failed";
  failReason?: string | null;
  targetType?: string;
  targetName?: string;
  displayAction?: HumanAuditAction;
}) {
  const session = await requireAdmin();
  const hdrs = await headers();
  const displayAction = params.displayAction ?? enumToHumanAction(params.action);

  await createAuditLog({
    userId: session.user.id,
    actorName: session.user.name ?? null,
    actorEmail: session.user.email ?? null,
    actorRole: formatAdminRole(session.user.role),
    action: params.action,
    displayAction,
    module: params.module,
    recordName: params.recordName,
    recordId: params.recordId,
    targetType: params.targetType ?? params.module,
    targetName: params.targetName ?? params.recordName,
    ipAddress: getClientIp(hdrs),
    userAgent: getUserAgent(hdrs),
    summary: params.summary,
    details: params.details,
    changes: params.changes,
    outcome: params.outcome ?? "Success",
    failReason: params.failReason ?? null,
  });
}

export async function auditFailedAction(params: {
  action: HumanAuditAction;
  target?: { type?: string; name?: string; id?: string };
  failReason: string;
  legacyAction?: AuditAction;
}) {
  const session = await getServerSession(authOptions);
  const hdrs = await headers();

  await logAudit({
    actor: session?.user
      ? {
          userId: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: formatAdminRole(session.user.role),
        }
      : undefined,
    action: params.action,
    legacyAction: params.legacyAction,
    target: params.target,
    outcome: "Failed",
    failReason: params.failReason,
    request: { headers: hdrs },
  });
}

export async function revalidatePublic() {
  await revalidatePublicSite();
}
