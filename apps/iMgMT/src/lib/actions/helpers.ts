import { headers } from "next/headers";
import { requireSession } from "@/lib/auth";
import { getClientIp, getUserAgent } from "@/lib/audit";
import { setAuditContext, clearAuditContext } from "@/lib/audit-extension";
import { AuthorizationError, requirePermission, type Permission } from "@/lib/rbac";

export async function withAuditContext<T>(fn: () => Promise<T>): Promise<T> {
  const session = await requireSession();
  const headerList = await headers();
  setAuditContext({
    actorId: session.user.id,
    ip: getClientIp(headerList),
    userAgent: getUserAgent(headerList),
  });
  try {
    return await fn();
  } finally {
    clearAuditContext();
  }
}

export async function requireSessionPermission(permission: Permission) {
  const session = await requireSession();
  requirePermission(session.user.role, permission);
  return session;
}

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function actionError<T = void>(message: string): ActionResult<T> {
  return { ok: false, error: message };
}

export function actionOk<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function catchActionError<T = void>(error: unknown): ActionResult<T> {
  if (error instanceof AuthorizationError) {
    return actionError(error.message);
  }
  if (error instanceof Error) {
    return actionError(error.message);
  }
  return actionError("An unexpected error occurred");
}
