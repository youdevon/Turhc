import { HeroCarousel } from "./HeroCarousel";
import type { HeroSlide } from "@/data/hero-slides";
import type { LandingHeroLayout } from "@/lib/landing-page";
import { cn } from "@/lib/utils";

type Props = {
  slides: HeroSlide[];
  layout?: LandingHeroLayout;
  heroOverlayDarkness?: number;
  slideIntervalMs?: number;
  fadeDurationMs?: number;
  zoomDurationMs?: number;
  enabled?: boolean;
  overlap?: boolean;
};

export function HeroSectionV2({
  slides,
  layout = "contained",
  heroOverlayDarkness = 0.55,
  slideIntervalMs = 5000,
  fadeDurationMs = 1400,
  zoomDurationMs = 10000,
  enabled = true,
  overlap = false,
}: Props) {
  return (
    <div
      className={cn(
        "landing-v2__hero",
        overlap && "landing-v2__hero--after-pre-hero"
      )}
    >
      <HeroCarousel
        slides={slides}
        layout={layout}
        heroOverlayDarkness={heroOverlayDarkness}
        slideIntervalMs={slideIntervalMs}
        fadeDurationMs={fadeDurationMs}
        zoomDurationMs={zoomDurationMs}
        enabled={enabled && slides.length > 1}
      />
    </div>
  );
}
