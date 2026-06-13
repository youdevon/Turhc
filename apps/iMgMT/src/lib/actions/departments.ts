"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  actionError,
  actionOk,
  catchActionError,
  requireSessionPermission,
  withAuditContext,
  type ActionResult,
} from "./helpers";

export async function createDepartment(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSessionPermission("org.manage");
    const name = (formData.get("name") as string)?.trim();
    const parentId = (formData.get("parentId") as string) || null;
    const headUserId = (formData.get("headUserId") as string) || null;

    if (!name) return actionError("Department name is required");

    const result = await withAuditContext(async () => {
      return prisma.department.create({
        data: {
          name,
          parentId: parentId || undefined,
          headUserId: headUserId || undefined,
        },
      });
    });

    revalidatePath("/org/departments");
    revalidatePath("/org/chart");
    return actionOk({ id: result.id });
  } catch (error) {
    return catchActionError(error);
  }
}

export async function updateDepartment(formData: FormData): Promise<ActionResult> {
  try {
    await requireSessionPermission("org.manage");
    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const parentId = (formData.get("parentId") as string) || null;
    const headUserId = (formData.get("headUserId") as string) || null;

    if (!id || !name) return actionError("Department id and name are required");
    if (parentId === id) return actionError("A department cannot be its own parent");

    await withAuditContext(async () => {
      await prisma.department.update({
        where: { id },
        data: {
          name,
          parentId,
          headUserId,
        },
      });
    });

    revalidatePath("/org/departments");
    revalidatePath("/org/chart");
    return actionOk();
  } catch (error) {
    return catchActionError(error);
  }
}

export async function getDepartmentsTree() {
  const departments = await prisma.department.findMany({
    include: {
      headUser: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });
  return departments;
}
