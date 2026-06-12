import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function AdminBoardPage() {
  const members = await prisma.boardMember.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <AdminHeader
        title="Board of Directors"
        description="Manage board members shown in the governance section of the website."
        breadcrumbs={[{ label: "Board" }]}
        actions={
          <Link href="/admin/board/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" /> Add Member
          </Link>
        }
      />
      <DataTable
        keyField="id"
        data={members as never}
        emptyTitle="No board members added yet"
        emptyMessage="Add board members to display them on the governance section of the website."
        emptyActionLabel="Add Board Member"
        emptyActionHref="/admin/board/new"
        columns={[
        { key: "name", label: "Name", render: (r) => <Link href={`/admin/board/${r.id}`} className="text-primary hover:underline">{r.name as string}</Link> },
        { key: "title", label: "Title" },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
      ]} />
    </>
  );
}
