import type { PrismaClient, User } from "@prisma/client";
import { ADMINISTRATOR_ROLE, isAdministrator } from "./admin-roles";

type UserWithRole = User & { role: { name: string } };

export async function resolveUserDeletion(
  db: Pick<PrismaClient, "user">,
  input: {
    actorUserId: string;
    actorRole: string | null | undefined;
    targetUserId: string;
  }
): Promise<{ ok: true; user: UserWithRole } | { ok: false; reason: string }> {
  if (!isAdministrator(input.actorRole)) {
    return { ok: false, reason: "You do not have permission to perform this action." };
  }

  if (input.actorUserId === input.targetUserId) {
    return { ok: false, reason: "You cannot delete your own account while signed in." };
  }

  const user = await db.user.findUnique({
    where: { id: input.targetUserId },
    include: { role: true },
  });

  if (!user) {
    return { ok: false, reason: "User not found." };
  }

  if (user.role.name === ADMINISTRATOR_ROLE) {
    const administratorCount = await db.user.count({
      where: { role: { name: ADMINISTRATOR_ROLE } },
    });
    if (administratorCount <= 1) {
      return { ok: false, reason: "Cannot delete the only administrator account." };
    }
  }

  return { ok: true, user };
}

export async function assertUserDeletionAllowed(
  db: Pick<PrismaClient, "user">,
  input: {
    actorUserId: string;
    actorRole: string | null | undefined;
    targetUserId: string;
  }
): Promise<UserWithRole> {
  const result = await resolveUserDeletion(db, input);
  if (!result.ok) throw new Error(result.reason);
  return result.user;
}
