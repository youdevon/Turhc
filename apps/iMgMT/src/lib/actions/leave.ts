"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { currentYear } from "@/lib/format";
import { calculateLeaveDays } from "@/lib/leave/calculator";
import { getHolidayDateSet } from "@/lib/leave/holidays";
import { availableBalance } from "@/lib/leave/balance-math";
import { getOrCreateLeaveBalance } from "@/lib/leave/balances";
import { resolveApprovalChainFromLines, isReportingLineActive } from "@/lib/leave/approval-chain";
import { canActorActionAnyPendingStep } from "@/lib/leave/actor-resolution";
import { setAuditContext } from "@/lib/audit-extension";
import {
  actionError,
  actionOk,
  catchActionError,
  requireSessionPermission,
  withAuditContext,
  type ActionResult,
} from "./helpers";
import { requireSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

export async function previewLeaveDays(startDate: string, endDate: string) {
  const holidays = await getHolidayDateSet();
  return calculateLeaveDays(startDate, endDate, holidays);
}

export async function getMyLeaveBalances(userId?: string) {
  const session = await requireSession();
  const targetId = userId ?? session.user.id;

  if (targetId !== session.user.id && !hasPermission(session.user.role, "leave.view.all")) {
    throw new Error("Forbidden");
  }

  const year = currentYear();
  return prisma.leaveBalance.findMany({
    where: { userId: targetId, year },
    include: { leaveType: true },
    orderBy: { leaveType: { name: "asc" } },
  });
}

export async function adjustBalance(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSessionPermission("balances.adjust");
    const userId = formData.get("userId") as string;
    const leaveTypeId = formData.get("leaveTypeId") as string;
    const adjustment = parseFloat(formData.get("adjustment") as string);
    const reason = (formData.get("reason") as string)?.trim();
    const year = parseInt(formData.get("year") as string, 10) || currentYear();

    if (!userId || !leaveTypeId || Number.isNaN(adjustment) || !reason) {
      return actionError("User, leave type, adjustment amount, and reason are required");
    }

    await withAuditContext(async () => {
      const balance = await getOrCreateLeaveBalance(userId, leaveTypeId, year);
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { adjusted: { increment: adjustment } },
      });
      await writeAuditLog({
        actorId: session.user.id,
        action: "BALANCE.ADJUST",
        entityType: "LeaveBalance",
        entityId: balance.id,
        after: { userId, leaveTypeId, year, adjustment, reason },
      });
    });

    revalidatePath("/leave/balances");
    revalidatePath("/leave");
    return actionOk();
  } catch (error) {
    return catchActionError(error);
  }
}

export async function submitLeaveRequest(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSessionPermission("leave.submit");
    const leaveTypeId = formData.get("leaveTypeId") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const reason = (formData.get("reason") as string)?.trim() || null;

    if (!leaveTypeId || !startDateStr || !endDateStr) {
      return actionError("Leave type, start date, and end date are required");
    }

    const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
    if (!leaveType?.active) return actionError("Invalid leave type");

    const holidays = await getHolidayDateSet();
    const breakdown = calculateLeaveDays(startDateStr, endDateStr, holidays);
    const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
    const endDate = new Date(`${endDateStr}T00:00:00.000Z`);

    const certificateRequired =
      leaveType.requiresCertificateAfterDays != null &&
      breakdown.totalDays > leaveType.requiresCertificateAfterDays;

    const reportingLines = await prisma.reportingLine.findMany({
      where: { employeeId: session.user.id },
    });
    const activeLines = reportingLines.filter((line) => isReportingLineActive(line, startDate));
    const chain = resolveApprovalChainFromLines(activeLines);

    if (chain.length === 0) {
      return actionError("No approval chain configured. Contact HR to set up reporting lines.");
    }

    const year = startDate.getUTCFullYear();

    if (leaveType.drawsFromBalance) {
      const balance = await getOrCreateLeaveBalance(session.user.id, leaveTypeId, year);
      const available = availableBalance(balance);
      if (breakdown.totalDays > available) {
        return actionError(`Insufficient balance. Available: ${available}, requested: ${breakdown.totalDays}`);
      }
    }

    const result = await withAuditContext(async () => {
      return prisma.$transaction(async (tx) => {
        const request = await tx.leaveRequest.create({
          data: {
            userId: session.user.id,
            leaveTypeId,
            startDate,
            endDate,
            calculatedDays: breakdown.totalDays,
            reason,
            status: "PENDING",
            certificateRequired,
            certificateOutstanding: certificateRequired,
          },
        });

        for (const level of chain) {
          for (const authorityId of level.authorityIds) {
            await tx.approvalStep.create({
              data: {
                leaveRequestId: request.id,
                level: level.level,
                assignedAuthorityId: authorityId,
                status: "PENDING",
              },
            });
          }
        }

        if (leaveType.drawsFromBalance) {
          const balance = await tx.leaveBalance.findUnique({
            where: {
              userId_leaveTypeId_year: {
                userId: session.user.id,
                leaveTypeId,
                year,
              },
            },
          });
          if (balance) {
            await tx.leaveBalance.update({
              where: { id: balance.id },
              data: { pending: { increment: breakdown.totalDays } },
            });
          }
        }

        return request;
      });
    });

    revalidatePath("/leave");
    revalidatePath("/approvals");
    return actionOk({ id: result.id });
  } catch (error) {
    return catchActionError(error);
  }
}

