import type { PrismaClient } from "@prisma/client";

export type AuditContext = {
  actorId?: string | null;
  actingForId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

const AUDIT_SKIP_MODELS = new Set(["AuditLog", "EmailJob"]);

const globalAuditContext = globalThis as unknown as {
  imgmtAuditContext?: AuditContext;
};

export function setAuditContext(context: AuditContext) {
  globalAuditContext.imgmtAuditContext = context;
}

export function clearAuditContext() {
  globalAuditContext.imgmtAuditContext = undefined;
}

export function getAuditContext(): AuditContext {
  return globalAuditContext.imgmtAuditContext ?? {};
}

export function createAuditExtension(baseClient: PrismaClient) {
  return {
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model: string;
          operation: string;
          args: unknown;
          query: (args: unknown) => Promise<unknown>;
        }) {
          const isWrite = ["create", "update", "delete", "createMany", "updateMany", "deleteMany", "upsert"].includes(
            operation
          );

          if (!isWrite || AUDIT_SKIP_MODELS.has(model)) {
            return query(args);
          }

          let before: unknown = null;
          const entityId = extractEntityId(args, operation);

          if (operation === "update" || operation === "delete" || operation === "upsert") {
            before = await readBeforeState(baseClient, model, args, operation);
          }

          const result = await query(args);
          const ctx = getAuditContext();

          const action = `${model.toUpperCase()}.${operation.toUpperCase()}`;
          const after = operation === "delete" || operation === "deleteMany" ? null : result;

          try {
            await baseClient.auditLog.create({
              data: {
                actorId: ctx.actorId ?? null,
                actingForId: ctx.actingForId ?? null,
                action,
                entityType: model,
                entityId: entityId ?? extractIdFromResult(result),
                before: before ? (before as object) : undefined,
                after: after ? (after as object) : undefined,
                ip: ctx.ip ?? null,
                userAgent: ctx.userAgent ?? null,
              },
            });
          } catch (error) {
            console.error("[audit] Failed to write audit log:", error);
          }

          return result;
        },
      },
    },
  };
}

function extractEntityId(args: unknown, operation: string): string | null {
  if (!args || typeof args !== "object") return null;
  const record = args as Record<string, unknown>;

  if (typeof record.id === "string") return record.id;

  const where = record.where as Record<string, unknown> | undefined;
  if (where && typeof where.id === "string") return where.id;

  if (operation === "create" && record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;
    if (typeof data.id === "string") return data.id;
  }

  return null;
}

function extractIdFromResult(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const id = (result as Record<string, unknown>).id;
  return typeof id === "string" ? id : null;
}

async function readBeforeState(
  client: PrismaClient,
  model: string,
  args: unknown,
  operation: string
): Promise<unknown> {
  const delegate = (client as unknown as Record<string, unknown>)[lowerFirst(model)] as
    | { findUnique: (args: unknown) => Promise<unknown> }
    | undefined;

  if (!delegate?.findUnique) return null;

  const record = args as Record<string, unknown>;
  const where = record.where as Record<string, unknown> | undefined;
  if (!where?.id) return null;

  if (operation === "upsert") {
    return delegate.findUnique({ where: { id: where.id } });
  }

  return delegate.findUnique({ where });
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
