import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { PersonCard } from "@/components/public/PersonCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getPublishedBoardMembers } from "@/lib/data";
import { getPageHeroBySlug } from "@/lib/page-hero";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Board of Directors" };

export default async function BoardPage() {
  const [members, hero] = await Promise.all([
    getPublishedBoardMembers(),
    getPageHeroBySlug("governance", {
      pageType: "governance",
      eyebrow: "Governance",
      title: "Board of Directors",
      subtitle: "Meet our board members and corporate governance leadership.",
    }),
  ]);

  return (
    <>
      <PageHero
        {...hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Governance", href: "/governance" },
          { label: "Board of Directors" },
        ]}
      />
      <section className="section-padding blueprint-grid">
        <div className="container-wide">
          {members.length === 0 ? (
            <EmptyState title="Board members will be listed here once published in the CMS." />
          ) : (
            <div className="public-content-scroll">
              {members.map((m, i) => (
                <ScrollReveal key={m.id} delay={i * 0.05} className="h-full">
                  <PersonCard
                    name={m.name}
                    title={m.title}
                    bio={m.bio}
                    photoUrl={m.photo?.url}
                    photoFocusX={m.photoFocusX}
                    photoFocusY={m.photoFocusY}
                    photoZoom={m.photoZoom}
                    variant="accent"
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
