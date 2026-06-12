import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { PersonCard } from "@/components/public/PersonCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getPublishedLeadership } from "@/lib/data";
import { getPageHeroBySlug } from "@/lib/page-hero";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Leadership Team" };

export default async function LeadershipPage() {
  const [members, hero] = await Promise.all([
    getPublishedLeadership(),
    getPageHeroBySlug("governance", {
      pageType: "governance",
      eyebrow: "Governance",
      title: "Leadership Team",
      subtitle: "Executive leadership driving infrastructure delivery.",
    }),
  ]);

  return (
    <>
      <PageHero
        {...hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Governance", href: "/governance" },
          { label: "Leadership Team" },
        ]}
      />
      <section className="section-padding blueprint-grid">
        <div className="container-wide">
          {members.length === 0 ? (
            <EmptyState title="Leadership profiles will appear here once published in the CMS." />
          ) : (
            <div className="public-content-scroll">
              {members.map((m, i) => (
                <ScrollReveal key={m.id} delay={i * 0.05} className="h-full">
                  <PersonCard
                    name={m.name}
                    title={m.title}
                    department={m.department}
                    bio={m.bio}
                    photoUrl={m.photo?.url}
                    photoFocusX={m.photoFocusX}
                    photoFocusY={m.photoFocusY}
                    photoZoom={m.photoZoom}
                    variant="primary"
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
