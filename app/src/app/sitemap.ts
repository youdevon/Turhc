import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const baseUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3010").replace(
  /\/$/,
  ""
);

function staticRoutes(): MetadataRoute.Sitemap {
  return [
    "",
    "/about",
    "/contact",
    "/projects",
    "/tenders",
    "/news",
    "/governance",
    "/governance/board",
    "/governance/leadership",
    "/contractors",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [projects, tenders, newsPosts] = await Promise.all([
      prisma.project.findMany({
        where: { statusContent: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.tender.findMany({
        where: { statusContent: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.newsPost.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const dynamicRoutes: MetadataRoute.Sitemap = [
      ...projects.map((p) => ({
        url: `${baseUrl}/projects/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...tenders.map((t) => ({
        url: `${baseUrl}/tenders/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...newsPosts.map((n) => ({
        url: `${baseUrl}/news/${n.slug}`,
        lastModified: n.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];

    return [...staticRoutes(), ...dynamicRoutes];
  } catch (error) {
    console.error("Sitemap DB lookup failed, returning static routes only:", error);
    return staticRoutes();
  }
}
