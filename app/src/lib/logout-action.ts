"use server";

import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "./auth";
import { logAudit } from "./audit";
import { formatAdminRole } from "./admin-greeting";

export async function logLogoutAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const hdrs = await headers();
  await logAudit({
    actor: {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: formatAdminRole(session.user.role),
    },
    action: "Logged Out",
    outcome: "Success",
    request: { headers: hdrs },
  });
}
