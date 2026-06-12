import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { UserForm } from "@/components/admin/forms/UserForm";
import { ResetUserPasswordForm } from "@/components/admin/ResetUserPasswordForm";
import { DeleteUserForm } from "@/components/admin/DeleteUserForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

import { assertAdministratorPage } from "@/lib/admin-roles";

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
  await assertAdministratorPage();
  const { id } = await params;
  const [user, roles] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: { role: true } }),
    prisma.role.findMany(),
  ]);
  if (!user) notFound();

  const session = await getServerSession(authOptions);
  const isSelf = session?.user?.id === user.id;

  return (
    <>
      <AdminHeader
        title={user.name}
        description="Update account details, reset password, or remove this user."
        breadcrumbs={[{ label: "Users", href: "/admin/users" }, { label: user.name }]}
        actions={
          <DeleteUserForm
            userId={user.id}
            userName={user.name}
            isSelf={isSelf}
            variant="button"
          />
        }
      />
      <div className="space-y-6">
        <UserForm user={user} roles={roles} />
        <ResetUserPasswordForm userId={user.id} userName={user.name} />
        <DeleteUserForm userId={user.id} userName={user.name} isSelf={isSelf} />
      </div>
    </>
  );
}
