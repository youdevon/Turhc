import { unstable_noStore as noStore, unstable_cache } from "next/cache";
import { ContentStatus } from "@prisma/client";
import { prisma } from "./db";
import { CACHE_TAGS } from "./cache-tags";
import { parseDraftJson } from "./content-draft";
import { STOCK_IMAGES } from "@/data/stock-images";
import {
  type V2EmphasisPreset,
  type V2HeadingSize,
  type V2HeadingStyle,
  type V2HeroOverlayPreset,
  type V2VisualPreset,
  resolveV2EmphasisColor,
} from "./landing-page-v2-presets";

export const LANDING_V2_PAGE_SLUG = "landing-v2";

export const LANDING_V2_SECTION_KEYS = {
  PRE_HERO: "v2_pre_hero",
  HERO: "v2_hero",
  INFRASTRUCTURE: "v2_infrastructure",
  HOUSING: "v2_housing",
  TENDERS: "v2_tenders",
  NEWS: "v2_news",
  GOVERNANCE: "v2_governance",
  CONTACT_CTA: "v2_contact_cta",
} as const;

export type LandingV2SectionKey =
  (typeof LANDING_V2_SECTION_KEYS)[keyof typeof LANDING_V2_SECTION_KEYS];

export type LandingV2QuickLink = {
  label: string;
  href: string;
  isActive?: boolean;
};

export type LandingV2SceneVariant = "default" | "soft" | "blueprint" | "image-led";

export type LandingV2SectionSettings = {
  headingEmphasis?: string | null;
  headingStyle?: V2HeadingStyle;
  headingSize?: V2HeadingSize;
  emphasisPreset?: V2EmphasisPreset;
  visualPreset?: V2VisualPreset;
  sceneVariant?: LandingV2SceneVariant;
  foregroundImageUrl?: string | null;
  foregroundImageAlt?: string | null;
  foregroundImageFocusX?: number;
  foregroundImageFocusY?: number;
  foregroundImageZoom?: number;
  quickLinks?: LandingV2QuickLink[];
  projectCount?: number;
  featuredOnly?: boolean;
  housingCount?: number;
  tenderCount?: number;
  openOnly?: boolean;
  newsCount?: number;
  governanceSource?: "leadership" | "board";
  governanceCount?: number;
  overlayPreset?: V2HeroOverlayPreset;
  buttonLabel?: string;
  buttonLink?: string;
  [key: string]: unknown;
};

export type LandingV2SectionContent = {
  sectionKey: LandingV2SectionKey;
  sectionTitle: string | null;
  eyebrow: string | null;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  ctaLabel: string | null;
  ctaHref: string | null;
  settings: LandingV2SectionSettings;
  displayOrder: number;
  isActive: boolean;
};

export type LandingV2PageSettings = {
  showPreHero: boolean;
};

export type LandingV2PageContent = {
  pageId: string | null;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  status: ContentStatus;
  settings: LandingV2PageSettings;
  sections: Record<LandingV2SectionKey, LandingV2SectionContent>;
};

export type LandingV2ContentMode = "public" | "preview" | "admin";

export type LandingV2PageContentWithMeta = LandingV2PageContent & {
  hasDraft?: boolean;
};

function section(
  key: LandingV2SectionKey,
  data: Partial<LandingV2SectionContent> & Pick<LandingV2SectionContent, "sectionTitle">
): LandingV2SectionContent {
  return {
    sectionKey: key,
    sectionTitle: data.sectionTitle,
    eyebrow: data.eyebrow ?? null,
    subtitle: data.subtitle ?? null,
    body: data.body ?? null,
    imageUrl: data.imageUrl ?? null,
    imageAlt: data.imageAlt ?? null,
    imageFocusX: data.imageFocusX ?? 50,
    imageFocusY: data.imageFocusY ?? 50,
    imageZoom: data.imageZoom ?? 100,
    ctaLabel: data.ctaLabel ?? null,
    ctaHref: data.ctaHref ?? null,
    settings: data.settings ?? {},
    displayOrder: data.displayOrder ?? 0,
    isActive: data.isActive ?? true,
  };
}

const DEFAULT_PAGE_SETTINGS: LandingV2PageSettings = {
  showPreHero: true,
};

