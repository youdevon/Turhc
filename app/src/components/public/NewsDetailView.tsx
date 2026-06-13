import { PreviewAwareLink } from "@/components/public/PreviewAwareLink";
import { PageHero } from "@/components/public/PageHero";
import { formatDate } from "@/lib/utils";
import { getHeroImageFromSettings, getNewsImageUrl, getNewsImageAlt } from "@/lib/images";
import { sanitizePublicHtml } from "@/lib/sanitize-html";
import type { SiteSettings } from "@/lib/settings";

type NewsPostView = {
  category: string;
  title: string;
  summary: string;
  body: string;
  publishedAt: Date | null;
  featuredImage?: { url: string } | null;
  featuredImageId?: string | null;
  imageFocusX?: number | null;
  imageFocusY?: number | null;
  imageZoom?: number | null;
  project?: { title: string; slug: string } | null;
  tender?: { title: string; slug: string; referenceNumber: string } | null;
};

type Props = {
  post: NewsPostView;
  settings: SiteSettings;
};

export function NewsDetailView({ post, settings }: Props) {
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
