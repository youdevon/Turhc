import { AppShell } from "@/components/AppShell";
import { UsersPageClient } from "@/components/org/UsersPageClient";
import { getDepartmentsTree } from "@/lib/actions/departments";
import { listRoles, listUsersForManagement } from "@/lib/actions/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };

export default async function UsersPage() {
  const [users, roles, departments] = await Promise.all([
    listUsersForManagement(),
    listRoles(),
    getDepartmentsTree(),
  ]);

  return (
    <AppShell title="Users">
      <UsersPageClient
        users={users}
        roles={roles}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      />
    </AppShell>
  );
}
