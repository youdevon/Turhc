import { Metadata } from "next";
import { PreviewAwareLink } from "@/components/public/PreviewAwareLink";
import { ArrowRight, HardHat, FileCheck, Layers, Bell, HelpCircle } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getPageHeroBySlug } from "@/lib/page-hero";

export const metadata: Metadata = { title: "Contractors" };

const links = [
  { href: "/contractors/registration", icon: FileCheck, title: "Registration Requirements", desc: "Documents and criteria for contractor registration." },
  { href: "/contractors/prequalification", icon: HardHat, title: "Prequalification", desc: "How to become a prequalified contractor." },
  { href: "/contractors/work-categories", icon: Layers, title: "Work Categories", desc: "Infrastructure sectors and work classifications." },
  { href: "/contractors/tender-alerts", icon: Bell, title: "Tender Alerts", desc: "Subscribe to notifications for new tenders." },
  { href: "/contractors/how-to-bid", icon: ArrowRight, title: "How to Submit Bids", desc: "Step-by-step guide to bid submission." },
  { href: "/contractors/faqs", icon: HelpCircle, title: "FAQs", desc: "Frequently asked questions for contractors." },
];

export default async function ContractorsPage() {
  const hero = await getPageHeroBySlug("contractors");

  return (
    <>
      <PageHero
        {...hero}
        ctaLabel={hero.ctaLabel ?? "View Open Tenders"}
        ctaHref={hero.ctaHref ?? "/tenders?status=OPEN"}
      />
      <section className="section-padding bg-gradient-to-b from-surface to-background blueprint-grid">
        <div className="container-wide">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 px-2">
            <button
              type="button"
              disabled
              className="px-6 py-3 rounded-lg bg-primary/50 text-white/70 text-sm font-medium cursor-not-allowed"
              title="Coming soon"
            >
              Login to Portal (Coming Soon)
            </button>
            <PreviewAwareLink
              href="/tenders?status=OPEN"
              className="px-6 py-3 rounded-lg border border-accent text-accent text-sm font-medium hover:bg-accent/10 transition-colors"
            >
              View Open Tenders
            </PreviewAwareLink>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {links.map((l, i) => (
              <ScrollReveal key={l.href} delay={i * 0.05}>
                <PreviewAwareLink href={l.href} className="block border border-border bg-surface-elevated p-6 card-hover h-full group">
                  <l.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="public-card-title mb-2 group-hover:text-primary transition-colors">{l.title}</h3>
                  <p className="public-body-sm">{l.desc}</p>
                </PreviewAwareLink>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
