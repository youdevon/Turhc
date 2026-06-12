import { ContentStatus } from "@prisma/client";
import { prisma } from "./db";
import { mergeWithDraft, parseDraftJson } from "./content-draft";
import { getRecordStatus } from "./content-draft";

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
  const tender = await prisma.tender.findFirst({ where: { slug } });
  if (!tender) return null;

  const draft = parseDraftJson<typeof tender>(tender.draftData);
  if (draft && tender.statusContent === ContentStatus.PUBLISHED) {
    return { ...tender, ...draft };
  }
  return mergeWithDraft(tender, tender.draftData);
}

export async function getNewsForPreview(slug: string) {
  const post = await prisma.newsPost.findFirst({ where: { slug } });
  if (!post) return null;

  const draft = parseDraftJson<typeof post>(post.draftData);
  if (draft && post.status === ContentStatus.PUBLISHED) {
    return { ...post, ...draft };
  }
  return mergeWithDraft(post, post.draftData);
}

export function isPreviewable(record: { status?: ContentStatus; statusContent?: ContentStatus }) {
  const status = getRecordStatus(record);
  return status === ContentStatus.PUBLISHED || status === ContentStatus.DRAFT;
}
