import { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@prisma/client";
import { PageHero } from "@/components/public/PageHero";
import { TenderCard } from "@/components/public/TenderCard";
import { TenderFilters } from "@/components/public/TenderFilters";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getPageHeroBySlug } from "@/lib/page-hero";

export const metadata: Metadata = { title: "Tenders" };

type Props = { searchParams: Promise<{ status?: string; category?: string; year?: string; q?: string }> };

export default async function TendersPage({ searchParams }: Props) {
  const params = await searchParams;

  const where: Record<string, unknown> = { statusContent: ContentStatus.PUBLISHED };

  if (params.status) where.status = params.status;
  if (params.category) where.category = params.category;
  if (params.year) {
    const year = parseInt(params.year, 10);
    where.openingDate = {
      gte: new Date(`${year}-01-01`),
      lte: new Date(`${year}-12-31`),
    };
  }
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { referenceNumber: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [tenders, allTenders, hero] = await Promise.all([
    prisma.tender.findMany({ where: where as never, orderBy: { closingDate: "desc" } }),
    prisma.tender.findMany({
      where: { statusContent: ContentStatus.PUBLISHED },
      select: { category: true, openingDate: true },
    }),
    getPageHeroBySlug("tenders"),
  ]);

  const categories = [...new Set(allTenders.map((t) => t.category))].sort();
  const years = [...new Set(allTenders.map((t) => new Date(t.openingDate).getFullYear()))].sort((a, b) => b - a);

  return (
    <>
      <PageHero {...hero} />
      <section className="section-padding blueprint-grid">
        <div className="container-wide">
          <Suspense>
            <TenderFilters categories={categories} years={years} />
          </Suspense>
          <div className="public-content-grid public-content-grid--2">
            {tenders.map((t, i) => (
              <ScrollReveal key={t.id} delay={i * 0.03} className="h-full">
                <TenderCard
                  slug={t.slug}
                  referenceNumber={t.referenceNumber}
                  title={t.title}
                  category={t.category}
                  closingDate={t.closingDate}
                  status={t.status}
                  estimatedValue={t.estimatedValue?.toString()}
                />
              </ScrollReveal>
            ))}
          </div>
          {tenders.length === 0 && (
            <p className="text-center text-muted py-12">No tenders match your filters.</p>
          )}
        </div>
      </section>
    </>
  );
}
