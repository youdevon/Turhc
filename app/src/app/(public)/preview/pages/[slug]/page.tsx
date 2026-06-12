import { notFound } from "next/navigation";
import { PageHero } from "@/components/public/PageHero";
import { getPageForPreview } from "@/lib/content-preview";
type Props = { params: Promise<{ slug: string }> };

export default async function PreviewPageBySlug({ params }: Props) {
  const { slug } = await params;
  const page = await getPageForPreview(slug);
  if (!page) notFound();

  return (
    <>
      <PageHero
        eyebrow={page.heroEyebrow ?? undefined}
        title={page.heroTitle ?? page.title}
        subtitle={page.heroSubtitle ?? page.summary ?? undefined}
        imageUrl={page.heroImageUrl ?? ""}
        imageAlt={page.heroImageAlt ?? page.title}
        overlayStrength={page.heroOverlayStrength ?? 0.55}
      />
      {page.content && (
        <section className="section-padding">
          <div className="container-narrow prose-content whitespace-pre-line">
            {page.content}
          </div>
        </section>
      )}
    </>
  );
}
