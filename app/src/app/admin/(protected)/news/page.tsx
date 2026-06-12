import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ADMIN_LIST_PAGE_SIZE, listSkip, parseListPage } from "@/lib/admin-list";

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminNewsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parseListPage(pageParam);
  const skip = listSkip(page);

  const [posts, total] = await Promise.all([
    prisma.newsPost.findMany({
      orderBy: { updatedAt: "desc" },
      skip,
      take: ADMIN_LIST_PAGE_SIZE,
      select: { id: true, title: true, category: true, status: true },
    }),
    prisma.newsPost.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

  return (
    <>
      <AdminHeader
        title="News & Notices"
        description="Share news, updates, and public notices on the website."
        breadcrumbs={[{ label: "News & Notices" }]}
        actions={
          <Link href="/admin/news/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" /> New Post
          </Link>
        }
      />
      <DataTable
        keyField="id"
        data={posts as never}
        emptyTitle="No news posts yet"
        emptyMessage="Publish news and notices when you have updates to share with the public."
        emptyActionLabel="Add News Post"
        emptyActionHref="/admin/news/new"
        columns={[
          {
            key: "title",
            label: "Title",
            render: (r) => (
              <Link href={`/admin/news/${r.id}`} className="text-primary hover:underline">
                {r.title as string}
              </Link>
            ),
          },
          { key: "category", label: "Category" },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
        ]}
      />
      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/news" />
    </>
  );
}
