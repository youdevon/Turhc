import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getFrontendPathForCategory } from "@/lib/document-categories";

export default async function AdminDocumentsPage() {
  const docs = await prisma.document.findMany({ orderBy: { title: "asc" }, include: { media: true } });
  return (
    <>
      <AdminHeader title="Documents" breadcrumbs={[{ label: "Documents" }]} actions={<Link href="/admin/documents/new" className="admin-btn-primary"><Plus className="w-4 h-4" /> New Document</Link>} />
      <DataTable keyField="id" data={docs as never} columns={[
        { key: "title", label: "Title", render: (r) => <Link href={`/admin/documents/${r.id}`} className="text-primary hover:underline">{r.title as string}</Link> },
        {
          key: "category",
          label: "Public page",
          render: (r) => {
            const path = getFrontendPathForCategory(r.category as string);
            const status = r.status as string;
            if (status !== "PUBLISHED" || !path) {
              return <span className="text-muted text-xs">—</span>;
            }
            return (
              <Link href={path} target="_blank" className="text-primary hover:underline text-xs">
                {path.replace("/governance/", "")}
              </Link>
            );
          },
        },
        { key: "category", label: "Category", render: (r) => String(r.category).replace(/_/g, " ") },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
      ]} />
    </>
  );
}
