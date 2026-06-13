import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type AuditWriteParams = {
  actorId?: string | null;
  actingForId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
};

export function getClientIp(headers: Headers | Record<string, unknown>): string | undefined {
  const get = (key: string) => {
    if (headers instanceof Headers) return headers.get(key) ?? undefined;
    const value = headers[key] ?? headers[key.toLowerCase()];
    return typeof value === "string" ? value : undefined;
  };

  const forwarded = get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return get("x-real-ip");
}

export function getUserAgent(headers: Headers | Record<string, unknown>): string | undefined {
  if (headers instanceof Headers) return headers.get("user-agent") ?? undefined;
  const value = headers["user-agent"] ?? headers["User-Agent"];
  return typeof value === "string" ? value : undefined;
}

/** Direct audit write for auth events and manual actions (bypasses Prisma extension recursion). */
export async function writeAuditLog(params: AuditWriteParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        actingForId: params.actingForId ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        before: params.before ?? undefined,
        after: params.after ?? undefined,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] writeAuditLog failed:", error);
  }
}
