import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, Building, Download } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { getTenderBySlug } from "@/lib/data";
import { formatCurrency, formatDate, formatStatus, getStatusColor } from "@/lib/utils";
import { getHeroImageFromSettings, getTenderHeroImageUrl, getTenderHeroImageAlt } from "@/lib/images";
import { getSiteSettings } from "@/lib/settings";
import { sanitizePublicHtml } from "@/lib/sanitize-html";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tender = await getTenderBySlug(slug);
  return { title: tender?.title ?? "Tender" };
}

export default async function TenderDetailPage({ params }: Props) {
  const { slug } = await params;
  const [tender, settings] = await Promise.all([getTenderBySlug(slug), getSiteSettings()]);
  if (!tender) notFound();

  const fallbackImage = getHeroImageFromSettings(settings, "tenders");

  return (
    <>
      <PageHero
        eyebrow={tender.referenceNumber}
        title={tender.title}
        subtitle={`${tender.category} · ${tender.department}`}
        imageUrl={getTenderHeroImageUrl(tender, fallbackImage)}
        imageAlt={getTenderHeroImageAlt(tender)}
        imageFocusX={tender.heroImageFocusX}
        imageFocusY={tender.heroImageFocusY}
        imageZoom={tender.heroImageZoom}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tenders", href: "/tenders" },
          { label: tender.title },
        ]}
      />

      <section className="section-padding bg-surface">
        <div className="container-wide max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tender.status)}`}>
              {formatStatus(tender.status)}
            </span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted mb-8">
            <span className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              {tender.department}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Opens {formatDate(tender.openingDate)}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Closes {formatDate(tender.closingDate)}
            </span>
            {tender.estimatedValue != null && (
              <span>Est. Value: {formatCurrency(tender.estimatedValue.toString())}</span>
            )}
          </div>
          <div
            className="prose-dark mb-8"
            dangerouslySetInnerHTML={{ __html: sanitizePublicHtml(tender.description) }}
          />

          {tender.documents.length > 0 && (
            <div className="border border-border bg-surface-elevated p-6 mb-8">
              <h2 className="public-panel-heading flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" /> Tender Documents
              </h2>
              <ul className="space-y-2">
                {tender.documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> {doc.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tender.addenda.length > 0 && (
            <div className="border border-border bg-surface-elevated p-6 mb-8">
              <h2 className="public-panel-heading">Addenda</h2>
              <ul className="space-y-3">
                {tender.addenda.map((a) => (
                  <li key={a.id} className="border-b border-border pb-3 last:border-0">
                    <p className="font-medium">{a.title}</p>
                    {a.description && <p className="text-sm text-muted">{a.description}</p>}
                    {a.media && (
                      <a href={a.media.url} className="text-sm text-primary hover:underline">
                        Download
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tender.clarifications.length > 0 && (
            <div className="border border-border bg-surface-elevated p-6 mb-8">
              <h2 className="public-panel-heading">Clarifications</h2>
              <div className="space-y-4">
                {tender.clarifications.map((c) => (
                  <div key={c.id}>
                    <p className="font-medium text-sm">Q: {c.question}</p>
                    <p className="text-sm text-muted mt-1">A: {c.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tender.status === "AWARDED" && (
            <div className="border border-emerald-500/30 bg-emerald-500/5 p-6">
              <h2 className="public-panel-heading mb-2">Award Information</h2>
              {tender.successfulBidder && (
                <p className="text-sm">
                  <span className="text-muted">Successful Bidder:</span> {tender.successfulBidder}
                </p>
              )}
              {tender.awardInfo && <p className="text-sm text-muted mt-2">{tender.awardInfo}</p>}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
