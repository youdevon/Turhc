import { AppShell } from "@/components/AppShell";
import { DepartmentsPageClient } from "@/components/org/DepartmentsPageClient";
import { getDepartmentsTree } from "@/lib/actions/departments";
import { listUsersMinimal } from "@/lib/actions/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Departments" };

export default async function DepartmentsPage() {
  const [departments, users] = await Promise.all([getDepartmentsTree(), listUsersMinimal()]);

  return (
    <AppShell title="Departments">
      <DepartmentsPageClient departments={departments} users={users} />
    </AppShell>
  );
}
