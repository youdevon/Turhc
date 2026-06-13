"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseFormDate } from "@/lib/format";
import {
  actionError,
  actionOk,
  catchActionError,
  requireSessionPermission,
  withAuditContext,
  type ActionResult,
} from "./helpers";

export async function createReportingLine(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSessionPermission("org.manage");
    const employeeId = formData.get("employeeId") as string;
    const authorityId = formData.get("authorityId") as string;
    const level = parseInt(formData.get("level") as string, 10);
    const isPrimary = formData.get("isPrimary") === "on" || formData.get("isPrimary") === "true";
    const effectiveFrom = parseFormDate(formData.get("effectiveFrom"));

    if (!employeeId || !authorityId || !effectiveFrom || Number.isNaN(level) || level < 1) {
      return actionError("Employee, authority, level (≥1), and effective from date are required");
    }

    if (employeeId === authorityId) {
      return actionError("Employee and authority cannot be the same person");
    }

    const result = await withAuditContext(async () => {
      return prisma.reportingLine.create({
        data: {
          employeeId,
          authorityId,
          level,
          isPrimary,
          effectiveFrom,
        },
      });
    });

    revalidatePath("/org/reporting-lines");
    revalidatePath("/org/chart");
    return actionOk({ id: result.id });
  } catch (error) {
    return catchActionError(error);
  }
}

export async function closeReportingLine(formData: FormData): Promise<ActionResult> {
  try {
    await requireSessionPermission("org.manage");
    const id = formData.get("id") as string;
    const effectiveTo = parseFormDate(formData.get("effectiveTo"));

    if (!id || !effectiveTo) {
      return actionError("Reporting line id and effective to date are required");
    }

    const line = await prisma.reportingLine.findUnique({ where: { id } });
    if (!line) return actionError("Reporting line not found");
    if (line.effectiveTo) return actionError("Reporting line is already closed");
    if (effectiveTo.getTime() < line.effectiveFrom.getTime()) {
      return actionError("Effective to date must be on or after effective from");
    }

    await withAuditContext(async () => {
      await prisma.reportingLine.update({
        where: { id },
        data: { effectiveTo },
      });
    });

    revalidatePath("/org/reporting-lines");
    revalidatePath("/org/chart");
    return actionOk();
  } catch (error) {
    return catchActionError(error);
  }
}

export async function listReportingLines(includeClosed = false) {
  return prisma.reportingLine.findMany({
    where: includeClosed ? undefined : { effectiveTo: null },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
      authority: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
    },
    orderBy: [{ employee: { lastName: "asc" } }, { level: "asc" }],
  });
}

export async function getOrgChartData() {
  const [users, lines] = await Promise.all([
    prisma.user.findMany({
      where: { status: { in: ["ACTIVE", "ON_LEAVE"] } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.reportingLine.findMany({
      where: { effectiveTo: null },
      select: {
        id: true,
        employeeId: true,
        authorityId: true,
        level: true,
        isPrimary: true,
      },
    }),
  ]);

  return { users, lines };
}
