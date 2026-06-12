import { prisma } from "@/lib/db";
import { UserForm } from "@/components/admin/forms/UserForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

import { assertAdministratorPage } from "@/lib/admin-roles";

export default async function NewUserPage() {
  await assertAdministratorPage();
  const roles = await prisma.role.findMany();
  return (
    <>
      <AdminHeader title="New User" breadcrumbs={[{ label: "Users", href: "/admin/users" }, { label: "New" }]} />
      <UserForm roles={roles} />
    </>
  );
}
