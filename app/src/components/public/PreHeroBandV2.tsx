import { PreviewAwareLink } from "./PreviewAwareLink";
import { FramedImage } from "./FramedImage";
import { HeroCarousel } from "./HeroCarousel";
import type { HeroSlide } from "@/data/hero-slides";
import type { LandingHeroLayout, V2PreHeroPreset } from "@/lib/landing-page";
import {
  getV2ForegroundImage,
  getV2PreHeroCssPreset,
  getV2SectionHeadingEmphasis,
  type LandingV2QuickLink,
  type LandingV2SectionContent,
} from "@/lib/landing-page-v2";
import type { V2VisualPreset } from "@/lib/landing-page-v2-presets";
import { cn } from "@/lib/utils";

type CarouselProps = {
  slides: HeroSlide[];
  layout?: LandingHeroLayout;
  heroOverlayDarkness?: number;
  slideIntervalMs?: number;
  fadeDurationMs?: number;
  zoomDurationMs?: number;
  enabled?: boolean;
};

type Props = {
  section: LandingV2SectionContent;
  quickLinks: LandingV2QuickLink[];
  overlap?: boolean;
  preHeroPreset?: V2PreHeroPreset;
  carousel?: CarouselProps;
};

export function PreHeroBandV2({
  section,
  quickLinks,
  overlap = false,
  preHeroPreset,
  carousel,
}: Props) {
  if (!section.isActive) return null;

  const headline = section.sectionTitle?.trim();
  if (!headline) return null;

  const emphasis = getV2SectionHeadingEmphasis(section);
  const supporting = (section.body ?? section.subtitle)?.trim();
  const visualPreset = section.settings.visualPreset as V2VisualPreset | undefined;
  const preset = preHeroPreset ?? getV2PreHeroCssPreset(visualPreset);
  const foreground = getV2ForegroundImage(section);
  const useCarousel = Boolean(carousel?.slides.length);
  const isContainedCarousel = useCarousel && carousel?.layout !== "full_width";

  const content = (
    <>
      {section.eyebrow && (
        <p className="public-section-heading__eyebrow landing-v2__pre-hero-eyebrow">
          <span className="public-section-heading__eyebrow-line" aria-hidden="true" />
          <span className="public-section-heading__eyebrow-text">{section.eyebrow}</span>
        </p>
      )}

      <h1 className="landing-v2__pre-hero-title">
        <span className="landing-v2__pre-hero-title-main">{headline}</span>
        {emphasis ? (
          <span className="landing-v2__pre-hero-title-emphasis">{emphasis}</span>
        ) : null}
      </h1>

      {supporting ? (
        <p className="landing-v2__pre-hero-supporting">{supporting}</p>
      ) : null}

      {quickLinks.length > 0 && (
        <nav className="landing-v2__pre-hero-pills" aria-label="Quick links">
          {quickLinks.map((link) => (
            <PreviewAwareLink
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="landing-v2__pill"
            >
              {link.label}
            </PreviewAwareLink>
          ))}
        </nav>
      )}
    </>
  );

  if (useCarousel && carousel) {
    return (
      <section
        className={cn(
          "landing-v2__pre-hero landing-v2__pre-hero--under-header landing-v2__pre-hero--with-carousel",
          `landing-v2__pre-hero--${preset}`,
          isContainedCarousel
            ? "landing-v2__pre-hero--contained-carousel"
            : "landing-v2__pre-hero--full-carousel"
        )}
        data-pre-hero
        data-dark-header-surface
        aria-label="Introduction"
      >
        {isContainedCarousel ? (
          <div className="container-wide landing-v2__pre-hero-scene">
            <div className="landing-v2__pre-hero-scene-media" aria-hidden="true">
              <HeroCarousel
                slides={carousel.slides}
                layout={carousel.layout}
                heroOverlayDarkness={carousel.heroOverlayDarkness}
                slideIntervalMs={carousel.slideIntervalMs}
                fadeDurationMs={carousel.fadeDurationMs}
                zoomDurationMs={carousel.zoomDurationMs}
                enabled={carousel.enabled && carousel.slides.length > 1}
                backgroundOnly
                underHeader={carousel.layout === "full_width"}
              />
            </div>
            <div className="landing-v2__pre-hero-blueprint" aria-hidden="true" />
            <div className="landing-v2__pre-hero-glow" aria-hidden="true" />
            <div className="landing-v2__pre-hero-inner landing-v2__pre-hero-scene-content">
              {content}
            </div>
          </div>
        ) : (
          <>
            <div className="landing-v2__pre-hero-carousel" aria-hidden="true">
              <HeroCarousel
                slides={carousel.slides}
                layout={carousel.layout}
                heroOverlayDarkness={carousel.heroOverlayDarkness}
                slideIntervalMs={carousel.slideIntervalMs}
                fadeDurationMs={carousel.fadeDurationMs}
                zoomDurationMs={carousel.zoomDurationMs}
                enabled={carousel.enabled && carousel.slides.length > 1}
                backgroundOnly
                underHeader={carousel.layout === "full_width"}
              />
            </div>
            <div className="landing-v2__pre-hero-blueprint" aria-hidden="true" />
            <div className="landing-v2__pre-hero-glow" aria-hidden="true" />
            <div className="container-wide landing-v2__pre-hero-inner">{content}</div>
          </>
        )}
      </section>
    );
  }

  return (
    <section
      className={cn(
        "landing-v2__pre-hero landing-v2__pre-hero--under-header",
        `landing-v2__pre-hero--${preset}`,
        overlap && "landing-v2__pre-hero--overlap",
        (section.imageUrl || foreground) && "landing-v2__pre-hero--has-image"
      )}
      data-pre-hero
      aria-label="Introduction"
    >
      <div className="landing-v2__pre-hero-blueprint" aria-hidden="true" />
      <div className="landing-v2__pre-hero-glow" aria-hidden="true" />

      {section.imageUrl && preset !== "minimal" && (
        <div className="landing-v2__pre-hero-visual" aria-hidden={preset === "image_behind"}>
          <FramedImage
            src={section.imageUrl}
            alt={section.imageAlt ?? ""}
            loading="eager"
            imageFocusX={section.imageFocusX}
            imageFocusY={section.imageFocusY}
            imageZoom={section.imageZoom}
          />
        </div>
      )}

      {foreground && preset !== "minimal" && (
        <div className="landing-v2__pre-hero-visual landing-v2__pre-hero-visual--foreground" aria-hidden>
          <FramedImage
            src={foreground.url}
            alt={foreground.alt}
            loading="eager"
            imageFocusX={foreground.imageFocusX}
            imageFocusY={foreground.imageFocusY}
            imageZoom={foreground.imageZoom}
          />
        </div>
      )}

      <div className="container-wide landing-v2__pre-hero-inner">{content}</div>
    </section>
  );
}