export async function cancelLeaveRequest(requestId: string): Promise<ActionResult> {
  try {
    const session = await requireSessionPermission("leave.submit");
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true },
    });

    if (!request) return actionError("Leave request not found");
    if (request.userId !== session.user.id && !hasPermission(session.user.role, "leave.view.all")) {
      return actionError("Forbidden");
    }
    if (request.status === "CANCELLED" || request.status === "REJECTED") {
      return actionError("Request is already closed");
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (request.status === "APPROVED" && request.startDate.getTime() <= today.getTime()) {
      return actionError("Approved leave that has started must be recalled by HR");
    }

    await withAuditContext(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.leaveRequest.update({
          where: { id: requestId },
          data: { status: "CANCELLED", decidedAt: new Date() },
        });

        await tx.approvalStep.updateMany({
          where: { leaveRequestId: requestId, status: "PENDING" },
          data: { status: "SKIPPED" },
        });

        if (request.leaveType.drawsFromBalance) {
          const year = request.startDate.getUTCFullYear();
          const balance = await tx.leaveBalance.findUnique({
            where: {
              userId_leaveTypeId_year: {
                userId: request.userId,
                leaveTypeId: request.leaveTypeId,
                year,
              },
            },
          });
          if (balance) {
            if (request.status === "APPROVED") {
              await tx.leaveBalance.update({
                where: { id: balance.id },
                data: { used: { decrement: request.calculatedDays } },
              });
            } else if (request.status === "PENDING") {
              await tx.leaveBalance.update({
                where: { id: balance.id },
                data: { pending: { decrement: request.calculatedDays } },
              });
            }
          }
        }
      });
    });

    revalidatePath("/leave");
    revalidatePath("/approvals");
    return actionOk();
  } catch (error) {
    return catchActionError(error);
  }
}

