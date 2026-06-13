import Link from "next/link";
import { Plus, ExternalLink, Eye } from "lucide-react";
import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ABOUT_PAGE_SLUG } from "@/lib/about-page";
import { LANDING_V2_PAGE_SLUG } from "@/lib/landing-page-v2";

function getPageEditHref(page: { id: string; slug: string }) {
  if (page.slug === ABOUT_PAGE_SLUG) return "/admin/about";
  if (page.slug === LANDING_V2_PAGE_SLUG) return "/admin/landing-page-v2";
  return `/admin/pages/${page.id}`;
}

function getPagePreviewHref(page: { slug: string; status: ContentStatus }) {
  if (page.slug === ABOUT_PAGE_SLUG) return "/preview/about";
  if (page.slug === LANDING_V2_PAGE_SLUG) return "/preview/home";
  if (page.status === ContentStatus.PUBLISHED) return `/${page.slug}`;
  return `/preview/pages/${page.slug}`;
}

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return (
    <>
      <AdminHeader
        title="Pages"
        description="Create and edit website pages, including content and publishing settings."
        breadcrumbs={[{ label: "Pages" }]}
        actions={
          <Link href="/admin/pages/new" className="admin-btn-primary">
            <Plus className="w-4 h-4" /> New Page
          </Link>
        }
      />
      <DataTable
        keyField="id"
        data={pages as never}
        emptyTitle="No pages added yet"
        emptyMessage="Create a page when you need new content on the public website."
        emptyActionLabel="Create Page"
        emptyActionHref="/admin/pages/new"
        columns={[
          {
            key: "title",
            label: "Title",
            render: (r) => (
              <Link href={getPageEditHref(r as { id: string; slug: string })} className="text-primary hover:underline">
                {r.title as string}
              </Link>
            ),
          },
          { key: "slug", label: "Website link", render: (r) => `/${r.slug as string}` },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
          {
            key: "actions",
            label: "Actions",
            render: (r) => {
              const page = r as { slug: string; status: ContentStatus };
              const previewHref = getPagePreviewHref(page);
              const liveHref = `/${page.slug}`;
              const isPublished = page.status === ContentStatus.PUBLISHED;

              return (
                <div className="flex flex-wrap gap-2">
                  <Link href={previewHref} target="_blank" className="admin-btn-quiet text-xs">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Link>
                  {isPublished && (
                    <Link href={liveHref} target="_blank" className="admin-btn-quiet text-xs">
                      <ExternalLink className="w-3.5 h-3.5" /> Live
                    </Link>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    </>
  );
}