export const LANDING_V2_DEFAULTS: LandingV2PageContent = {
  pageId: null,
  title: "Landing Page V2",
  metaTitle: "Tobago Development",
  metaDescription:
    "Explore housing programmes, infrastructure projects, public tenders, and governance updates from one trusted digital platform.",
  status: ContentStatus.PUBLISHED,
  settings: DEFAULT_PAGE_SETTINGS,
  sections: {
    [LANDING_V2_SECTION_KEYS.PRE_HERO]: section(LANDING_V2_SECTION_KEYS.PRE_HERO, {
      displayOrder: 0,
      eyebrow: "Tobago Development",
      sectionTitle: "Building Communities. Delivering Housing.",
      body: "Explore housing programmes, infrastructure projects, public tenders, and governance updates from one trusted digital platform.",
      imageUrl: STOCK_IMAGES.housing,
      imageAlt: "Community housing and infrastructure in Tobago",
      settings: {
        headingEmphasis: "Strengthening Tobago.",
        visualPreset: "soft_blueprint",
        quickLinks: [
          { label: "Housing Schemes", href: "/projects" },
          { label: "Infrastructure Projects", href: "/projects" },
          { label: "Tenders", href: "/tenders" },
          { label: "Governance", href: "/governance/board" },
          { label: "Public Services", href: "/contact" },
        ],
      },
    }),
    [LANDING_V2_SECTION_KEYS.HERO]: section(LANDING_V2_SECTION_KEYS.HERO, {
      displayOrder: 1,
      eyebrow: "Tobago Development",
      sectionTitle: "Delivering infrastructure",
      subtitle: "Housing, civil works, and public facilities shaping communities across Tobago.",
      imageUrl: STOCK_IMAGES.construction,
      imageAlt: "Infrastructure development project",
      ctaLabel: "View projects",
      ctaHref: "/projects",
      settings: {
        headingEmphasis: "for every community",
        visualPreset: "contained_cinematic",
        overlayPreset: "medium",
      },
    }),
    [LANDING_V2_SECTION_KEYS.INFRASTRUCTURE]: section(LANDING_V2_SECTION_KEYS.INFRASTRUCTURE, {
      displayOrder: 2,
      eyebrow: "Infrastructure",
      sectionTitle: "Featured Infrastructure",
      subtitle:
        "Major delivery initiatives — civil works and public facilities shaping communities across Tobago.",
      ctaLabel: "View all projects",
      ctaHref: "/projects",
      settings: {
        headingEmphasis: "Across Tobago",
        headingStyle: "editorial_serif",
        headingSize: "large",
        sceneVariant: "default",
        projectCount: 3,
        featuredOnly: true,
        buttonLabel: "View All Projects",
        buttonLink: "/projects",
      },
    }),
    [LANDING_V2_SECTION_KEYS.HOUSING]: section(LANDING_V2_SECTION_KEYS.HOUSING, {
      displayOrder: 3,
      eyebrow: "Housing",
      sectionTitle: "Housing Programmes",
      subtitle: "Affordable housing schemes and residential delivery supporting families across the island.",
      ctaLabel: "Explore housing",
      ctaHref: "/projects",
      settings: {
        headingEmphasis: "& Services",
        headingStyle: "editorial_serif",
        sceneVariant: "soft",
        housingCount: 3,
        buttonLabel: "View housing projects",
        buttonLink: "/projects",
      },
    }),
    [LANDING_V2_SECTION_KEYS.TENDERS]: section(LANDING_V2_SECTION_KEYS.TENDERS, {
      displayOrder: 4,
      eyebrow: "Procurement",
      sectionTitle: "Active Tenders",
      subtitle: "Open opportunities for qualified contractors.",
      ctaLabel: "View all tenders",
      ctaHref: "/tenders",
      settings: {
        headingEmphasis: "Open Now",
        sceneVariant: "blueprint",
        tenderCount: 2,
        openOnly: true,
      },
    }),
    [LANDING_V2_SECTION_KEYS.NEWS]: section(LANDING_V2_SECTION_KEYS.NEWS, {
      displayOrder: 5,
      eyebrow: "Updates",
      sectionTitle: "News & Public Notices",
      subtitle: "Latest announcements and project updates.",
      ctaLabel: "View all news",
      ctaHref: "/news",
      settings: {
        headingEmphasis: "and Insights",
        sceneVariant: "default",
        newsCount: 3,
      },
    }),
    [LANDING_V2_SECTION_KEYS.GOVERNANCE]: section(LANDING_V2_SECTION_KEYS.GOVERNANCE, {
      displayOrder: 6,
      eyebrow: "Leadership",
      sectionTitle: "Governance &",
      subtitle: "Committed to open governance, ethical procurement, and public accountability.",
      ctaLabel: "View leadership",
      ctaHref: "/governance/leadership",
      settings: {
        headingEmphasis: "Accountability",
        headingStyle: "editorial_serif",
        sceneVariant: "blueprint",
        governanceSource: "leadership",
        governanceCount: 4,
      },
    }),
    [LANDING_V2_SECTION_KEYS.CONTACT_CTA]: section(LANDING_V2_SECTION_KEYS.CONTACT_CTA, {
      displayOrder: 7,
      sectionTitle: "Get in Touch",
      subtitle: "For enquiries about projects, tenders, or contractor registration, contact our team.",
      ctaLabel: "Contact Us",
      ctaHref: "/contact",
      settings: {
        sceneVariant: "blueprint",
        headingStyle: "cta_bold",
      },
    }),
  },
};

