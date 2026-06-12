import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function AdminLeadershipPage() {
  const members = await prisma.leadershipMember.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <AdminHeader
        title="Leadership Team"
        description="Manage senior leadership profiles shown on the public website."
        breadcrumbs={[{ label: "Leadership" }]}
        actions={
          <Link href="/admin/leadership/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" /> Add Member
          </Link>
        }
      />
      <DataTable
        keyField="id"
        data={members as never}
        emptyTitle="No leadership members added yet"
        emptyMessage="Add leadership profiles when you are ready to publish them on the website."
        emptyActionLabel="Add Leadership Member"
        emptyActionHref="/admin/leadership/new"
        columns={[
        { key: "name", label: "Name", render: (r) => <Link href={`/admin/leadership/${r.id}`} className="text-primary hover:underline">{r.name as string}</Link> },
        { key: "title", label: "Title" },
        { key: "department", label: "Department" },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
      ]} />
    </>
  );
}
