import { access, unlink } from "fs/promises";
import path from "path";
import { prisma } from "./db";
import { getUploadPath } from "./uploads";

const LOGO_SETTING_KEYS = [
  "logoMediaId",
  "logoMediaIdWhite",
  "logoMediaIdColored",
  "logoMediaIdDark",
  "logoMediaIdLight",
  "logoMediaIdCompact",
  "logoMediaIdCompactWhite",
] as const;

export type MediaUsageRef = {
  label: string;
  count: number;
};

export async function getMediaUsage(assetId: string): Promise<MediaUsageRef[]> {
  const [
    projectsFeatured,
    projectImages,
    newsFeatured,
    documents,
    tenderDocuments,
    tenderAddenda,
    boardPhotos,
    leadershipPhotos,
    logoSettings,
  ] = await Promise.all([
    prisma.project.count({ where: { featuredImageId: assetId } }),
    prisma.projectImage.count({ where: { mediaId: assetId } }),
    prisma.newsPost.count({ where: { featuredImageId: assetId } }),
    prisma.document.count({ where: { mediaId: assetId } }),
    prisma.tenderDocument.count({ where: { mediaId: assetId } }),
    prisma.tenderAddendum.count({ where: { mediaId: assetId } }),
    prisma.boardMember.count({ where: { photoId: assetId } }),
    prisma.leadershipMember.count({ where: { photoId: assetId } }),
    prisma.siteSetting.count({
      where: { key: { in: [...LOGO_SETTING_KEYS] }, value: assetId },
    }),
  ]);

  const refs: MediaUsageRef[] = [];
  if (projectsFeatured > 0) refs.push({ label: "project featured image", count: projectsFeatured });
  if (projectImages > 0) refs.push({ label: "project gallery image", count: projectImages });
  if (newsFeatured > 0) refs.push({ label: "news featured image", count: newsFeatured });
  if (documents > 0) refs.push({ label: "document", count: documents });
  if (tenderDocuments > 0) refs.push({ label: "tender document", count: tenderDocuments });
  if (tenderAddenda > 0) refs.push({ label: "tender addendum", count: tenderAddenda });
  if (boardPhotos > 0) refs.push({ label: "board member photo", count: boardPhotos });
  if (leadershipPhotos > 0) refs.push({ label: "leadership photo", count: leadershipPhotos });
  if (logoSettings > 0) refs.push({ label: "site logo setting", count: logoSettings });

  return refs;
}

export function formatMediaUsageMessage(refs: MediaUsageRef[]): string {
  const parts = refs.map((ref) =>
    ref.count === 1 ? `1 ${ref.label}` : `${ref.count} ${ref.label}s`
  );
  return `This file is still in use (${parts.join(", ")}). Remove those references before deleting.`;
}