function parseSettings(json: string | null | undefined): LandingV2SectionSettings {
  if (!json) return {};
  try {
    return JSON.parse(json) as LandingV2SectionSettings;
  } catch {
    return {};
  }
}

function parsePageSettings(json: string | null | undefined): LandingV2PageSettings {
  const parsed = parseSettings(json);
  return {
    showPreHero: parsed.showPreHero !== false,
  };
}

function mergeSections(
  dbSections: Array<{
    sectionKey: string;
    sectionTitle: string | null;
    eyebrow: string | null;
    subtitle: string | null;
    body: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    imageFocusX: number;
    imageFocusY: number;
    imageZoom: number;
    ctaLabel: string | null;
    ctaHref: string | null;
    settingsJson: string | null;
    displayOrder: number;
    isActive: boolean;
  }>
): Record<LandingV2SectionKey, LandingV2SectionContent> {
  const merged = { ...LANDING_V2_DEFAULTS.sections };

  for (const row of dbSections) {
    const key = row.sectionKey as LandingV2SectionKey;
    if (!(key in merged)) continue;
    const defaults = merged[key];
    merged[key] = {
      sectionKey: key,
      sectionTitle: row.sectionTitle ?? defaults.sectionTitle,
      eyebrow: row.eyebrow ?? defaults.eyebrow,
      subtitle: row.subtitle ?? defaults.subtitle,
      body: row.body ?? defaults.body,
      imageUrl: row.imageUrl ?? defaults.imageUrl,
      imageAlt: row.imageAlt ?? defaults.imageAlt,
      imageFocusX: row.imageFocusX ?? defaults.imageFocusX ?? 50,
      imageFocusY: row.imageFocusY ?? defaults.imageFocusY ?? 50,
      imageZoom: row.imageZoom ?? defaults.imageZoom ?? 100,
      ctaLabel: row.ctaLabel ?? defaults.ctaLabel,
      ctaHref: row.ctaHref ?? defaults.ctaHref,
      settings: { ...defaults.settings, ...parseSettings(row.settingsJson) },
      displayOrder: row.displayOrder,
      isActive: row.isActive,
    };
  }

  return merged;
}

type LandingV2PageRow = NonNullable<Awaited<ReturnType<typeof loadLandingV2PageRow>>>;

function buildLandingV2ContentFromPage(page: LandingV2PageRow): LandingV2PageContent {
  return {
    pageId: page.id,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    status: page.status,
    settings: parsePageSettings(page.settingsJson),
    sections: mergeSections(page.sections),
  };
}

async function loadLandingV2PageRow() {
  return prisma.page.findUnique({
    where: { slug: LANDING_V2_PAGE_SLUG },
    include: {
      sections: { orderBy: { displayOrder: "asc" } },
    },
  });
}

