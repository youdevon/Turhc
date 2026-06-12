import Link from "next/link";
import { Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { UserRowActions } from "@/components/admin/UserRowActions";

import { assertAdministratorPage } from "@/lib/admin-roles";

export default async function AdminUsersPage() {
  await assertAdministratorPage();
  const [users, session] = await Promise.all([
    prisma.user.findMany({ include: { role: true }, orderBy: { name: "asc" } }),
    getServerSession(authOptions),
  ]);
  const currentUserId = session?.user?.id;

  return (
    <>
      <AdminHeader title="Users" breadcrumbs={[{ label: "Users" }]} actions={<Link href="/admin/users/new" className="admin-btn-primary"><Plus className="w-4 h-4" /> New User</Link>} />
      <DataTable keyField="id" data={users as never} emptyMessage="No user accounts yet." columns={[
        { key: "name", label: "Name", render: (r) => <Link href={`/admin/users/${r.id}`} className="text-primary hover:underline">{r.name as string}</Link> },
        { key: "email", label: "Email" },
        { key: "role", label: "Access level", render: (r) => {
          const name = (r.role as { name: string })?.name;
          return name === "Editor" ? "Content Editor" : name;
        }},
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
        {
          key: "actions",
          label: "Actions",
          className: "text-right whitespace-nowrap w-[1%] min-w-[12.5rem]",
          render: (r) => (
            <UserRowActions
              userId={r.id as string}
              userName={r.name as string}
              isSelf={currentUserId === r.id}
            />
          ),
        },
      ]} />
    </>
  );
}
