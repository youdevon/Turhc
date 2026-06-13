import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { AboutWhoWeAreSection } from "@/components/public/AboutWhoWeAreSection";
import { AboutLeadershipSection } from "@/components/public/AboutLeadershipSection";
import { getPublishedLeadership } from "@/lib/data";
import { STOCK_IMAGES } from "@/data/stock-images";
import {
  ABOUT_SECTION_KEYS,
  getAboutPageContent,
  getAboutSection,
  type AboutContentMode,
} from "@/lib/about-page";

export async function generateAboutMetadata(mode: AboutContentMode = "public"): Promise<Metadata> {
  const content = await getAboutPageContent(mode);
  return {
    title: content.metaTitle ?? "About",
    description: content.metaDescription ?? undefined,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return generateAboutMetadata("public");
}

export async function AboutPageView({ mode = "public" }: { mode?: AboutContentMode }) {
  const [content, leadership] = await Promise.all([
    getAboutPageContent(mode),
    getPublishedLeadership(),
  ]);

  const whoWeAre = getAboutSection(content, ABOUT_SECTION_KEYS.WHO_WE_ARE);
  const leadershipSection = getAboutSection(content, ABOUT_SECTION_KEYS.LEADERSHIP);
  const hero = content.hero;

  return (
    <div className="about-page">
      <PageHero
        className="about-page__hero"
        eyebrow={hero.eyebrow ?? "About the Company"}
        title={hero.title ?? "About"}
        subtitle={hero.subtitle ?? undefined}
        imageUrl={hero.imageUrl ?? STOCK_IMAGES.about}
        imageAlt={hero.imageAlt ?? undefined}
        imageFocusX={hero.imageFocusX}
        imageFocusY={hero.imageFocusY}
        imageZoom={hero.imageZoom}
        overlayStrength={hero.overlayStrength}
      />

      <AboutWhoWeAreSection
        whoWeAre={whoWeAre}
        images={content.images}
        stats={content.statItems}
      />

      <AboutLeadershipSection members={leadership} section={leadershipSection} />
    </div>
  );
}

export default async function AboutPage() {
  return AboutPageView({ mode: "public" });
}
