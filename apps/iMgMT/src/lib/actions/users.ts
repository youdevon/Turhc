"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
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
import type { EmploymentType, UserStatus } from "@prisma/client";

export async function createUser(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSessionPermission("users.manage");
    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const roleId = formData.get("roleId") as string;
    const departmentId = (formData.get("departmentId") as string) || null;
    const employeeNumber = (formData.get("employeeNumber") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const jobTitle = (formData.get("jobTitle") as string)?.trim() || null;
    const employmentType = (formData.get("employmentType") as EmploymentType) || "PERMANENT";
    const status = (formData.get("status") as UserStatus) || "ACTIVE";
    const dateOfEmployment = parseFormDate(formData.get("dateOfEmployment"));

    if (!firstName || !lastName || !email || !password || !roleId || !dateOfEmployment) {
      return actionError("First name, last name, email, password, role, and employment date are required");
    }

    if (password.length < 8) {
      return actionError("Password must be at least 8 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return actionError("Email already in use");

    const result = await withAuditContext(async () => {
      return prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash: await bcrypt.hash(password, 12),
          roleId,
          departmentId,
          employeeNumber,
          phone,
          jobTitle,
          employmentType,
          status,
          dateOfEmployment,
        },
      });
    });

    revalidatePath("/org/users");
    revalidatePath("/org/chart");
    return actionOk({ id: result.id });
  } catch (error) {
    return catchActionError(error);
  }
}

export async function updateUser(formData: FormData): Promise<ActionResult> {
  try {
    await requireSessionPermission("users.manage");
    const id = formData.get("id") as string;
    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const roleId = formData.get("roleId") as string;
    const departmentId = (formData.get("departmentId") as string) || null;
    const employeeNumber = (formData.get("employeeNumber") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const jobTitle = (formData.get("jobTitle") as string)?.trim() || null;
    const employmentType = formData.get("employmentType") as EmploymentType;
    const status = formData.get("status") as UserStatus;
    const dateOfEmployment = parseFormDate(formData.get("dateOfEmployment"));
    const newPassword = formData.get("newPassword") as string;

    if (!id || !firstName || !lastName || !email || !roleId || !dateOfEmployment) {
      return actionError("Required fields missing");
    }

    const data: Record<string, unknown> = {
      firstName,
      lastName,
      email,
      roleId,
      departmentId,
      employeeNumber,
      phone,
      jobTitle,
      employmentType,
      status,
      dateOfEmployment,
    };

    if (newPassword?.trim()) {
      if (newPassword.length < 8) return actionError("Password must be at least 8 characters");
      data.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await withAuditContext(async () => {
      await prisma.user.update({ where: { id }, data });
    });

    revalidatePath("/org/users");
    revalidatePath("/org/chart");
    return actionOk();
  } catch (error) {
    return catchActionError(error);
  }
}

export async function listUsersForManagement() {
  return prisma.user.findMany({
    include: {
      role: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function listRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } });
}

export async function listUsersMinimal() {
  return prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, jobTitle: true, departmentId: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}