async function loadLandingV2PageContent(
  mode: LandingV2ContentMode
): Promise<LandingV2PageContentWithMeta> {
  const page = await loadLandingV2PageRow();
  if (!page) {
    return { ...LANDING_V2_DEFAULTS, hasDraft: false };
  }

  const published = buildLandingV2ContentFromPage(page);
  const draft = parseDraftJson<LandingV2PageContent>(page.draftData);
  const hasDraft = Boolean(draft);

  if (mode === "preview") {
    if (draft) {
      return {
        ...published,
        ...draft,
        sections: { ...published.sections, ...draft.sections },
        settings: { ...published.settings, ...draft.settings },
        status: ContentStatus.PUBLISHED,
        hasDraft: true,
      };
    }
    return { ...published, hasDraft: false };
  }

  if (mode === "admin") {
    if (draft) {
      return {
        ...published,
        ...draft,
        sections: { ...published.sections, ...draft.sections },
        settings: { ...published.settings, ...draft.settings },
        hasDraft: true,
      };
    }
    return { ...published, hasDraft: false };
  }

  if (page.status !== ContentStatus.PUBLISHED) {
    return { ...LANDING_V2_DEFAULTS, hasDraft: false };
  }

  return { ...published, hasDraft: false };
}

const getLandingV2PageContentPublicCached = unstable_cache(
  () => loadLandingV2PageContent("public"),
  ["landing-v2-page-public"],
  { tags: [CACHE_TAGS.landingV2], revalidate: 3600 }
);

export async function getLandingV2PageContent(
  mode: LandingV2ContentMode = "public"
): Promise<LandingV2PageContentWithMeta> {
  if (mode === "preview" || mode === "admin") {
    noStore();
    return loadLandingV2PageContent(mode);
  }

  return getLandingV2PageContentPublicCached();
}

export function getV2Section<T extends LandingV2SectionKey>(
  content: LandingV2PageContent,
  key: T
): LandingV2SectionContent {
  return content.sections[key] ?? LANDING_V2_DEFAULTS.sections[key];
}

export function getV2SectionHeadingEmphasis(section: LandingV2SectionContent): string | null {
  const value = section.settings.headingEmphasis ?? section.settings.accentText;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getV2QuickLinks(preHero: LandingV2SectionContent): LandingV2QuickLink[] {
  const fromSettings = preHero.settings.quickLinks;
  if (Array.isArray(fromSettings) && fromSettings.length > 0) {
    return fromSettings
      .filter(
        (item): item is LandingV2QuickLink =>
          typeof item === "object" &&
          item !== null &&
          typeof item.label === "string" &&
          typeof item.href === "string" &&
          item.isActive !== false
      )
      .map((item) => ({ label: item.label, href: item.href }));
  }

  return [
    { label: "Housing Schemes", href: "/projects" },
    { label: "Infrastructure Projects", href: "/projects" },
    { label: "Tenders", href: "/tenders" },
    { label: "Governance", href: "/governance/board" },
    { label: "Public Services", href: "/contact" },
  ];
}

export function getV2ForegroundImage(section: LandingV2SectionContent): {
  url: string;
  alt: string;
  imageFocusX: number;
  imageFocusY: number;
  imageZoom: number;
} | null {
  const url = (section.settings.foregroundImageUrl as string | undefined)?.trim();
  if (!url) return null;
  return {
    url,
    alt: (section.settings.foregroundImageAlt as string | undefined)?.trim() || section.imageAlt || "",
    imageFocusX: section.settings.foregroundImageFocusX ?? 50,
    imageFocusY: section.settings.foregroundImageFocusY ?? 50,
    imageZoom: section.settings.foregroundImageZoom ?? 100,
  };
}

export function getV2EmphasisColorVariant(
  section: LandingV2SectionContent
): "blue" | "gold" | "inherit" | undefined {
  const preset = section.settings.emphasisPreset;
  if (!preset || preset === "none") return undefined;
  const resolved = resolveV2EmphasisColor(preset);
  return resolved ?? undefined;
}

export function getV2PreHeroCssPreset(visualPreset?: V2VisualPreset): string {
  switch (visualPreset) {
    case "floating_image_right":
      return "floating_image";
    case "wide_image_scene":
      return "wide_scene";
    case "split_text_image":
      return "split";
    case "image_behind_text":
      return "image_behind";
    case "minimal_text_only":
      return "minimal";
    case "soft_blueprint":
    default:
      return "soft_blueprint";
  }
}
