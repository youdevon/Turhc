import { Metadata } from "next";
import { PreviewAwareLink } from "@/components/public/PreviewAwareLink";
import { Scale, FileText, Users, Shield } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getPageHeroBySlug } from "@/lib/page-hero";

export const metadata: Metadata = { title: "Governance" };

const sections = [
  { href: "/governance/board", icon: Users, title: "Board of Directors", desc: "Meet our board members and governance structure." },
  { href: "/governance/leadership", icon: Shield, title: "Leadership Team", desc: "Executive leadership driving infrastructure delivery." },
  { href: "/governance/annual-reports", icon: FileText, title: "Annual Reports", desc: "Download annual financial and operational reports." },
  { href: "/governance/procurement-policies", icon: Scale, title: "Procurement Policies", desc: "Rules governing public procurement." },
  { href: "/governance/freedom-of-information", icon: FileText, title: "Freedom of Information", desc: "Request access to public records." },
  { href: "/governance/documents", icon: FileText, title: "Public Documents", desc: "Policies, charters, and official publications." },
];

export default async function GovernancePage() {
  const hero = await getPageHeroBySlug("governance");

  return (
    <>
      <PageHero {...hero} />
      <section className="section-padding blueprint-grid">
        <div className="container-wide">
          <div className="public-content-grid">
            {sections.map((s, i) => (
              <ScrollReveal key={s.href} delay={i * 0.05} className="h-full">
                <PreviewAwareLink href={s.href} className="block border border-border bg-surface-elevated p-6 card-hover h-full group">
                  <s.icon className="w-10 h-10 text-accent mb-4" />
                  <h3 className="public-card-title mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                  <p className="public-body-sm">{s.desc}</p>
                </PreviewAwareLink>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
