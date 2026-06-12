import { PreviewAwareLink } from "./PreviewAwareLink";
import { ArrowRight, HardHat, Mail, Scale } from "lucide-react";
import { ProjectCard } from "@/components/public/ProjectCard";
import { TenderCard } from "@/components/public/TenderCard";
import { NewsCard } from "@/components/public/NewsCard";
import { HERO_SLIDES, mapLandingSlidesToCarousel } from "@/data/hero-slides";
import { PreHeroBandV2 } from "@/components/public/PreHeroBandV2";
import { HeroSectionV2 } from "@/components/public/HeroSectionV2";
import { LandingV2Section } from "@/components/public/LandingV2Section";
import { LandingV2Scene } from "@/components/public/LandingV2Scene";
import { SectionHeading } from "@/components/public/SectionHeading";
import { IntroWhoWeAreSection } from "@/components/public/IntroWhoWeAreSection";
import {
  formatStatValue,
  getLandingPageContent,
  getSection,
  getSectionHeadingEmphasis,
  LANDING_SECTION_KEYS,
  type ContractorFeature,
  type GovernanceLink,
  type LandingContentMode,
  type MandateCard,
} from "@/lib/landing-page";
import {
  getLandingV2PageContent,
  getV2QuickLinks,
  getV2Section,
  LANDING_V2_SECTION_KEYS,
  type LandingV2ContentMode,
} from "@/lib/landing-page-v2";
import { resolveLandingIcon } from "@/lib/landing-icons";
import {
  getHomepageProjects,
  getHomepageTenders,
  getLatestNews,
} from "@/lib/data";
import { getProjectsFallbackImage, toProjectCardProps } from "@/lib/project-card";

