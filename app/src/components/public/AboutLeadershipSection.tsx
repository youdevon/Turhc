import { SectionHeading } from "@/components/public/SectionHeading";
import { PersonCard } from "@/components/public/PersonCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  getAboutSectionHeadingEmphasis,
  type AboutSectionContent,
} from "@/lib/about-page";

type LeadershipMember = {
  id: string;
  name: string;
  title: string;
  department?: string | null;
  bio?: string | null;
  photo?: { url: string } | null;
  photoFocusX?: number;
  photoFocusY?: number;
  photoZoom?: number;
};

type Props = {
  members: LeadershipMember[];
  section: AboutSectionContent;
};

export function AboutLeadershipSection({ members, section }: Props) {
  if (!section.isActive || members.length === 0) return null;

  return (
    <section className="about-page__leadership-band section-padding">
      <div className="container-wide about-page__leadership-inner">
        <SectionHeading
          eyebrow={section.eyebrow ?? "Our Leaders"}
          heading={section.sectionTitle ?? "We Are Here"}
          emphasis={getAboutSectionHeadingEmphasis(section) ?? undefined}
          description={
            section.subtitle?.trim() ||
            section.body?.trim() ||
            "Meet the executive team guiding our delivery mandate with accountability and public service."
          }
          align="center"
        />

        <div className="about-page__leadership-grid">
          {members.map((member, i) => (
            <ScrollReveal key={member.id} delay={i * 0.05} className="h-full">
              <PersonCard
                name={member.name}
                title={member.title}
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
  );
}