export async function isMediaFileOnDisk(asset: {
  url: string;
  filename: string;
}): Promise<boolean> {
  try {
    if (asset.url.startsWith("/api/uploads/")) {
      await access(getUploadPath(asset.filename));
      return true;
    }

    if (asset.url.startsWith("/uploads/brand/")) {
      const filepath = path.join(process.cwd(), "public", "uploads", "brand", asset.filename);
      await access(filepath);
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function clearMediaReferences(assetId: string, assetUrl: string): Promise<string[]> {
  const cleared: string[] = [];

  const idClears: Array<{ label: string; run: () => Promise<{ count: number }> }> = [
    {
      label: "project featured image",
      run: () =>
        prisma.project.updateMany({
          where: { featuredImageId: assetId },
          data: { featuredImageId: null, featuredImageUrl: null },
        }),
    },
    {
      label: "news featured image",
      run: () =>
        prisma.newsPost.updateMany({
          where: { featuredImageId: assetId },
          data: { featuredImageId: null, featuredImageUrl: null },
        }),
    },
    {
      label: "board member photo",
      run: () =>
        prisma.boardMember.updateMany({
          where: { photoId: assetId },
          data: { photoId: null },
        }),
    },
    {
      label: "leadership photo",
      run: () =>
        prisma.leadershipMember.updateMany({
          where: { photoId: assetId },
          data: { photoId: null },
        }),
    },
    {
      label: "site logo setting",
      run: () =>
        prisma.siteSetting.updateMany({
          where: { key: { in: [...LOGO_SETTING_KEYS] }, value: assetId },
          data: { value: "" },
        }),
    },
  ];

  for (const migration of idClears) {
    const result = await migration.run();
    if (result.count > 0) cleared.push(`${migration.label} (${result.count})`);
  }

  const urlClears: Array<{ label: string; run: () => Promise<{ count: number }> }> = [
    {
      label: "page hero image",
      run: () =>
        prisma.page.updateMany({
          where: { heroImageUrl: assetUrl },
          data: { heroImageUrl: null },
        }),
    },
    {
      label: "page section image",
      run: () =>
        prisma.pageSection.updateMany({
          where: { imageUrl: assetUrl },
          data: { imageUrl: null },
        }),
    },
    {
      label: "project featured image URL",
      run: () =>
        prisma.project.updateMany({
          where: { featuredImageUrl: assetUrl },
          data: { featuredImageUrl: null },
        }),
    },
    {
      label: "tender hero image",
      run: () =>
        prisma.tender.updateMany({
          where: { heroImageUrl: assetUrl },
          data: { heroImageUrl: null },
        }),
    },
    {
      label: "news featured image URL",
      run: () =>
        prisma.newsPost.updateMany({
          where: { featuredImageUrl: assetUrl },
          data: { featuredImageUrl: null },
        }),
    },
  ];

  for (const migration of urlClears) {
    const result = await migration.run();
    if (result.count > 0) cleared.push(`${migration.label} (${result.count})`);
  }

  return cleared;
}

export async function getBlockingMediaUsage(
  assetId: string,
  assetUrl: string
): Promise<MediaUsageRef[]> {
  const usage = await getMediaUsage(assetId);
  const blocking = usage.filter(
    (ref) =>
      ref.label === "document" ||
      ref.label === "tender document" ||
      ref.label === "tender addendum" ||
      ref.label === "project gallery image"
  );

  const heroSlides = await prisma.heroSlide.count({ where: { mediaUrl: assetUrl } });
  if (heroSlides > 0) {
    blocking.push({ label: "hero slide", count: heroSlides });
  }

  return blocking;
}

export async function reassignMediaReferences(
  fromId: string,
  fromUrl: string,
  toId: string,
  toUrl: string
): Promise<string[]> {
  const updated: string[] = [];

  const idMigrations: Array<{
    label: string;
    run: () => Promise<{ count: number }>;
  }> = [
    {
      label: "project featured image",
      run: () =>
        prisma.project.updateMany({
          where: { featuredImageId: fromId },
          data: { featuredImageId: toId, featuredImageUrl: toUrl },
        }),
    },
    {
      label: "project gallery image",
      run: () =>
        prisma.projectImage.updateMany({
          where: { mediaId: fromId },
          data: { mediaId: toId },
        }),
    },
    {
      label: "news featured image",
      run: () =>
        prisma.newsPost.updateMany({
          where: { featuredImageId: fromId },
          data: { featuredImageId: toId, featuredImageUrl: toUrl },
        }),
    },
    {
      label: "document",
      run: () =>
        prisma.document.updateMany({
          where: { mediaId: fromId },
          data: { mediaId: toId },
        }),
    },
    {
      label: "tender document",
      run: () =>
        prisma.tenderDocument.updateMany({
          where: { mediaId: fromId },
          data: { mediaId: toId },
        }),
    },
    {
      label: "tender addendum",
      run: () =>
        prisma.tenderAddendum.updateMany({
          where: { mediaId: fromId },
          data: { mediaId: toId },
        }),
    },
    {
      label: "board member photo",
      run: () =>
        prisma.boardMember.updateMany({
          where: { photoId: fromId },
          data: { photoId: toId },
        }),
    },
    {
      label: "leadership photo",
      run: () =>
        prisma.leadershipMember.updateMany({
          where: { photoId: fromId },
          data: { photoId: toId },
        }),
    },
    {
      label: "site logo setting",
      run: () =>
        prisma.siteSetting.updateMany({
          where: { key: { in: [...LOGO_SETTING_KEYS] }, value: fromId },
          data: { value: toId },
        }),
    },
  ];

  for (const migration of idMigrations) {
    const result = await migration.run();
    if (result.count > 0) updated.push(`${migration.label} (${result.count})`);
  }

  const urlMigrations: Array<{
    label: string;
    run: () => Promise<{ count: number }>;
  }> = [
    {
      label: "page hero image",
      run: () =>
        prisma.page.updateMany({
          where: { heroImageUrl: fromUrl },
          data: { heroImageUrl: toUrl },
        }),
    },
    {
      label: "page section image",
      run: () =>
        prisma.pageSection.updateMany({
          where: { imageUrl: fromUrl },
          data: { imageUrl: toUrl },
        }),
    },
    {
      label: "hero slide",
      run: () =>
        prisma.heroSlide.updateMany({
          where: { mediaUrl: fromUrl },
          data: { mediaUrl: toUrl },
        }),
    },
    {
      label: "project featured image URL",
      run: () =>
        prisma.project.updateMany({
          where: { featuredImageUrl: fromUrl },
          data: { featuredImageUrl: toUrl },
        }),
    },
    {
      label: "tender hero image",
      run: () =>
        prisma.tender.updateMany({
          where: { heroImageUrl: fromUrl },
          data: { heroImageUrl: toUrl },
        }),
    },
    {
      label: "news featured image URL",
      run: () =>
        prisma.newsPost.updateMany({
          where: { featuredImageUrl: fromUrl },
          data: { featuredImageUrl: toUrl },
        }),
    },
  ];

  for (const migration of urlMigrations) {
    const result = await migration.run();
    if (result.count > 0) updated.push(`${migration.label} (${result.count})`);
  }

  return updated;
}

export async function deleteStoredMediaFile(url: string): Promise<void> {
  if (url.startsWith("/api/uploads/")) {
    const filename = path.basename(url.replace("/api/uploads/", ""));
    await unlink(getUploadPath(filename)).catch(() => undefined);
    return;
  }

  if (url.startsWith("/uploads/brand/")) {
    const filename = path.basename(url.replace("/uploads/brand/", ""));
    const filepath = path.join(process.cwd(), "public", "uploads", "brand", filename);
    await unlink(filepath).catch(() => undefined);
  }
}
