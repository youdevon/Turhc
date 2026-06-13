import { ContentStatus } from "@prisma/client";
import { prisma } from "./db";
import { mergeWithDraft, parseDraftJson } from "./content-draft";
import { getRecordStatus } from "./content-draft";

const newsInclude = {
  featuredImage: true,
  project: { select: { title: true, slug: true } },
  tender: { select: { title: true, slug: true, referenceNumber: true } },
} as const;

const tenderInclude = {
  documents: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
  addenda: { include: { media: true }, orderBy: { publishedAt: "desc" as const } },
  clarifications: { orderBy: { publishedAt: "desc" as const } },
} as const;

export async function getPageForPreview(slug: string) {
  const page = await prisma.page.findFirst({
    where: { slug },
  });
  if (!page) return null;

  const draft = parseDraftJson<typeof page>(page.draftData);
  if (draft && page.status === ContentStatus.PUBLISHED) {
    return { ...page, ...draft };
  }
  if (page.status === ContentStatus.PUBLISHED) return page;
  if (draft) return { ...page, ...draft };
  return page;
}

export async function getProjectForPreview(slug: string) {
  const project = await prisma.project.findFirst({ where: { slug } });
  if (!project) return null;

  const draft = parseDraftJson<typeof project>(project.draftData);
  if (draft && project.statusContent === ContentStatus.PUBLISHED) {
    return { ...project, ...draft };
  }
  return mergeWithDraft(project, project.draftData);
}

export async function getTenderForPreview(slug: string) {
  const tender = await prisma.tender.findFirst({
    where: { slug },
    include: tenderInclude,
  });
  if (!tender) return null;

  const draft = parseDraftJson<typeof tender>(tender.draftData);
  if (draft && tender.statusContent === ContentStatus.PUBLISHED) {
    return { ...tender, ...draft };
  }
  const merged = mergeWithDraft(tender, tender.draftData);
  const { hasDraft: _hasDraft, ...preview } = merged;
  return preview;
}

export async function getNewsForPreview(slug: string) {
  const post = await prisma.newsPost.findFirst({
    where: { slug },
    include: newsInclude,
  });
  if (!post) return null;

  const draft = parseDraftJson<typeof post>(post.draftData);
  if (draft && post.status === ContentStatus.PUBLISHED) {
    const merged = { ...post, ...draft };
    if (draft.featuredImageId && draft.featuredImageId !== post.featuredImageId) {
      merged.featuredImage = await prisma.mediaAsset.findUnique({
        where: { id: draft.featuredImageId as string },
      });
    }
    return merged;
  }

  const merged = mergeWithDraft(post, post.draftData);
  const { hasDraft: _hasDraft, ...preview } = merged;
  if (preview.featuredImageId && preview.featuredImageId !== post.featuredImageId) {
    preview.featuredImage = await prisma.mediaAsset.findUnique({
      where: { id: preview.featuredImageId },
    });
  }
  return preview;
}

export function isPreviewable(record: { status?: ContentStatus; statusContent?: ContentStatus }) {
  const status = getRecordStatus(record);
  return status === ContentStatus.PUBLISHED || status === ContentStatus.DRAFT;
}
