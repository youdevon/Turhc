import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { AboutWhoWeAreSection } from "@/components/public/AboutWhoWeAreSection";
import { AboutLeadershipSection } from "@/components/public/AboutLeadershipSection";
import { getSiteSettings } from "@/lib/settings";
import { getPublishedLeadership } from "@/lib/data";
import { getPageHeroBySlug } from "@/lib/page-hero";
import {
  getLandingPageContent,
  getSection,
  LANDING_SECTION_KEYS,
  type LandingStatItem,
  type MandateCard,
} from "@/lib/landing-page";
import { getHeroImageFromSettings } from "@/lib/images";

export const metadata: Metadata = { title: "About" };

function parseDeliveryStats(json: string): LandingStatItem[] {
  try {
    const parsed = JSON.parse(json) as Array<{ label?: string; value?: string }>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item.label && item.value)
      .map((item, index) => ({
        label: item.label!,
        value: item.value!,
        prefix: null,
        suffix: null,
        icon: null,
        displayOrder: index,
        isActive: true,
      }));
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const [settings, leadership, hero, landing] = await Promise.all([
    getSiteSettings(),
    getPublishedLeadership(),
    getPageHeroBySlug("about"),
    getLandingPageContent(),
  ]);

  const whoWeAre = getSection(landing, LANDING_SECTION_KEYS.WHO_WE_ARE);
  const mandate = getSection(landing, LANDING_SECTION_KEYS.MANDATE);
  const governance = getSection(landing, LANDING_SECTION_KEYS.GOVERNANCE);
  const mandateCards = (mandate.settings.cards as MandateCard[] | undefined) ?? [];

  const landingStats = landing.statItems.filter((item) => item.isActive).slice(0, 3);
  const settingsStats = parseDeliveryStats(settings.deliveryStatsJson).slice(0, 3);
  const stats = landingStats.length > 0 ? landingStats : settingsStats;

  const heroSubtitle =
    hero.subtitle?.trim() || settings.orgTagline.trim() || settings.whoWeAreText.trim();

  return (
    <div className="about-page">
      <PageHero
        {...hero}
        className="about-page__hero"
        eyebrow={hero.eyebrow ?? "About the Company"}
        title={hero.title || settings.orgName}
        subtitle={heroSubtitle}
      />

      <AboutWhoWeAreSection
        whoWeAre={whoWeAre}
        mandateCards={mandateCards}
        whoWeAreFallback={settings.whoWeAreText}
        mandateFallback={settings.mandateText}
        stats={stats}
        secondaryImageUrl={getHeroImageFromSettings(settings, "about")}
      />

      <AboutLeadershipSection
        members={leadership}
        intro={governance.subtitle ?? governance.body}
      />
    </div>
  );
}
