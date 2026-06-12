import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DraftStatusBadge } from "@/components/admin/DraftStatusBadge";
import { ADMIN_LIST_PAGE_SIZE, listSkip, parseListPage } from "@/lib/admin-list";

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminProjectsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parseListPage(pageParam);
  const skip = listSkip(page);

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      skip,
      take: ADMIN_LIST_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        sector: true,
        status: true,
        statusContent: true,
        draftData: true,
        progressPercent: true,
      },
    }),
    prisma.project.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

  return (
    <>
      <AdminHeader
        title="Projects"
        description="Add and update infrastructure projects shown on the public website."
        breadcrumbs={[{ label: "Projects" }]}
        actions={
          <Link href="/admin/projects/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" /> New Project
          </Link>
        }
      />
      <DataTable
        keyField="id"
        data={projects as never}
        emptyTitle="No projects added yet"
        emptyMessage="Add a project when you are ready to publish infrastructure work on the website."
        emptyActionLabel="Add Project"
        emptyActionHref="/admin/projects/new"
        columns={[
          {
            key: "title",
            label: "Title",
            render: (r) => (
              <Link href={`/admin/projects/${r.id}`} className="text-primary hover:underline font-medium">
                {r.title as string}
              </Link>
            ),
          },
          { key: "sector", label: "Sector" },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
          {
            key: "statusContent",
            label: "Publish status",
            render: (r) => (
              <DraftStatusBadge
                record={{
                  statusContent: r.statusContent as never,
                  draftData: r.draftData as string | null,
                }}
              />
            ),
          },
          { key: "progressPercent", label: "Progress", render: (r) => `${r.progressPercent}%` },
        ]}
      />
      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/projects" />
    </>
  );
}
