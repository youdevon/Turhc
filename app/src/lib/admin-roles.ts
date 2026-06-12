import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { requireAdmin } from "./admin-actions";
import { isAdministrator } from "./admin-access";

export {
  ADMINISTRATOR_ROLE,
  EDITOR_ROLE,
  isAdministrator,
  canAccessAdminRoute,
} from "./admin-access";

export async function requireAdministrator() {
  const session = await requireAdmin();
  if (!isAdministrator(session.user.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return session;
}

export async function assertAdministratorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/admin/login");
  if (!isAdministrator(session.user.role)) redirect("/admin/dashboard");
}

