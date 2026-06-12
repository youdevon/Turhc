import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/public/PageHero";
import { getPageHeroBySlug } from "@/lib/page-hero";
import { renderSimpleMarkdown } from "@/lib/simple-markdown";

const PAGES: Record<string, { title: string; content: string }> = {
  registration: {
    title: "Registration Requirements",
    content: `To register as a contractor with the National Infrastructure Delivery Corporation, applicants must:

• Hold valid business registration and tax compliance certificates
• Demonstrate relevant experience in infrastructure delivery
• Provide audited financial statements for the past three years
• Submit health, safety, and environmental management policies
• Complete the online registration form with supporting documents

Applications are reviewed within 30 business days. Approved contractors are added to our prequalified database.`,
  },
  prequalification: {
    title: "Prequalification",
    content: `Prequalification assesses a contractor's technical capacity, financial standing, and track record.

Categories include civil works, electrical, mechanical, consultancy, and specialist trades. Contractors may apply for one or more categories based on demonstrated capability.

Prequalification is valid for two years and must be renewed before expiry to remain eligible for tender participation.`,
  },
  "work-categories": {
    title: "Work Categories",
    content: `Our procurement covers the following infrastructure sectors:

• Roads and highways
• Bridges and structures
• Water and wastewater
• Energy and utilities
• Buildings and facilities
• Ports and maritime
• Railways and transit
• ICT infrastructure

Each category has specific prequalification criteria aligned with project complexity and value.`,
  },
  "tender-alerts": {
    title: "Tender Alerts",
    content: `Registered contractors can subscribe to email alerts for new tenders matching their prequalified categories.

Alert subscriptions are managed through the contractor portal (coming soon). In the interim, monitor the Tenders page and official public notices for new opportunities.`,
  },
  "how-to-bid": {
    title: "How to Submit Bids",
    content: `1. Ensure your company is registered and prequalified
2. Download tender documents from the tender detail page
3. Review all requirements, addenda, and clarifications
4. Prepare technical and financial proposals per the instructions
5. Submit sealed bids before the closing date and time
6. Attend bid opening if required

Late submissions will not be accepted. All bids must comply with procurement regulations.`,
  },
  faqs: {
    title: "Frequently Asked Questions",
    content: `**How long does registration take?**
Typically 30 business days from complete submission.

**Can foreign companies bid?**
Yes, subject to local partnership requirements where applicable.

**Where do I submit bids?**
At the address specified in each tender document, or via the portal when available.

**How are tenders evaluated?**
Using published evaluation criteria — typically a combination of technical merit and price.`,
  },
};

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return { title: PAGES[page]?.title ?? "Contractors" };
}

export default async function ContractorSubPage({ params }: Props) {
  const { page } = await params;
  const content = PAGES[page];
  if (!content) notFound();

  const hero = await getPageHeroBySlug("contractors", {
    pageType: "contractors",
    eyebrow: "Contractor Portal",
    title: content.title,
    subtitle: "Guidance for contractors participating in public infrastructure procurement.",
  });

  return (
    <>
      <PageHero
        {...hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contractors", href: "/contractors" },
          { label: content.title },
        ]}
      />
      <section className="section-padding">
        <div className="container-wide max-w-3xl">
          {page === "faqs" ? (
            <div className="prose-dark prose-content">{renderSimpleMarkdown(content.content)}</div>
          ) : (
            <div className="prose-dark prose-content whitespace-pre-line">{content.content}</div>
          )}
        </div>
      </section>
    </>
  );
}
