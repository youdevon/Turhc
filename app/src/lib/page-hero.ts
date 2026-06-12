import { prisma } from "./db";
import { ContentStatus } from "@prisma/client";
import { PAGE_HERO_DEFAULTS, type HeroPageType } from "@/data/stock-images";
import { getSiteSettings } from "./settings";
import { getHeroImageFromSettings } from "./images";

export type PageHeroConfig = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlt: string;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  overlayStrength: number;
  ctaLabel?: string;
  ctaHref?: string;
};

export type PageHeroOverrides = Partial<
  Omit<PageHeroConfig, "imageUrl" | "imageAlt" | "overlayStrength">
> & {
  imageUrl?: string;
  imageAlt?: string;
  overlayStrength?: number;
  pageType?: HeroPageType;
};

export async function getPageHeroBySlug(
  slug: string,
  overrides?: PageHeroOverrides
): Promise<PageHeroConfig> {
  const defaults = PAGE_HERO_DEFAULTS[slug];
  const pageType = overrides?.pageType ?? defaults?.pageType ?? "generic";

  const [page, settings] = await Promise.all([
    prisma.page.findFirst({
      where: { slug, status: ContentStatus.PUBLISHED },
    }),
    getSiteSettings(),
  ]);

  const fallbackImage = getHeroImageFromSettings(settings, pageType);
  const overlayDefault = parseFloat(settings.heroOverlayDarkness) || 0.55;

  return {
    eyebrow: overrides?.eyebrow ?? page?.heroEyebrow ?? defaults?.eyebrow,
    title: overrides?.title ?? page?.heroTitle ?? page?.title ?? defaults?.title ?? slug,
    subtitle: overrides?.subtitle ?? page?.heroSubtitle ?? page?.summary ?? defaults?.subtitle,
    imageUrl: overrides?.imageUrl ?? page?.heroImageUrl ?? fallbackImage,
    imageAlt:
      overrides?.imageAlt ??
      page?.heroImageAlt ??
      page?.heroTitle ??
      page?.title ??
      defaults?.title ??
      "Page banner",
    imageFocusX: page?.heroImageFocusX ?? 50,
    imageFocusY: page?.heroImageFocusY ?? 50,
    imageZoom: page?.heroImageZoom ?? 100,
    overlayStrength:
      overrides?.overlayStrength ??
      page?.heroOverlayStrength ??
      overlayDefault,
    ctaLabel: overrides?.ctaLabel ?? page?.heroCtaLabel ?? undefined,
    ctaHref: overrides?.ctaHref ?? page?.heroCtaHref ?? undefined,
  };
}
