import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@prisma/client";
import { PageHero } from "@/components/public/PageHero";
import { NewsCard } from "@/components/public/NewsCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getPageHeroBySlug } from "@/lib/page-hero";
import { getHeroImageFromSettings, getNewsImageUrl } from "@/lib/images";
import { getSiteSettings } from "@/lib/settings";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "News" };

export default async function NewsPage() {
  const [posts, hero, settings] = await Promise.all([
    prisma.newsPost.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      include: { featuredImage: true },
    }),
    getPageHeroBySlug("news"),
    getSiteSettings(),
  ]);

  const newsFallback = getHeroImageFromSettings(settings, "news");

  return (
    <>
      <PageHero {...hero} />
      <section className="section-padding blueprint-grid">
        <div className="container-wide">
          {posts.length === 0 ? (
            <EmptyState
              title="No news or notices yet"
              description="Published updates will appear here when they are added in the CMS."
            />
          ) : (
            <div className="public-content-grid">
              {posts.map((n, i) => (
                <ScrollReveal key={n.id} delay={i * 0.03} className="h-full">
                  <NewsCard
                    slug={n.slug}
                    title={n.title}
                    category={n.category}
                    summary={n.summary}
                    publishedAt={n.publishedAt}
                    imageUrl={getNewsImageUrl(n, newsFallback)}
                    imageFocusX={n.imageFocusX}
                    imageFocusY={n.imageFocusY}
                    imageZoom={n.imageZoom}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
