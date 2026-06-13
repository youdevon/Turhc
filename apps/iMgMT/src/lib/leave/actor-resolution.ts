import { prisma } from "@/lib/db";
import { isReportingLineActive } from "./approval-chain";

export type ActorResolution = {
  canAct: boolean;
  actingForId?: string;
  escalated?: boolean;
  reason?: string;
};

export async function isUserOnApprovedLeave(userId: string, date: Date): Promise<boolean> {
  const leave = await prisma.leaveRequest.findFirst({
    where: {
      userId,
      status: "APPROVED",
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: { id: true },
  });
  return Boolean(leave);
}

export async function findActiveDelegate(delegatorId: string, date: Date): Promise<string | null> {
  const delegation = await prisma.delegation.findFirst({
    where: {
      delegatorId,
      startDate: { lte: date },
      endDate: { gte: date },
    },
    orderBy: { createdAt: "desc" },
    select: { delegateId: true },
  });
  return delegation?.delegateId ?? null;
}

export async function findPrimaryEscalationAuthority(
  authorityId: string,
  asOf: Date
): Promise<string | null> {
  const lines = await prisma.reportingLine.findMany({
    where: {
      employeeId: authorityId,
      level: 1,
      isPrimary: true,
    },
    select: { authorityId: true, effectiveFrom: true, effectiveTo: true },
  });

  const active = lines.find((line) => isReportingLineActive(line, asOf));
  return active?.authorityId ?? null;
}

/**
 * Determine whether actorId may action a step assigned to assignedAuthorityId.
 * Resolution order: assigned authority → active delegate → level-1 primary escalation.
 */
export async function resolveActorForStep(
  assignedAuthorityId: string,
  actorId: string,
  asOf: Date = new Date()
): Promise<ActorResolution> {
  if (actorId === assignedAuthorityId) {
    const onLeave = await isUserOnApprovedLeave(assignedAuthorityId, asOf);
    if (!onLeave) {
      return { canAct: true, actingForId: assignedAuthorityId };
    }
    return { canAct: false, reason: "Assigned authority is on approved leave" };
  }

  const delegateId = await findActiveDelegate(assignedAuthorityId, asOf);
  if (delegateId === actorId) {
    return { canAct: true, actingForId: assignedAuthorityId };
  }

  const escalationId = await findPrimaryEscalationAuthority(assignedAuthorityId, asOf);
  if (escalationId === actorId) {
    const onLeave = await isUserOnApprovedLeave(assignedAuthorityId, asOf);
    const activeDelegate = await findActiveDelegate(assignedAuthorityId, asOf);
    if (onLeave && !activeDelegate) {
      return { canAct: true, actingForId: assignedAuthorityId, escalated: true };
    }
  }

  return { canAct: false, reason: "You are not authorized to action this step" };
}

export async function canActorActionAnyPendingStep(
  actorId: string,
  assignedAuthorityIds: string[],
  asOf: Date = new Date()
): Promise<{ canAct: boolean; assignedAuthorityId?: string; resolution?: ActorResolution }> {
  for (const authorityId of assignedAuthorityIds) {
    const resolution = await resolveActorForStep(authorityId, actorId, asOf);
    if (resolution.canAct) {
      return { canAct: true, assignedAuthorityId: authorityId, resolution };
    }
  }
  return { canAct: false };
}
