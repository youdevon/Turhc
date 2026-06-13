import { prisma } from "./db";
import { ContentStatus, type MediaAsset, type Project } from "@prisma/client";

type ProjectListItem = Pick<
  Project,
  | "id"
  | "title"
  | "slug"
  | "sector"
  | "location"
  | "description"
  | "status"
  | "progressPercent"
  | "featured"
  | "cardSummary"
  | "featuredImageUrl"
  | "featuredImageAlt"
  | "publishedAt"
  | "updatedAt"
  | "createdAt"
  | "startDate"
> & {
  featuredImage: Pick<MediaAsset, "url"> | null;
};

const projectListOrder = [{ publishedAt: "desc" as const }, { updatedAt: "desc" as const }];

export async function getHomepageProjects(limit = 3, featuredOnly = true) {
  if (featuredOnly) {
    return getFeaturedProjects(limit);
  }

  return prisma.project.findMany({
    where: { statusContent: ContentStatus.PUBLISHED },
    orderBy: projectListOrder,
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      sector: true,
      location: true,
      description: true,
      status: true,
      progressPercent: true,
      featured: true,
      cardSummary: true,
      featuredImageUrl: true,
      featuredImageAlt: true,
      imageFocusX: true,
      imageFocusY: true,
      imageZoom: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
      startDate: true,
      featuredImage: { select: { url: true } },
    },
  });
}

export async function getFeaturedProjects(limit = 3) {
  const featured = await prisma.project.findMany({
    where: { statusContent: ContentStatus.PUBLISHED, featured: true },
    orderBy: projectListOrder,
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      sector: true,
      location: true,
      description: true,
      status: true,
      progressPercent: true,
      featured: true,
      cardSummary: true,
      featuredImageUrl: true,
      featuredImageAlt: true,
      imageFocusX: true,
      imageFocusY: true,
      imageZoom: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
      startDate: true,
      featuredImage: { select: { url: true } },
    },
  });

  if (featured.length >= limit) return featured;

  const remaining = await prisma.project.findMany({
    where: {
      statusContent: ContentStatus.PUBLISHED,
      featured: false,
      id: { notIn: featured.map((p) => p.id) },
    },
    orderBy: projectListOrder,
    take: limit - featured.length,
    select: {
      id: true,
      title: true,
      slug: true,
      sector: true,
      location: true,
      description: true,
      status: true,
      progressPercent: true,
      featured: true,
      cardSummary: true,
      featuredImageUrl: true,
      featuredImageAlt: true,
      imageFocusX: true,
      imageFocusY: true,
      imageZoom: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
      startDate: true,
      featuredImage: { select: { url: true } },
    },
  });

  return [...featured, ...remaining];
}

export async function getHomepageTenders(limit = 4, openOnly = true) {
  return prisma.tender.findMany({
    where: {
      statusContent: ContentStatus.PUBLISHED,
      ...(openOnly ? { status: "OPEN" as const } : {}),
    },
    orderBy: { closingDate: "asc" },
    take: limit,
  });
}

export async function getOpenTenders(limit = 4) {
  return getHomepageTenders(limit, true);
}

export async function getLatestNews(limit = 3) {
  return prisma.newsPost.findMany({
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      category: true,
      publishedAt: true,
      featuredImage: { select: { url: true } },
      imageFocusX: true,
      imageFocusY: true,
      imageZoom: true,
    },
  });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findFirst({
    where: { slug, statusContent: ContentStatus.PUBLISHED },
    include: {
      featuredImage: true,
      images: { include: { media: true }, orderBy: { sortOrder: "asc" } },
      documents: { include: { media: true }, where: { status: ContentStatus.PUBLISHED } },
      milestones: { orderBy: { sortOrder: "asc" } },
      newsPosts: {
        where: { status: ContentStatus.PUBLISHED },
        take: 5,
        include: { featuredImage: true },
      },
    },
  });
}

export async function getTenderBySlug(slug: string) {
  return prisma.tender.findFirst({
    where: { slug, statusContent: ContentStatus.PUBLISHED },
    include: {
      documents: { include: { media: true }, orderBy: { sortOrder: "asc" } },
      addenda: { include: { media: true }, orderBy: { publishedAt: "desc" } },
      clarifications: { orderBy: { publishedAt: "desc" } },
      newsPosts: {
        where: { status: ContentStatus.PUBLISHED },
        take: 5,
      },
    },
  });
}

export async function getNewsBySlug(slug: string) {
  return prisma.newsPost.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    include: {
      featuredImage: true,
      project: { select: { title: true, slug: true } },
      tender: { select: { title: true, slug: true, referenceNumber: true } },
    },
  });
}

export async function getPublishedBoardMembers() {
  return prisma.boardMember.findMany({
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { sortOrder: "asc" },
    include: { photo: true },
  });
}

export async function getPublishedLeadership() {
  return prisma.leadershipMember.findMany({
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { sortOrder: "asc" },
    include: { photo: true },
  });
}

export async function getHousingSectorProjects(limit = 3) {
  return prisma.project.findMany({
    where: {
      statusContent: ContentStatus.PUBLISHED,
      OR: [
        { sector: { contains: "Housing", mode: "insensitive" } },
        { sector: { contains: "Residential", mode: "insensitive" } },
      ],
    },
    orderBy: projectListOrder,
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      sector: true,
      location: true,
      description: true,
      status: true,
      progressPercent: true,
      featured: true,
      cardSummary: true,
      featuredImageUrl: true,
      featuredImageAlt: true,
      imageFocusX: true,
      imageFocusY: true,
      imageZoom: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
      startDate: true,
      featuredImage: { select: { url: true } },
    },
  });
}

export async function getDocumentsByCategories(categories: string[]) {
  if (!categories.length) return [];
  return prisma.document.findMany({
    where: { category: { in: categories as never }, status: ContentStatus.PUBLISHED },
    orderBy: [{ year: "desc" }, { title: "asc" }],
    include: { media: true },
  });
}

/** @deprecated Use getDocumentsByCategories — kept for single-category callers */
export async function getDocumentsByCategory(category: string) {
  return getDocumentsByCategories([category]);
}
