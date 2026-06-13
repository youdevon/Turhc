import { prisma } from "@/lib/db";
import { currentYear } from "@/lib/format";

export { availableBalance } from "./balance-math";

export async function getOrCreateLeaveBalance(userId: string, leaveTypeId: string, year = currentYear()) {
  const existing = await prisma.leaveBalance.findUnique({
    where: { userId_leaveTypeId_year: { userId, leaveTypeId, year } },
  });
  if (existing) return existing;

  const leaveType = await prisma.leaveType.findUniqueOrThrow({ where: { id: leaveTypeId } });

  return prisma.leaveBalance.create({
    data: {
      userId,
      leaveTypeId,
      year,
      entitled: leaveType.defaultEntitlement ?? 0,
    },
  });
}

export async function adjustLeaveBalancePending(
  userId: string,
  leaveTypeId: string,
  delta: number,
  year = currentYear()
) {
  const balance = await getOrCreateLeaveBalance(userId, leaveTypeId, year);
  return prisma.leaveBalance.update({
    where: { id: balance.id },
    data: { pending: { increment: delta } },
  });
}

export async function finalizeLeaveBalanceOnApproval(
  userId: string,
  leaveTypeId: string,
  days: number,
  year = currentYear()
) {
  const balance = await getOrCreateLeaveBalance(userId, leaveTypeId, year);
  return prisma.leaveBalance.update({
    where: { id: balance.id },
    data: {
      used: { increment: days },
      pending: { decrement: days },
    },
  });
}

export async function restoreLeaveBalanceOnRejectOrCancel(
  userId: string,
  leaveTypeId: string,
  days: number,
  wasApproved: boolean,
  year = currentYear()
) {
  const balance = await getOrCreateLeaveBalance(userId, leaveTypeId, year);
  if (wasApproved) {
    return prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { used: { decrement: days } },
    });
  }
  return prisma.leaveBalance.update({
    where: { id: balance.id },
    data: { pending: { decrement: days } },
  });
}