export async function getMyLeaveRequests() {
  const session = await requireSession();
  return prisma.leaveRequest.findMany({
    where: { userId: session.user.id },
    include: {
      leaveType: true,
      approvalSteps: {
        include: {
          assignedAuthority: { select: { firstName: true, lastName: true } },
          actedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ level: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingApprovalsForActor() {
  const session = await requireSessionPermission("leave.approve");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const pendingSteps = await prisma.approvalStep.findMany({
    where: { status: "PENDING" },
    include: {
      leaveRequest: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, departmentId: true } },
          leaveType: true,
        },
      },
      assignedAuthority: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const actionable: typeof pendingSteps = [];

  for (const step of pendingSteps) {
    const priorPending = await prisma.approvalStep.findFirst({
      where: {
        leaveRequestId: step.leaveRequestId,
        level: { lt: step.level },
        status: "PENDING",
      },
    });
    if (priorPending) continue;

    const sameLevelSteps = pendingSteps.filter(
      (s) => s.leaveRequestId === step.leaveRequestId && s.level === step.level
    );
    const authorityIds = sameLevelSteps.map((s) => s.assignedAuthorityId);

    const { canAct } = await canActorActionAnyPendingStep(session.user.id, authorityIds, today);
    if (canAct) {
      actionable.push(step);
    }
  }

  const seen = new Set<string>();
  return actionable.filter((step) => {
    const key = `${step.leaveRequestId}-${step.level}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function actionApprovalStep(
  stepId: string,
  decision: "approve" | "reject",
  comment?: string
): Promise<ActionResult> {
  try {
    const session = await requireSessionPermission("leave.approve");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const step = await prisma.approvalStep.findUnique({
      where: { id: stepId },
      include: {
        leaveRequest: { include: { leaveType: true } },
      },
    });

    if (!step || step.status !== "PENDING") {
      return actionError("Approval step not found or already actioned");
    }

    const sameLevelSteps = await prisma.approvalStep.findMany({
      where: {
        leaveRequestId: step.leaveRequestId,
        level: step.level,
        status: "PENDING",
      },
    });

    const authorityIds = sameLevelSteps.map((s) => s.assignedAuthorityId);
    const actorCheck = await canActorActionAnyPendingStep(session.user.id, authorityIds, today);

    if (!actorCheck.canAct || !actorCheck.resolution) {
      return actionError(actorCheck.resolution?.reason ?? "Not authorized to action this step");
    }

    const priorPending = await prisma.approvalStep.findFirst({
      where: {
        leaveRequestId: step.leaveRequestId,
        level: { lt: step.level },
        status: "PENDING",
      },
    });
    if (priorPending) {
      return actionError("Earlier approval levels must be completed first");
    }

    await withAuditContext(async () => {
      if (actorCheck.resolution?.actingForId && actorCheck.resolution.actingForId !== session.user.id) {
        setAuditContext({
          actorId: session.user.id,
          actingForId: actorCheck.resolution.actingForId,
        });
      }

      await prisma.$transaction(async (tx) => {
        const now = new Date();
        const stepStatus = decision === "approve" ? "APPROVED" : "REJECTED";

        await tx.approvalStep.updateMany({
          where: {
            leaveRequestId: step.leaveRequestId,
            level: step.level,
            status: "PENDING",
          },
          data: {
            status: stepStatus,
            actedById: session.user.id,
            actedAt: now,
            comment: comment ?? null,
          },
        });

        if (decision === "reject") {
          await tx.approvalStep.updateMany({
            where: {
              leaveRequestId: step.leaveRequestId,
              level: { gt: step.level },
              status: "PENDING",
            },
            data: { status: "SKIPPED" },
          });

          await tx.leaveRequest.update({
            where: { id: step.leaveRequestId },
            data: { status: "REJECTED", decidedAt: now },
          });

          if (step.leaveRequest.leaveType.drawsFromBalance) {
            const year = step.leaveRequest.startDate.getUTCFullYear();
            const balance = await tx.leaveBalance.findUnique({
              where: {
                userId_leaveTypeId_year: {
                  userId: step.leaveRequest.userId,
                  leaveTypeId: step.leaveRequest.leaveTypeId,
                  year,
                },
              },
            });
            if (balance) {
              await tx.leaveBalance.update({
                where: { id: balance.id },
                data: { pending: { decrement: step.leaveRequest.calculatedDays } },
              });
            }
          }
        } else {
          const nextPending = await tx.approvalStep.findFirst({
            where: {
              leaveRequestId: step.leaveRequestId,
              level: { gt: step.level },
              status: "PENDING",
            },
            orderBy: { level: "asc" },
          });

          if (!nextPending) {
            await tx.leaveRequest.update({
              where: { id: step.leaveRequestId },
              data: { status: "APPROVED", decidedAt: now },
            });

            if (step.leaveRequest.leaveType.drawsFromBalance) {
              const year = step.leaveRequest.startDate.getUTCFullYear();
              const balance = await tx.leaveBalance.findUnique({
                where: {
                  userId_leaveTypeId_year: {
                    userId: step.leaveRequest.userId,
                    leaveTypeId: step.leaveRequest.leaveTypeId,
                    year,
                  },
                },
              });
              if (balance) {
                await tx.leaveBalance.update({
                  where: { id: balance.id },
                  data: {
                    used: { increment: step.leaveRequest.calculatedDays },
                    pending: { decrement: step.leaveRequest.calculatedDays },
                  },
                });
              }
            }
          }
        }
      });

      await writeAuditLog({
        actorId: session.user.id,
        actingForId: actorCheck.resolution?.actingForId,
        action: decision === "approve" ? "LEAVE.APPROVE" : "LEAVE.REJECT",
        entityType: "LeaveRequest",
        entityId: step.leaveRequestId,
        after: { stepId, level: step.level, comment },
      });
    });

    revalidatePath("/approvals");
    revalidatePath("/leave");
    return actionOk();
  } catch (error) {
    return catchActionError(error);
  }
}

export async function listLeaveTypes() {
  return prisma.leaveType.findMany({ where: { active: true }, orderBy: { name: "asc" } });
}

export async function listUsersForBalanceAdjustment() {
  await requireSessionPermission("balances.adjust");
  return prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, employeeNumber: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getAllBalancesForUser(userId: string) {
  await requireSessionPermission("balances.adjust");
  const year = currentYear();
  return prisma.leaveBalance.findMany({
    where: { userId, year },
    include: { leaveType: true },
  });
}
