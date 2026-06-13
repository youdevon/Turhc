import { Metadata } from "next";
import { PreviewAwareLink } from "@/components/public/PreviewAwareLink";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/public/PageHero";
import { getNewsBySlug } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { getHeroImageFromSettings, getNewsImageUrl, getNewsImageAlt } from "@/lib/images";
import { getSiteSettings } from "@/lib/settings";
import { sanitizePublicHtml } from "@/lib/sanitize-html";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  return { title: post?.title ?? "News" };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getNewsBySlug(slug), getSiteSettings()]);
  if (!post) notFound();

  const fallbackImage = getHeroImageFromSettings(settings, "news");

  return (
    <>
      <PageHero
        eyebrow={post.category}
        title={post.title}
        subtitle={post.summary}
        imageUrl={getNewsImageUrl(post, fallbackImage)}
        imageAlt={getNewsImageAlt(post)}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "News", href: "/news" },
          { label: post.title },
        ]}
      />

      <article className="section-padding">
        <div className="container-wide max-w-3xl">
          {post.publishedAt && (
            <p className="text-sm text-muted mb-6">{formatDate(post.publishedAt)}</p>
          )}
          <div
            className="prose-dark"
            dangerouslySetInnerHTML={{ __html: sanitizePublicHtml(post.body) }}
          />
          {(post.project || post.tender) && (
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted mb-2">Related:</p>
              {post.project && (
                <PreviewAwareLink href={`/projects/${post.project.slug}`} className="text-primary hover:underline">
                  Project: {post.project.title}
                </PreviewAwareLink>
              )}
              {post.tender && (
                <PreviewAwareLink href={`/tenders/${post.tender.slug}`} className="text-primary hover:underline block">
                  Tender: {post.tender.referenceNumber} — {post.tender.title}
                </PreviewAwareLink>
              )}
            </div>
          )}
        </div>
      </article>
    </>
  );
}
