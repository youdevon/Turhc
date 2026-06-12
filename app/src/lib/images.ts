import {
  DEFAULT_PROJECT_CARD_IMAGE,
  HERO_PAGE_TYPE_IMAGES,
  PROJECT_SECTOR_FALLBACK_IMAGES,
  type HeroPageType,
} from "@/data/stock-images";
import type { SiteSettings } from "./settings";

type ProjectImageSource = {
  featuredImage?: { url: string } | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  title: string;
  sector?: string;
};

type TenderImageSource = {
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  title: string;
};

type NewsImageSource = {
  featuredImage?: { url: string } | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  title: string;
};

export function getHeroImageFromSettings(
  settings: SiteSettings,
  pageType: HeroPageType
): string {
  const keyMap: Record<HeroPageType, keyof SiteSettings> = {
    about: "heroImageAbout",
    projects: "heroImageProjects",
    tenders: "heroImageTenders",
    contractors: "heroImageContractors",
    governance: "heroImageGovernance",
    news: "heroImageNews",
    contact: "heroImageContact",
    generic: "heroImageGeneric",
  };
  const value = settings[keyMap[pageType]];
  return value || HERO_PAGE_TYPE_IMAGES[pageType];
}

export function getProjectSectorFallbackImage(sector: string): string | undefined {
  if (PROJECT_SECTOR_FALLBACK_IMAGES[sector]) {
    return PROJECT_SECTOR_FALLBACK_IMAGES[sector];
  }

  const normalized = sector.toLowerCase();
  for (const [key, url] of Object.entries(PROJECT_SECTOR_FALLBACK_IMAGES)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return url;
    }
  }

  if (normalized.includes("road") || normalized.includes("highway") || normalized.includes("civil")) {
    return PROJECT_SECTOR_FALLBACK_IMAGES["Roads & Highways"];
  }
  if (normalized.includes("housing") || normalized.includes("residential")) {
    return PROJECT_SECTOR_FALLBACK_IMAGES.Housing;
  }
  if (
    normalized.includes("government") ||
    normalized.includes("civic") ||
    normalized.includes("community") ||
    normalized.includes("public")
  ) {
    return PROJECT_SECTOR_FALLBACK_IMAGES["Government Buildings"];
  }

  return undefined;
}

export function getProjectImageUrl(
  project: ProjectImageSource,
  fallbackUrl: string = DEFAULT_PROJECT_CARD_IMAGE
): string {
  const sectorFallback = project.sector ? getProjectSectorFallbackImage(project.sector) : undefined;
  return (
    project.featuredImage?.url ??
    project.featuredImageUrl ??
    sectorFallback ??
    fallbackUrl ??
    DEFAULT_PROJECT_CARD_IMAGE
  );
}

export function getProjectImageFallbacks(
  project: ProjectImageSource,
  fallbackUrl: string = DEFAULT_PROJECT_CARD_IMAGE
): string[] {
  const primary = getProjectImageUrl(project, fallbackUrl);
  const candidates = [
    project.featuredImageUrl,
    project.sector ? getProjectSectorFallbackImage(project.sector) : undefined,
    fallbackUrl,
    DEFAULT_PROJECT_CARD_IMAGE,
  ].filter((url): url is string => Boolean(url) && url !== primary);

  return [...new Set(candidates)];
}

export function getProjectImageAlt(project: ProjectImageSource): string {
  return project.featuredImageAlt ?? project.title;
}

export function getTenderHeroImageUrl(
  tender: TenderImageSource,
  fallbackUrl: string
): string {
  return tender.heroImageUrl ?? fallbackUrl;
}

export function getTenderHeroImageAlt(tender: TenderImageSource): string {
  return tender.heroImageAlt ?? tender.title;
}

export function getNewsImageUrl(post: NewsImageSource, fallbackUrl: string): string {
  return post.featuredImage?.url ?? post.featuredImageUrl ?? fallbackUrl;
}

export function getNewsImageAlt(post: NewsImageSource): string {
  return post.featuredImageAlt ?? post.title;
}
