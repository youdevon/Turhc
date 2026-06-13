import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "./db";
import {
  buildAuditSummary,
  getAuditCategory,
  type AuditChangeMap,
  type AuditCategory,
  type HumanAuditAction,
} from "./audit-helpers";

export type { AuditChangeMap, HumanAuditAction } from "./audit-helpers";

export type AuditActor = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  userId?: string | null;
};

export type AuditTarget = {
  type?: string | null;
  name?: string | null;
  id?: string | null;
};

type RequestLike =
  | { headers: Headers }
  | { headers: Record<string, string | string[] | undefined> };

export type AuditRequestContext = {
  sessionId?: string | null;
  requestId?: string | null;
  httpMethod?: string | null;
  route?: string | null;
  actingOnBehalfOf?: string | null;
  businessContext?: string | null;
};

export type LogAuditParams = {
  actor?: AuditActor;
  action: HumanAuditAction;
  target?: AuditTarget | null;
  changes?: AuditChangeMap | null;
  outcome?: "Success" | "Failed";
  failReason?: string | null;
  request?: RequestLike;
  ipAddress?: string | null;
  userAgent?: string | null;
  legacyAction?: AuditAction;
  summary?: string;
  details?: Record<string, unknown> | null;
  category?: AuditCategory | null;
  context?: AuditRequestContext | null;
};

export type AuditParams = {
  userId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: AuditAction;
  module: string;
  recordName: string;
  recordId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  summary?: string;
  details?: Record<string, unknown> | null;
  changes?: AuditChangeMap | null;
  outcome?: "Success" | "Failed";
  failReason?: string | null;
  displayAction?: HumanAuditAction | null;
  targetType?: string | null;
  targetName?: string | null;
  category?: AuditCategory | null;
  context?: AuditRequestContext | null;
};

const SYSTEM_ACTOR = {
  name: "System",
  email: "system",
  role: "System",
} as const;

const IGNORED_CHANGE_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "passwordHash",
  "resetToken",
  "sessionToken",
  "verificationToken",
  "authSecret",
  "token",
  "accessToken",
  "refreshToken",
  "draftData",
  "settingsJson",
]);

const SENSITIVE_FIELDS = new Set([
  "password",
  "passwordHash",
  "resetToken",
  "sessionToken",
  "verificationToken",
  "authSecret",
  "token",
  "accessToken",
  "refreshToken",
  "newPassword",
  "confirmPassword",
]);

const HUMAN_TO_ENUM: Record<HumanAuditAction, AuditAction> = {
  Created: "CONTENT_CREATED",
  Updated: "CONTENT_UPDATED",
  Deleted: "CONTENT_DELETED",
  "Logged In": "LOGIN",
  "Login Failed": "LOGIN_FAILED",
  "Logged Out": "LOGOUT",
  Exported: "EXPORTED",
  Approved: "APPROVED",
  Rejected: "REJECTED",
  Viewed: "VIEWED",
  "Password Reset": "PASSWORD_RESET",
  "Permission Changed": "PERMISSION_CHANGED",
};

const ENUM_TO_HUMAN: Partial<Record<AuditAction, HumanAuditAction>> = {
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

function resolveActor(actor?: AuditActor) {
  return {
    userId: actor?.userId ?? null,
    name: actor?.name?.trim() || SYSTEM_ACTOR.name,
    email: actor?.email?.trim() || SYSTEM_ACTOR.email,
    role: actor?.role?.trim() || SYSTEM_ACTOR.role,
  };
}

function humanActionFromEnum(action: AuditAction): HumanAuditAction {
  return ENUM_TO_HUMAN[action] ?? "Updated";
}

function enumFromHuman(action: HumanAuditAction): AuditAction {
  return HUMAN_TO_ENUM[action];
}

function formatChangeValue(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) {
    return value.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed === "DRAFT") return "Draft";
    if (trimmed === "PUBLISHED") return "Published";
    if (trimmed === "ARCHIVED") return "Archived";
    if (trimmed === "ACTIVE") return "Active";
    if (trimmed === "INACTIVE") return "Inactive";
    if (trimmed.length > 240) return `${trimmed.slice(0, 237)}…`;
    return trimmed;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.map((item) => formatChangeValue(item)).join(", ");
  }
  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value);
      return json.length > 240 ? `${json.slice(0, 237)}…` : json;
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function isSensitiveField(field: string, extra?: Set<string>) {
  const key = field.toLowerCase();
  return SENSITIVE_FIELDS.has(field) || SENSITIVE_FIELDS.has(key) || extra?.has(field) === true;
}

