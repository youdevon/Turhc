import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { AUDIT_LOG_PAGE_SIZE } from "./admin-list";
import { AUDIT_CATEGORIES, HUMAN_AUDIT_ACTIONS } from "./audit-helpers";

export type AuditLogFilters = {
  page?: number;
  q?: string;
  action?: string;
  actor?: string;
  targetType?: string;
  category?: string;
  outcome?: string;
  from?: string;
  to?: string;
};

function parsePage(value?: number) {
  return Number.isFinite(value) && (value as number) > 0 ? (value as number) : 1;
}

function buildWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  const and: Prisma.AuditLogWhereInput[] = [];

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { actorName: { contains: q, mode: "insensitive" } },
        { actorEmail: { contains: q, mode: "insensitive" } },
        { targetName: { contains: q, mode: "insensitive" } },
        { recordName: { contains: q, mode: "insensitive" } },
        { targetType: { contains: q, mode: "insensitive" } },
        { module: { contains: q, mode: "insensitive" } },
        { displayAction: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (filters.action?.trim()) {
    and.push({
      OR: [
        { displayAction: filters.action.trim() },
        { action: filters.action.trim() as never },
      ],
    });
  }

  if (filters.actor?.trim()) {
    const actor = filters.actor.trim();
    and.push({
      OR: [
        { actorName: { contains: actor, mode: "insensitive" } },
        { actorEmail: { contains: actor, mode: "insensitive" } },
      ],
    });
  }

  if (filters.targetType?.trim()) {
    const targetType = filters.targetType.trim();
    and.push({
      OR: [
        { targetType: { equals: targetType, mode: "insensitive" } },
        { module: { equals: targetType, mode: "insensitive" } },
      ],
    });
  }

  if (filters.outcome?.trim()) {
    where.outcome = filters.outcome.trim();
  }

  if (filters.category?.trim()) {
    where.category = filters.category.trim();
  }

  if (filters.from || filters.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.from) {
      const fromDate = new Date(filters.from);
      if (!Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate;
    }
    if (filters.to) {
      const toDate = new Date(filters.to);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        createdAt.lte = toDate;
      }
    }
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;
  }

  if (and.length > 0) where.AND = and;
  return where;
}

export async function queryAuditLogs(filters: AuditLogFilters) {
  const page = parsePage(filters.page);
  const where = buildWhere(filters);
  const skip = (page - 1) * AUDIT_LOG_PAGE_SIZE;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: AUDIT_LOG_PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        actorName: true,
        actorEmail: true,
        actorRole: true,
        action: true,
        displayAction: true,
        category: true,
        module: true,
        recordName: true,
        recordId: true,
        targetType: true,
        targetName: true,
        changes: true,
        ipAddress: true,
        userAgent: true,
        sessionId: true,
        requestId: true,
        httpMethod: true,
        route: true,
        actingOnBehalfOf: true,
        businessContext: true,
        outcome: true,
        failReason: true,
        details: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / AUDIT_LOG_PAGE_SIZE)),
    pageSize: AUDIT_LOG_PAGE_SIZE,
    actionOptions: HUMAN_AUDIT_ACTIONS,
    categoryOptions: [...AUDIT_CATEGORIES],
  };
}
