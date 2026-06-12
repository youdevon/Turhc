import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategoriesForGovernanceSection } from "@/lib/document-categories";
import { getDocumentsByCategories } from "@/lib/data";
import { getPageHeroBySlug } from "@/lib/page-hero";

const SECTIONS: Record<string, { title: string; description: string }> = {
  "annual-reports": {
    title: "Annual Reports",
    description: "Download our annual financial and operational reports.",
  },
  "procurement-policies": {
    title: "Procurement Policies",
    description: "Official procurement rules and guidelines.",
  },
  "freedom-of-information": {
    title: "Freedom of Information",
    description: "Information on accessing public records and FOI requests.",
  },
  documents: {
    title: "Public Documents",
    description: "Official policies, charters, and publications.",
  },
};

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: SECTIONS[section]?.title ?? "Governance" };
}

export default async function GovernanceSectionPage({ params }: Props) {
  const { section } = await params;
  const config = SECTIONS[section];
  if (!config) notFound();

  const [documents, hero] = await Promise.all([
    getDocumentsByCategories(getCategoriesForGovernanceSection(section)),
    getPageHeroBySlug("governance", {
      pageType: "governance",
      eyebrow: "Governance",
      title: config.title,
      subtitle: config.description,
    }),
  ]);

  return (
    <>
      <PageHero
        {...hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Governance", href: "/governance" },
          { label: config.title },
        ]}
      />
      <section className="section-padding">
        <div className="container-wide max-w-3xl">
          <div className="space-y-3">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 border border-border bg-surface-elevated p-4 hover:border-primary/40 transition-colors group"
              >
                <div>
                  <p className="font-medium group-hover:text-primary transition-colors">{doc.title}</p>
                  {doc.description && <p className="text-sm text-muted">{doc.description}</p>}
                  {doc.year && <p className="text-xs text-muted mt-1">{doc.year}</p>}
                </div>
                <Download className="w-5 h-5 text-primary shrink-0" />
              </a>
            ))}
            {documents.length === 0 && (
              <EmptyState
                title="No documents available yet"
                description="Check back soon for published materials in this section."
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
