import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatShortDate } from "@/lib/utils";
import { ADMIN_LIST_PAGE_SIZE, listSkip, parseListPage } from "@/lib/admin-list";

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminTendersPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parseListPage(pageParam);
  const skip = listSkip(page);

  const [tenders, total] = await Promise.all([
    prisma.tender.findMany({
      orderBy: { closingDate: "desc" },
      skip,
      take: ADMIN_LIST_PAGE_SIZE,
      select: {
        id: true,
        referenceNumber: true,
        title: true,
        status: true,
        closingDate: true,
      },
    }),
    prisma.tender.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

  return (
    <>
      <AdminHeader
        title="Tenders"
        description="Publish procurement notices and tender opportunities for public viewing."
        breadcrumbs={[{ label: "Tenders" }]}
        actions={
          <Link href="/admin/tenders/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" /> New Tender
          </Link>
        }
      />
      <DataTable
        keyField="id"
        data={tenders as never}
        emptyTitle="No tenders published yet"
        emptyMessage="Add a tender notice when a procurement opportunity is ready for public viewing."
        emptyActionLabel="Add Tender"
        emptyActionHref="/admin/tenders/new"
        columns={[
          { key: "referenceNumber", label: "Reference" },
          {
            key: "title",
            label: "Title",
            render: (r) => (
              <Link href={`/admin/tenders/${r.id}`} className="text-primary hover:underline">
                {r.title as string}
              </Link>
            ),
          },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
          { key: "closingDate", label: "Closes", render: (r) => formatShortDate(r.closingDate as Date) },
        ]}
      />
      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/tenders" />
    </>
  );
}