export function buildChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  options?: { sensitiveFields?: string[]; includeFields?: string[] }
): AuditChangeMap {
  const sensitive = new Set(options?.sensitiveFields ?? []);
  const include = options?.includeFields ? new Set(options.includeFields) : null;
  const changes: AuditChangeMap = {};

  const keys = new Set<string>([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  for (const key of keys) {
    if (IGNORED_CHANGE_FIELDS.has(key)) continue;
    if (include && !include.has(key)) continue;

    const fromRaw = before?.[key];
    const toRaw = after?.[key];

    if (isSensitiveField(key, sensitive)) {
      if (fromRaw === toRaw) continue;
      changes[key] = { from: "[changed]", to: "[changed]" };
      continue;
    }

    const from = formatChangeValue(fromRaw);
    const to = formatChangeValue(toRaw);
    if (from === to) continue;
    changes[key] = { from, to };
  }

  return changes;
}

export function buildCreateChanges(
  record: Record<string, unknown>,
  fields: string[]
): AuditChangeMap {
  const changes: AuditChangeMap = {};
  for (const field of fields) {
    if (IGNORED_CHANGE_FIELDS.has(field) || isSensitiveField(field)) continue;
    const to = formatChangeValue(record[field]);
    if (to === null) continue;
    changes[field] = { from: null, to };
  }
  return changes;
}

export function buildDeleteChanges(
  record: Record<string, unknown>,
  fields: string[]
): AuditChangeMap {
  const changes: AuditChangeMap = {};
  for (const field of fields) {
    if (IGNORED_CHANGE_FIELDS.has(field) || isSensitiveField(field)) continue;
    const from = formatChangeValue(record[field]);
    if (from === null) continue;
    changes[field] = { from, to: null };
  }
  return changes;
}

function legacyChangesToMap(details?: Record<string, unknown> | null): AuditChangeMap | null {
  if (!details) return null;

  if (details.changes && typeof details.changes === "object" && !Array.isArray(details.changes)) {
    return details.changes as AuditChangeMap;
  }

  if (Array.isArray(details.changes)) {
    const map: AuditChangeMap = {};
    details.changes.forEach((entry, index) => {
      if (typeof entry !== "string" || !entry.trim()) return;
      const parts = entry.split(":");
      const label = parts[0]?.trim() || `Change ${index + 1}`;
      const rest = parts.slice(1).join(":").trim();
      const arrowSplit = rest.split("→").map((part) => part.trim());
      if (arrowSplit.length === 2) {
        map[label] = { from: arrowSplit[0] || null, to: arrowSplit[1] || null };
      } else {
        map[label] = { from: null, to: rest || entry };
      }
    });
    return Object.keys(map).length > 0 ? map : null;
  }

  if (details.status && typeof details.status === "object") {
    const status = details.status as { from?: unknown; to?: unknown };
    return {
      status: {
        from: formatChangeValue(status.from),
        to: formatChangeValue(status.to),
      },
    };
  }

  return null;
}

export function getClientIp(
  headers: Headers | Record<string, string | string[] | undefined>
): string | null {
  const read = (key: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(key);
    }
    const value = headers[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  const forwarded = read("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return read("x-real-ip");
}

export function getUserAgent(
  headers: Headers | Record<string, string | string[] | undefined>
): string | null {
  if (headers instanceof Headers) {
    return headers.get("user-agent");
  }
  const value = headers["user-agent"];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getRequestId(
  headers: Headers | Record<string, string | string[] | undefined>
): string | null {
  const read = (key: string): string | null => {
    if (headers instanceof Headers) return headers.get(key);
    const value = headers[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  return read("x-request-id") ?? read("x-correlation-id");
}

function resolveRequestContext(
  params: {
    request?: RequestLike;
    context?: AuditRequestContext | null;
  }
): AuditRequestContext {
  const headers = params.request?.headers;
  return {
    sessionId: params.context?.sessionId ?? null,
    requestId:
      params.context?.requestId ??
      (headers
        ? getRequestId(headers as Headers | Record<string, string | string[] | undefined>)
        : null),
    httpMethod: params.context?.httpMethod ?? null,
    route: params.context?.route ?? null,
    actingOnBehalfOf: params.context?.actingOnBehalfOf ?? null,
    businessContext: params.context?.businessContext ?? null,
  };
}

function resolveCategory(
  action: AuditAction,
  explicit: AuditCategory | null | undefined,
  module: string,
  actorEmail: string | null
): AuditCategory {
  if (explicit) return explicit;
  return getAuditCategory({ action, category: null, module, actorEmail });
}

export async function logAudit(params: LogAuditParams) {
  try {
    const actor = resolveActor(params.actor);
    const enumAction = params.legacyAction ?? enumFromHuman(params.action);
    const targetType = params.target?.type ?? null;
    const targetName = params.target?.name ?? null;
    const auditModule = targetType ?? "System";
    const recordName = targetName ?? actor.name;

    const ipAddress =
      params.ipAddress ??
      (params.request
        ? getClientIp(params.request.headers as Headers | Record<string, string | string[] | undefined>)
        : null);
    const userAgent =
      params.userAgent ??
      (params.request
        ? getUserAgent(params.request.headers as Headers | Record<string, string | string[] | undefined>)
        : null);

    const summary =
      params.summary ??
      buildAuditSummary(enumAction, auditModule, recordName, {
        displayAction: params.action,
      });

    const requestContext = resolveRequestContext(params);
    const category = resolveCategory(enumAction, params.category, auditModule, actor.email);

    const detailsPayload = {
      ...(params.details ?? {}),
      summary,
      requestId: requestContext.requestId,
      httpMethod: requestContext.httpMethod,
      route: requestContext.route,
      actingOnBehalfOf: requestContext.actingOnBehalfOf,
      businessContext: requestContext.businessContext,
    };

    await prisma.auditLog.create({
      data: {
        userId: actor.userId,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: enumAction,
        displayAction: params.action,
        category,
        module: auditModule,
        recordName,
        recordId: params.target?.id ?? null,
        targetType,
        targetName,
        changes: (params.changes ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress,
        userAgent,
        sessionId: requestContext.sessionId,
        requestId: requestContext.requestId,
        httpMethod: requestContext.httpMethod,
        route: requestContext.route,
        actingOnBehalfOf: requestContext.actingOnBehalfOf,
        businessContext: requestContext.businessContext,
        outcome: params.outcome ?? "Success",
        failReason: params.failReason ?? null,
        details: JSON.stringify(detailsPayload),
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export async function createAuditLog(params: AuditParams) {
  try {
    const displayAction = params.displayAction ?? humanActionFromEnum(params.action);
    const targetType = params.targetType ?? params.module;
    const targetName = params.targetName ?? params.recordName;
    const changes =
      params.changes ??
      legacyChangesToMap(params.details) ??
      null;

    const actor = resolveActor({
      userId: params.userId,
      name: params.actorName,
      email: params.actorEmail,
      role: params.actorRole,
    });

    const summary =
      params.summary ??
      buildAuditSummary(params.action, params.module, params.recordName, {
        displayAction,
      });

    const requestContext = resolveRequestContext(params);
    const category = resolveCategory(
      params.action,
      params.category,
      params.module,
      actor.email
    );

    const detailsPayload = {
      ...params.details,
      summary: params.summary ?? params.details?.summary ?? summary,
      requestId: requestContext.requestId,
      httpMethod: requestContext.httpMethod,
      route: requestContext.route,
      actingOnBehalfOf: requestContext.actingOnBehalfOf,
      businessContext: requestContext.businessContext,
    };

    await prisma.auditLog.create({
      data: {
        userId: actor.userId,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: params.action,
        displayAction,
        category,
        module: params.module,
        recordName: params.recordName,
        recordId: params.recordId ?? null,
        targetType,
        targetName,
        changes: (changes ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        sessionId: requestContext.sessionId,
        requestId: requestContext.requestId,
        httpMethod: requestContext.httpMethod,
        route: requestContext.route,
        actingOnBehalfOf: requestContext.actingOnBehalfOf,
        businessContext: requestContext.businessContext,
        outcome: params.outcome ?? "Success",
        failReason: params.failReason ?? null,
        details: JSON.stringify(detailsPayload),
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