export async function LandingPageV2View({
  mode = "public",
}: {
  mode?: LandingV2ContentMode | LandingContentMode;
}) {
  const contentMode = mode as LandingV2ContentMode;
  const [homepage, landing] = await Promise.all([
    getLandingPageContent(mode),
    getLandingV2PageContent(contentMode),
  ]);

  const whoWeAre = getSection(homepage, LANDING_SECTION_KEYS.WHO_WE_ARE);
  const mandate = getSection(homepage, LANDING_SECTION_KEYS.MANDATE);
  const infrastructureHeading = getSection(homepage, LANDING_SECTION_KEYS.INFRASTRUCTURE);
  const tendersHeading = getSection(homepage, LANDING_SECTION_KEYS.TENDERS);
  const statsSection = getSection(homepage, LANDING_SECTION_KEYS.STATS);
  const newsHeading = getSection(homepage, LANDING_SECTION_KEYS.NEWS);
  const contractorSection = getSection(homepage, LANDING_SECTION_KEYS.CONTRACTOR_CTA);
  const governanceHeading = getSection(homepage, LANDING_SECTION_KEYS.GOVERNANCE);
  const contactHeading = getSection(homepage, LANDING_SECTION_KEYS.CONTACT_CTA);

  const preHero = getV2Section(landing, LANDING_V2_SECTION_KEYS.PRE_HERO);
  const infrastructureV2 = getV2Section(landing, LANDING_V2_SECTION_KEYS.INFRASTRUCTURE);
  const tendersV2 = getV2Section(landing, LANDING_V2_SECTION_KEYS.TENDERS);
  const newsV2 = getV2Section(landing, LANDING_V2_SECTION_KEYS.NEWS);
  const governanceV2 = getV2Section(landing, LANDING_V2_SECTION_KEYS.GOVERNANCE);
  const contactV2 = getV2Section(landing, LANDING_V2_SECTION_KEYS.CONTACT_CTA);

  const projectCount = (infrastructureV2.settings.projectCount as number) ?? 3;
  const featuredOnly = (infrastructureV2.settings.featuredOnly as boolean) ?? true;
  const openTendersOnly = (tendersV2.settings.openOnly as boolean) ?? true;
  const newsCount = (newsV2.settings.newsCount as number) ?? 3;

  const infraButtonLabel =
    (infrastructureHeading.settings.buttonLabel as string) ??
    infrastructureHeading.ctaLabel ??
    "View All Projects";
  const infraButtonLink =
    (infrastructureHeading.settings.buttonLink as string) ??
    infrastructureHeading.ctaHref ??
    "/projects";

  const mandateCards = (mandate.settings.cards as MandateCard[] | undefined) ?? [];
  const governanceLinks =
    (governanceHeading.settings.links as GovernanceLink[] | undefined) ?? [];
  const contractorFeatures =
    (contractorSection.settings.features as ContractorFeature[] | undefined) ?? [];
  const activeStats = homepage.statItems.filter((item) => item.isActive);

  const quickLinks = getV2QuickLinks(preHero);
  const showPreHero = homepage.hero.v2ShowPreHero !== false && preHero.isActive;
  const showHero =
    homepage.hero.v2HeroPreset !== "minimal_text" && homepage.hero.enabled;

  const carouselSlides = mapLandingSlidesToCarousel(
    homepage.heroSlides.filter((slide) => slide.isActive)
  );
  const heroSlides = carouselSlides.length > 0 ? carouselSlides : HERO_SLIDES;

  const tenderCount = (tendersV2.settings.tenderCount as number) ?? 2;

  const [projects, tenders, news, projectsFallbackImage] = await Promise.all([
    getHomepageProjects(projectCount, featuredOnly),
    getHomepageTenders(tenderCount, openTendersOnly),
    getLatestNews(newsCount),
    getProjectsFallbackImage(),
  ]);

  const showGovernance =
    governanceHeading.isActive && governanceV2.isActive && governanceLinks.length > 0;

  const showCombinedHero = showPreHero && showHero;

  return (
    <div className="landing-v2">
      {showCombinedHero ? (
        <PreHeroBandV2
          section={preHero}
          quickLinks={quickLinks}
          preHeroPreset={homepage.hero.v2PreHeroPreset}
          carousel={{
            slides: heroSlides,
            layout: homepage.hero.layout,
            heroOverlayDarkness: homepage.hero.overlayStrength,
            slideIntervalMs: homepage.hero.slideDurationMs,
            fadeDurationMs: homepage.hero.zoomDurationMs,
            enabled: homepage.hero.enabled && heroSlides.length > 1,
          }}
        />
      ) : showPreHero ? (
        <PreHeroBandV2
          section={preHero}
          quickLinks={quickLinks}
          preHeroPreset={homepage.hero.v2PreHeroPreset}
        />
      ) : showHero ? (
        <HeroSectionV2
          slides={heroSlides}
          layout={homepage.hero.layout}
          heroOverlayDarkness={homepage.hero.overlayStrength}
          slideIntervalMs={homepage.hero.slideDurationMs}
          fadeDurationMs={homepage.hero.zoomDurationMs}
          enabled={homepage.hero.enabled && heroSlides.length > 1}
        />
      ) : null}

      <div className="landing-v2__intro">
        <IntroWhoWeAreSection section={whoWeAre} />
      </div>

      {mandate.isActive && mandateCards.length > 0 && (
        <LandingV2Scene variant="soft" tint="blue">
          <SectionHeading
            eyebrow={mandate.eyebrow ?? undefined}
            title={mandate.sectionTitle ?? ""}
            emphasis={getSectionHeadingEmphasis(mandate) ?? undefined}
            description={mandate.body ?? undefined}
            align="center"
          />
          <div className="landing-v2__mandate-grid">
            {mandateCards.map((item, i) => {
              const Icon = resolveLandingIcon(item.icon);
              return (
                <div key={`${item.title}-${i}`} className="landing-v2__mandate-card">
                  <Icon className="landing-v2__mandate-icon" aria-hidden="true" />
                  <h3 className="landing-v2__card-title">{item.title}</h3>
                  <p className="landing-v2__card-body">{item.description}</p>
                </div>
              );
            })}
          </div>
        </LandingV2Scene>
      )}

      {infrastructureV2.isActive && infrastructureHeading.isActive && (
        <LandingV2Section section={infrastructureV2}>
          <SectionHeading
            eyebrow={infrastructureHeading.eyebrow ?? undefined}
            title={infrastructureHeading.sectionTitle ?? ""}
            emphasis={getSectionHeadingEmphasis(infrastructureHeading) ?? undefined}
            description={infrastructureHeading.subtitle ?? undefined}
            linkLabel={infrastructureHeading.ctaLabel ?? undefined}
            linkHref={infrastructureHeading.ctaHref ?? undefined}
          />
          <div className="public-content-grid">
            {projects.map((p) => (
              <div key={p.id} className="landing-v2__card-wrap">
                <ProjectCard {...toProjectCardProps(p, projectsFallbackImage)} />
              </div>
            ))}
          </div>
          <div className="landing-v2__section-cta">
            <PreviewAwareLink href={infraButtonLink} className="landing-v2__btn landing-v2__btn--primary">
              {infraButtonLabel} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </PreviewAwareLink>
          </div>
        </LandingV2Section>
      )}

      {tendersV2.isActive && tendersHeading.isActive && (
        <LandingV2Section section={tendersV2}>
          <SectionHeading
            eyebrow={tendersHeading.eyebrow ?? undefined}
            title={tendersHeading.sectionTitle ?? ""}
            emphasis={getSectionHeadingEmphasis(tendersHeading) ?? undefined}
            description={tendersHeading.subtitle ?? undefined}
            linkLabel={tendersHeading.ctaLabel ?? undefined}
            linkHref={tendersHeading.ctaHref ?? undefined}
          />
          <div className="public-content-grid public-content-grid--2">
            {tenders.map((t) => (
              <div key={t.id} className="landing-v2__card-wrap">
                <TenderCard
                  slug={t.slug}
                  referenceNumber={t.referenceNumber}
                  title={t.title}
                  category={t.category}
                  closingDate={t.closingDate}
                  status={t.status}
                  estimatedValue={t.estimatedValue?.toString()}
                />
              </div>
            ))}
          </div>
        </LandingV2Section>
      )}

      {statsSection.isActive && activeStats.length > 0 && (
        <LandingV2Scene variant="soft">
          <SectionHeading
            eyebrow={statsSection.eyebrow ?? undefined}
            title={statsSection.sectionTitle ?? ""}
            emphasis={getSectionHeadingEmphasis(statsSection) ?? undefined}
            description={statsSection.subtitle ?? undefined}
            align="center"
          />
          <div className="landing-v2__stats-grid">
            {activeStats.map((stat) => (
              <div key={stat.id ?? stat.label} className="landing-v2__stat">
                <p className="landing-v2__stat-value text-gradient">{formatStatValue(stat)}</p>
                <p className="landing-v2__stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </LandingV2Scene>
      )}

      {newsV2.isActive && newsHeading.isActive && (
        <LandingV2Section section={newsV2} tint="green">
          <SectionHeading
            eyebrow={newsHeading.eyebrow ?? undefined}
            title={newsHeading.sectionTitle ?? ""}
            emphasis={getSectionHeadingEmphasis(newsHeading) ?? undefined}
            description={newsHeading.subtitle ?? undefined}
            linkLabel={newsHeading.ctaLabel ?? undefined}
            linkHref={newsHeading.ctaHref ?? undefined}
          />
          <div className="public-content-grid">
            {news.map((n) => (
              <div key={n.id} className="landing-v2__card-wrap">
                <NewsCard
                  slug={n.slug}
                  title={n.title}
                  category={n.category}
                  summary={n.summary}
                  publishedAt={n.publishedAt}
                  imageUrl={n.featuredImage?.url}
                  imageFocusX={n.imageFocusX}
                  imageFocusY={n.imageFocusY}
                  imageZoom={n.imageZoom}
                />
              </div>
            ))}
          </div>
        </LandingV2Section>
      )}

      {contractorSection.isActive && (
        <LandingV2Scene variant="default" tint="green">
          <div
            className="landing-v2__contractor"
            style={
              contractorSection.imageUrl
                ? {
                    backgroundImage: `linear-gradient(to right, color-mix(in srgb, var(--surface) 88%, transparent), color-mix(in srgb, var(--surface) 75%, transparent)), url(${contractorSection.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: `${contractorSection.imageFocusX ?? 50}% ${contractorSection.imageFocusY ?? 50}%`,
                  }
                : undefined
            }
          >
            <div className="landing-v2__contractor-grid">
              <div>
                <SectionHeading
                  eyebrow={contractorSection.eyebrow ?? undefined}
                  title={contractorSection.sectionTitle ?? ""}
                  emphasis={getSectionHeadingEmphasis(contractorSection) ?? undefined}
                  description={contractorSection.body ?? undefined}
                  className="mb-6"
                />
                <div className="flex flex-wrap gap-3">
                  {contractorSection.ctaLabel && contractorSection.ctaHref && (
                    <PreviewAwareLink
                      href={contractorSection.ctaHref}
                      className="landing-v2__btn landing-v2__btn--primary"
                    >
                      {contractorSection.ctaLabel}
                    </PreviewAwareLink>
                  )}
                  {(contractorSection.settings.secondaryCtaLabel as string) &&
                    (contractorSection.settings.secondaryCtaHref as string) && (
                      <PreviewAwareLink
                        href={contractorSection.settings.secondaryCtaHref as string}
                        className="landing-v2__btn landing-v2__btn--outline"
                      >
                        {contractorSection.settings.secondaryCtaLabel as string}
                      </PreviewAwareLink>
                    )}
                </div>
              </div>
              <div className="landing-v2__feature-grid">
                {contractorFeatures.map((item) => {
                  const Icon = resolveLandingIcon(item.icon, HardHat);
                  return (
                    <div key={item.label} className="landing-v2__feature-tile">
                      <Icon className="landing-v2__mandate-icon mx-auto" aria-hidden="true" />
                      <p className="text-sm font-medium">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </LandingV2Scene>
      )}

      {showGovernance && (
        <LandingV2Section section={governanceV2}>
          <SectionHeading
            eyebrow={governanceHeading.eyebrow ?? undefined}
            title={governanceHeading.sectionTitle ?? ""}
            emphasis={getSectionHeadingEmphasis(governanceHeading) ?? undefined}
            description={governanceHeading.subtitle ?? undefined}
            align="center"
          />
          <div className="landing-v2__governance-grid">
            {governanceLinks.map((item) => (
              <PreviewAwareLink
                key={item.href}
                href={item.href}
                className="landing-v2__governance-link group block"
              >
                <Scale className="landing-v2__governance-icon" aria-hidden="true" />
                <h3 className="landing-v2__card-title group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="landing-v2__card-body">{item.description}</p>
              </PreviewAwareLink>
            ))}
          </div>
        </LandingV2Section>
      )}

      {contactV2.isActive && contactHeading.isActive && (
        <LandingV2Section section={contactV2} className="landing-v2__contact">
          <SectionHeading
            eyebrow={contactHeading.eyebrow ?? undefined}
            title={contactHeading.sectionTitle ?? ""}
            emphasis={getSectionHeadingEmphasis(contactHeading) ?? undefined}
            description={contactHeading.subtitle ?? undefined}
            align="center"
            className="mb-8"
          />
          {contactHeading.ctaLabel && contactHeading.ctaHref && (
            <div className="text-center">
              <PreviewAwareLink
                href={contactHeading.ctaHref}
                className="landing-v2__btn landing-v2__btn--primary inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                {contactHeading.ctaLabel}
              </PreviewAwareLink>
            </div>
          )}
        </LandingV2Section>
      )}
    </div>
  );
}
