import { Metadata } from "next";
import { SectionHeading } from "@/components/public/SectionHeading";
import { PageHero } from "@/components/public/PageHero";
import { PersonCard } from "@/components/public/PersonCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getSiteSettings } from "@/lib/settings";
import { getPublishedLeadership } from "@/lib/data";
import { getPageHeroBySlug } from "@/lib/page-hero";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const [settings, leadership] = await Promise.all([
    getSiteSettings(),
    getPublishedLeadership(),
  ]);
  const hero = await getPageHeroBySlug("about");

  return (
    <>
      <PageHero {...hero} subtitle={hero.subtitle || settings.whoWeAreText} />

      <section className="section-padding-tight blueprint-grid">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Our Mandate"
            heading="What we do"
            description={settings.mandateText}
          />
        </div>
      </section>

      {leadership.length > 0 && (
        <section className="section-padding bg-surface">
          <div className="container-wide">
            <SectionHeading
              eyebrow="Leadership"
              heading="Executive"
              emphasis="Team"
              align="center"
            />
            <div className="public-content-scroll">
              {leadership.map((member, i) => (
                <ScrollReveal key={member.id} delay={i * 0.05} className="h-full">
                  <PersonCard
                    name={member.name}
                    title={member.title}
                    department={member.department}
                    bio={member.bio}
                    photoUrl={member.photo?.url}
                    photoFocusX={member.photoFocusX}
                    photoFocusY={member.photoFocusY}
                    photoZoom={member.photoZoom}
                    variant="primary"
                  />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
