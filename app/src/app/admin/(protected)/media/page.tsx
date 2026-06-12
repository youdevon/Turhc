import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MediaLibraryGrid } from "@/components/admin/MediaLibraryGrid";
import { MediaCategoryTabs } from "@/components/admin/MediaCategoryTabs";
import { MediaUploadPanel } from "@/components/admin/MediaUploadPanel";
import { MediaDuplicatesPanel } from "@/components/admin/MediaDuplicatesPanel";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
  findDuplicateGroupsWithUsage,
  getDuplicateAssetIds,
} from "@/lib/media-duplicates";
import {
  mediaCategoryFilter,
  parseMediaCategory,
  type MediaCategory,
} from "@/lib/media-utils";
import { ADMIN_LIST_PAGE_SIZE, listSkip, parseListPage } from "@/lib/admin-list";

type Props = {
  searchParams: Promise<{ category?: string; page?: string; duplicates?: string }>;
};

async function getCategoryCounts(): Promise<Record<MediaCategory, number>> {
  const base = { isDeleted: false };
  const [all, images, videos, documents] = await Promise.all([
    prisma.mediaAsset.count({ where: base }),
    prisma.mediaAsset.count({ where: mediaCategoryFilter("images") }),
    prisma.mediaAsset.count({ where: mediaCategoryFilter("videos") }),
    prisma.mediaAsset.count({ where: mediaCategoryFilter("documents") }),
  ]);
  return { all, images, videos, documents };
}

export default async function AdminMediaPage({ searchParams }: Props) {
  const params = await searchParams;
  const category = parseMediaCategory(params.category);
  const page = parseListPage(params.page);
  const skip = listSkip(page);
  const showDuplicates = params.duplicates === "1";

  const where = mediaCategoryFilter(category);

  const [assets, total, counts, duplicateGroups] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_LIST_PAGE_SIZE,
      select: {
        id: true,
        url: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        width: true,
        height: true,
        fileHash: true,
        createdAt: true,
        altText: true,
        caption: true,
      },
    }),
    prisma.mediaAsset.count({ where }),
    getCategoryCounts(),
    showDuplicates ? findDuplicateGroupsWithUsage() : Promise.resolve([]),
  ]);

  const duplicateIds = getDuplicateAssetIds(duplicateGroups);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

  return (
    <>
      <AdminHeader
        title="Media Library"
        description="Upload and manage images, videos, and documents."
        breadcrumbs={[{ label: "Media" }]}
      />
      <div className="space-y-6">
        <MediaUploadPanel />
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={
              showDuplicates
                ? `/admin/media${category !== "all" ? `?category=${category}` : ""}`
                : `/admin/media?duplicates=1${category !== "all" ? `&category=${category}` : ""}`
            }
            className="text-sm text-primary hover:underline"
          >
            {showDuplicates ? "Hide duplicate scan" : "Scan for duplicates"}
          </Link>
        </div>
        {showDuplicates && <MediaDuplicatesPanel initialGroups={duplicateGroups} />}
        <div className="space-y-4">
          <MediaCategoryTabs active={category} counts={counts} />
          <MediaLibraryGrid
            category={category}
            assets={assets.map((asset) => ({
              id: asset.id,
              url: asset.url,
              filename: asset.filename,
              originalName: asset.originalName,
              mimeType: asset.mimeType,
              size: asset.size,
              width: asset.width,
              height: asset.height,
              fileHash: asset.fileHash,
              createdAt: asset.createdAt.toISOString(),
              altText: asset.altText,
              caption: asset.caption,
              isDuplicate: duplicateIds.has(asset.id),
            }))}
          />
          <AdminPagination
            page={page}
            totalPages={totalPages}
            basePath="/admin/media"
            searchParams={{
              category: category !== "all" ? category : undefined,
              duplicates: showDuplicates ? "1" : undefined,
            }}
          />
        </div>
      </div>
    </>
  );
}
