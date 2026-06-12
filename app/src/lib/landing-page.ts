import { unstable_noStore as noStore, unstable_cache } from "next/cache";
import { ContentStatus } from "@prisma/client";
import { prisma } from "./db";
import { CACHE_TAGS } from "./cache-tags";
import { parseDraftJson } from "./content-draft";
import { HERO_SLIDES } from "@/data/hero-slides";
import { STOCK_IMAGES } from "@/data/stock-images";

export const LANDING_PAGE_SLUG = "home";

export const LANDING_SECTION_KEYS = {
  PRE_HERO: "pre_hero",
  WHO_WE_ARE: "who_we_are",
  MANDATE: "mandate",
  INFRASTRUCTURE: "infrastructure",
  STATS: "stats",
  TENDERS: "tenders",
  NEWS: "news",
  CONTRACTOR_CTA: "contractor_cta",
  GOVERNANCE: "governance",
  CONTACT_CTA: "contact_cta",
} as const;

export type LandingSectionKey = (typeof LANDING_SECTION_KEYS)[keyof typeof LANDING_SECTION_KEYS];

export type IntroImagePosition = "left" | "right" | "background" | "hidden";

export const DEFAULT_INTRO_SUPPORTING_IMAGE = STOCK_IMAGES.housing;

export type IntroSupportingImageSettings = {
  showImage?: boolean;
  imageCaption?: string | null;
  imagePosition?: IntroImagePosition;
  tagline?: string | null;
};

export type MandateCard = {
  icon: string;
  title: string;
  description: string;
};

export type ContractorFeature = {
  icon: string;
  label: string;
};

export type GovernanceLink = {
  href: string;
  title: string;
  description: string;
};


export type LandingHeroLayout = "contained" | "full_width";

export type LandingDisplayStyle = "current" | "experimental";

export type V2PreHeroPreset =
  | "soft_blueprint"
  | "floating_image"
  | "wide_scene"
  | "split"
  | "image_behind"
  | "minimal";

export type V2HeroPreset = "contained_cinematic" | "minimal_text";

export type QuickLink = {
  label: string;
  href: string;
  isActive?: boolean;
};

export type LandingHeroSettings = {
  enabled: boolean;
  layout: LandingHeroLayout;
  overlayStrength: number;
  slideDurationMs: number;
  zoomDurationMs: number;
  /** Legacy layout style marker (homepage always uses the designed layout at `/`) */
  landingDisplayStyle?: LandingDisplayStyle;
  /** Layout-only toggles for the designed homepage view */
  v2ShowPreHero?: boolean;
  v2PreHeroPreset?: V2PreHeroPreset;
  v2HeroPreset?: V2HeroPreset;
};

export type InfrastructureSectionSettings = {
  projectCount: number;
  featuredOnly: boolean;
  latestOnly: boolean;
};

export type TendersSectionSettings = {
  tenderCount: number;
  openOnly: boolean;
};

export type NewsSectionSettings = {
  newsCount: number;
};

export type LandingSectionContent = {
  sectionKey: LandingSectionKey;
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
  settings: Record<string, unknown>;
  displayOrder: number;
  isActive: boolean;
};

export type LandingStatItem = {
  id?: string;
  label: string;
  value: string;
  prefix: string | null;
  suffix: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type LandingHeroSlideInput = {
  id?: string;
  title: string;
  eyebrow: string | null;
  heading: string;
  subheading: string | null;
  primaryLabel: string | null;
  primaryUrl: string | null;
  secondaryLabel: string | null;
  secondaryUrl: string | null;
  mediaUrl: string;
  mediaAlt: string | null;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  overlayOpacity: number;
  sortOrder: number;
  isActive: boolean;
};

export type LandingPageContent = {
  pageId: string | null;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  status: ContentStatus;
  hero: LandingHeroSettings;
  sections: Record<LandingSectionKey, LandingSectionContent>;
  heroSlides: LandingHeroSlideInput[];
  statItems: LandingStatItem[];
};

const DEFAULT_HERO: LandingHeroSettings = {
  enabled: true,
  layout: "contained",
  overlayStrength: 0.55,
  slideDurationMs: 5000,
  zoomDurationMs: 1400,
};

function section(
  key: LandingSectionKey,
  data: Partial<LandingSectionContent> & Pick<LandingSectionContent, "sectionTitle">
): LandingSectionContent {
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

export const LANDING_PAGE_DEFAULTS: LandingPageContent = {
  pageId: null,
  title: "Landing Page",
  metaTitle: null,
  metaDescription: null,
  status: ContentStatus.PUBLISHED,
  hero: DEFAULT_HERO,
  heroSlides: HERO_SLIDES.map((slide, index) => ({
    title: `Hero ${index + 1}`,
    eyebrow: slide.eyebrow,
    heading: slide.title,
    subheading: slide.subtitle,
    primaryLabel: slide.primaryButtonLabel,
    primaryUrl: slide.primaryButtonUrl,
    secondaryLabel: slide.secondaryButtonLabel,
    secondaryUrl: slide.secondaryButtonUrl,
    mediaUrl: slide.imageUrl,
    mediaAlt: slide.title,
    overlayOpacity: 0.55,
    sortOrder: index,
    isActive: true,
  })),
  statItems: [
    { label: "Active Projects", value: "24", prefix: null, suffix: null, icon: null, displayOrder: 0, isActive: true },
    { label: "Capital Deployed", value: "$4.2B", prefix: null, suffix: null, icon: null, displayOrder: 1, isActive: true },
    { label: "On-Time Delivery", value: "92", prefix: null, suffix: "%", icon: null, displayOrder: 2, isActive: true },
    { label: "Contractors Registered", value: "380", prefix: null, suffix: "+", icon: null, displayOrder: 3, isActive: true },
  ],
  sections: {
    [LANDING_SECTION_KEYS.PRE_HERO]: section(LANDING_SECTION_KEYS.PRE_HERO, {
      eyebrow: "Tobago Development",
      sectionTitle: "Building Communities. Delivering Housing. Strengthening Tobago.",
    }),
    [LANDING_SECTION_KEYS.WHO_WE_ARE]: section(LANDING_SECTION_KEYS.WHO_WE_ARE, {
      eyebrow: "Who We Are",
      sectionTitle: "A trusted partner in",
      body: "The National Infrastructure Delivery Corporation is a special-purpose state enterprise established to accelerate the delivery of critical public infrastructure. We combine government accountability with private-sector efficiency.",
      imageUrl: DEFAULT_INTRO_SUPPORTING_IMAGE,
      imageAlt: "Residential housing and community infrastructure development",
      settings: {
        headingEmphasis: "national development",
        showImage: true,
        imagePosition: "right",
        imageCaption: null,
        tagline: "Building the foundations of tomorrow",
      } satisfies IntroSupportingImageSettings & { headingEmphasis: string },
    }),
    [LANDING_SECTION_KEYS.MANDATE]: section(LANDING_SECTION_KEYS.MANDATE, {
      eyebrow: "Our Mandate",
      sectionTitle: "Delivering infrastructure",
      body: "We are mandated to plan, procure, and deliver major public infrastructure projects on behalf of the state, ensuring transparency, value for money, and world-class engineering standards.",
      settings: {
        headingEmphasis: "that serves the public good",
        cards: [
          { icon: "Shield", title: "Accountability", description: "Full transparency in procurement and delivery." },
          { icon: "BarChart3", title: "Value for Money", description: "Rigorous cost control and performance monitoring." },
          { icon: "Scale", title: "Fair Procurement", description: "Open, competitive tendering for all qualified contractors." },
        ] satisfies MandateCard[],
      },
    }),
    [LANDING_SECTION_KEYS.INFRASTRUCTURE]: section(LANDING_SECTION_KEYS.INFRASTRUCTURE, {
      eyebrow: "Infrastructure",
      sectionTitle: "Featured Infrastructure",
      subtitle:
        "A snapshot of current and recent major delivery initiatives — housing, civil works, and public facilities shaping communities across the nation.",
      ctaLabel: "View all projects",
      ctaHref: "/projects",
      settings: {
        headingEmphasis: "Across the Nation",
        projectCount: 3,
        featuredOnly: true,
        latestOnly: true,
        buttonLabel: "View All Projects",
        buttonLink: "/projects",
      } satisfies InfrastructureSectionSettings & {
        headingEmphasis: string;
        buttonLabel: string;
        buttonLink: string;
      },
    }),
    [LANDING_SECTION_KEYS.STATS]: section(LANDING_SECTION_KEYS.STATS, {
      eyebrow: "Performance",
      sectionTitle: "Project Delivery at a Glance",
      subtitle: null,
    }),
    [LANDING_SECTION_KEYS.TENDERS]: section(LANDING_SECTION_KEYS.TENDERS, {
      eyebrow: "Procurement",
      sectionTitle: "Current Tenders",
      subtitle: "Open opportunities for qualified contractors.",
      ctaLabel: "View all tenders",
      ctaHref: "/tenders",
      settings: {
        headingEmphasis: "Open Now",
        tenderCount: 4,
        openOnly: true,
        buttonLabel: "View all tenders",
        buttonLink: "/tenders",
      } satisfies TendersSectionSettings & {
        headingEmphasis: string;
        buttonLabel: string;
        buttonLink: string;
      },
    }),
    [LANDING_SECTION_KEYS.NEWS]: section(LANDING_SECTION_KEYS.NEWS, {
      eyebrow: "Updates",
      sectionTitle: "News & Public Notices",
      subtitle: null,
      ctaLabel: "View all news",
      ctaHref: "/news",
      settings: { headingEmphasis: "and Insights", newsCount: 3 } satisfies NewsSectionSettings & {
        headingEmphasis: string;
      },
    }),
    [LANDING_SECTION_KEYS.CONTRACTOR_CTA]: section(LANDING_SECTION_KEYS.CONTRACTOR_CTA, {
      eyebrow: "Contractors",
      sectionTitle: "Register to bid",
      body: "Join our prequalified contractor database to receive tender alerts and participate in competitive procurement for major infrastructure projects.",
      ctaLabel: "Registration Requirements",
      ctaHref: "/contractors/registration",
      settings: {
        headingEmphasis: "on public infrastructure",
        secondaryCtaLabel: "Contractor Portal",
        secondaryCtaHref: "/contractors",
        features: [
          { icon: "Users", label: "Prequalification" },
          { icon: "FileText", label: "Work Categories" },
          { icon: "Mail", label: "Tender Alerts" },
          { icon: "HardHat", label: "How to Bid" },
        ] satisfies ContractorFeature[],
      },
    }),
    [LANDING_SECTION_KEYS.GOVERNANCE]: section(LANDING_SECTION_KEYS.GOVERNANCE, {
      eyebrow: "Transparency",
      sectionTitle: "Governance &",
      subtitle: "We are committed to open governance, ethical procurement, and public accountability.",
      settings: {
        headingEmphasis: "Accountability",
        links: [
          { href: "/governance/board", title: "Board of Directors", description: "Corporate governance leadership" },
          { href: "/governance/annual-reports", title: "Annual Reports", description: "Financial and operational reports" },
          { href: "/governance/procurement-policies", title: "Procurement Policies", description: "Rules and guidelines" },
          { href: "/governance/freedom-of-information", title: "Freedom of Information", description: "Access public records" },
        ] satisfies GovernanceLink[],
      },
    }),
    [LANDING_SECTION_KEYS.CONTACT_CTA]: section(LANDING_SECTION_KEYS.CONTACT_CTA, {
      sectionTitle: "Get in Touch",
      subtitle: "For enquiries about projects, tenders, or contractor registration, contact our team.",
      ctaLabel: "Contact Us",
      ctaHref: "/contact",
    }),
  },
};

function parseSettings(json: string | null | undefined): Record<string, unknown> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const V2_PRE_HERO_PRESETS: V2PreHeroPreset[] = [
  "soft_blueprint",
  "floating_image",
  "wide_scene",
  "split",
  "image_behind",
  "minimal",
];

const V2_HERO_PRESETS: V2HeroPreset[] = ["contained_cinematic", "minimal_text"];

function parseHeroSettings(json: string | null | undefined): LandingHeroSettings {
  const parsed = parseSettings(json);
  const landingDisplayStyle =
    parsed.landingDisplayStyle === "experimental" ? "experimental" : "current";
  const v2PreHeroPreset = V2_PRE_HERO_PRESETS.includes(parsed.v2PreHeroPreset as V2PreHeroPreset)
    ? (parsed.v2PreHeroPreset as V2PreHeroPreset)
    : "soft_blueprint";
  const v2HeroPreset = V2_HERO_PRESETS.includes(parsed.v2HeroPreset as V2HeroPreset)
    ? (parsed.v2HeroPreset as V2HeroPreset)
    : "contained_cinematic";

  return {
    enabled: parsed.enabled !== false,
    layout: parsed.layout === "full_width" ? "full_width" : "contained",
    overlayStrength: typeof parsed.overlayStrength === "number" ? parsed.overlayStrength : DEFAULT_HERO.overlayStrength,
    slideDurationMs:
      typeof parsed.slideDurationMs === "number" ? parsed.slideDurationMs : DEFAULT_HERO.slideDurationMs,
    zoomDurationMs:
      typeof parsed.zoomDurationMs === "number" ? parsed.zoomDurationMs : DEFAULT_HERO.zoomDurationMs,
    landingDisplayStyle,
    v2ShowPreHero: parsed.v2ShowPreHero !== false,
    v2PreHeroPreset,
    v2HeroPreset,
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
): Record<LandingSectionKey, LandingSectionContent> {
  const merged = { ...LANDING_PAGE_DEFAULTS.sections };

  for (const row of dbSections) {
    const key = row.sectionKey as LandingSectionKey;
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

export type LandingContentMode = "public" | "preview" | "admin";

export type LandingPageContentWithMeta = LandingPageContent & {
  hasDraft?: boolean;
};

type LandingPageRow = NonNullable<
  Awaited<ReturnType<typeof prisma.page.findUnique>>
> & {
  sections: Array<{
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
  }>;
  heroSlides: Array<{
    id: string;
    title: string;
    eyebrow: string | null;
    heading: string;
    subheading: string | null;
    primaryLabel: string | null;
    primaryUrl: string | null;
    secondaryLabel: string | null;
    secondaryUrl: string | null;
    mediaUrl: string;
    mediaAlt: string | null;
    imageFocusX: number;
    imageFocusY: number;
    imageZoom: number;
    overlayOpacity: number;
    sortOrder: number;
    isActive: boolean;
    status: ContentStatus;
  }>;
  statItems: Array<{
    id: string;
    label: string;
    value: string;
    prefix: string | null;
    suffix: string | null;
    icon: string | null;
    displayOrder: number;
    isActive: boolean;
  }>;
};

function buildLandingContentFromPage(page: LandingPageRow): LandingPageContent {
  const slides =
    page.heroSlides.length > 0
      ? page.heroSlides.map((slide) => ({
          id: slide.id,
          title: slide.title,
          eyebrow: slide.eyebrow,
          heading: slide.heading,
          subheading: slide.subheading,
          primaryLabel: slide.primaryLabel,
          primaryUrl: slide.primaryUrl,
          secondaryLabel: slide.secondaryLabel,
          secondaryUrl: slide.secondaryUrl,
          mediaUrl: slide.mediaUrl,
          mediaAlt: slide.mediaAlt,
          imageFocusX: slide.imageFocusX,
          imageFocusY: slide.imageFocusY,
          imageZoom: slide.imageZoom,
          overlayOpacity: slide.overlayOpacity,
          sortOrder: slide.sortOrder,
          isActive: slide.isActive && slide.status === ContentStatus.PUBLISHED,
        }))
      : LANDING_PAGE_DEFAULTS.heroSlides;

  const stats =
    page.statItems.length > 0
      ? page.statItems.map((item) => ({
          id: item.id,
          label: item.label,
          value: item.value,
          prefix: item.prefix,
          suffix: item.suffix,
          icon: item.icon,
          displayOrder: item.displayOrder,
          isActive: item.isActive,
        }))
      : LANDING_PAGE_DEFAULTS.statItems;

  return {
    pageId: page.id,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    status: page.status,
    hero: parseHeroSettings(page.settingsJson),
    sections: mergeSections(page.sections),
    heroSlides: slides,
    statItems: stats,
  };
}

async function loadLandingPageRow() {
  return prisma.page.findUnique({
    where: { slug: LANDING_PAGE_SLUG },
    include: {
      sections: { orderBy: { displayOrder: "asc" } },
      heroSlides: { orderBy: { sortOrder: "asc" } },
      statItems: { orderBy: { displayOrder: "asc" } },
    },
  });
}

export async function getLandingPageContent(
  mode: LandingContentMode = "public"
): Promise<LandingPageContentWithMeta> {
  if (mode === "preview" || mode === "admin") {
    noStore();
    return loadLandingPageContent(mode);
  }

  return getLandingPageContentPublicCached();
}

async function loadLandingPageContent(
  mode: LandingContentMode
): Promise<LandingPageContentWithMeta> {
  const page = await loadLandingPageRow();
  if (!page) {
    return { ...LANDING_PAGE_DEFAULTS, hasDraft: false };
  }

  const published = buildLandingContentFromPage(page as LandingPageRow);
  const draft = parseDraftJson<LandingPageContent>(page.draftData);
  const hasDraft = Boolean(draft);

  if (mode === "preview") {
    if (draft) return { ...published, ...draft, status: ContentStatus.PUBLISHED, hasDraft: true };
    return { ...published, hasDraft: false };
  }

  if (mode === "admin") {
    if (draft) return { ...published, ...draft, hasDraft: true };
    return { ...published, hasDraft: false };
  }

  if (page.status !== ContentStatus.PUBLISHED) {
    return { ...LANDING_PAGE_DEFAULTS, hasDraft: false };
  }

  return { ...published, hasDraft: false };
}

const getLandingPageContentPublicCached = unstable_cache(
  () => loadLandingPageContent("public"),
  ["landing-page-public"],
  { tags: [CACHE_TAGS.landing], revalidate: 3600 }
);

export function getSection<T extends LandingSectionKey>(
  content: LandingPageContent,
  key: T
): LandingSectionContent {
  return content.sections[key] ?? LANDING_PAGE_DEFAULTS.sections[key];
}

export function formatStatValue(item: LandingStatItem): string {
  return `${item.prefix ?? ""}${item.value}${item.suffix ?? ""}`;
}

export function getIntroImageSettings(
  section: LandingSectionContent
): Required<Pick<IntroSupportingImageSettings, "showImage" | "imagePosition">> &
  IntroSupportingImageSettings {
  const settings = section.settings as IntroSupportingImageSettings;
  return {
    showImage: settings.showImage !== false,
    imagePosition: settings.imagePosition ?? "right",
    imageCaption: settings.imageCaption ?? null,
    tagline: settings.tagline ?? null,
  };
}

export function resolveIntroImageUrl(section: LandingSectionContent): string {
  return section.imageUrl?.trim() || DEFAULT_INTRO_SUPPORTING_IMAGE;
}

export function shouldShowIntroImage(section: LandingSectionContent): boolean {
  const { showImage, imagePosition } = getIntroImageSettings(section);
  return showImage && imagePosition !== "hidden";
}

export function getSectionHeadingEmphasis(section: LandingSectionContent): string | null {
  const value = section.settings.headingEmphasis ?? section.settings.accentText;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** @deprecated Use `getSectionHeadingEmphasis` */
export function getSectionAccentText(section: LandingSectionContent): string | null {
  return getSectionHeadingEmphasis(section);
}

export function getPreHeroQuickLinks(
  preHero: LandingSectionContent,
  governanceLinks: GovernanceLink[] = []
): QuickLink[] {
  const fromSettings = preHero.settings.quickLinks;
  if (Array.isArray(fromSettings) && fromSettings.length > 0) {
    return fromSettings
      .filter(
        (item): item is QuickLink =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as QuickLink).label === "string" &&
          typeof (item as QuickLink).href === "string" &&
          (item as QuickLink).isActive !== false
      )
      .map((item) => ({ label: item.label, href: item.href }));
  }

  if (governanceLinks.length > 0) {
    return governanceLinks.slice(0, 5).map((link) => ({
      label: link.title,
      href: link.href,
    }));
  }

  return [
    { label: "Projects", href: "/projects" },
    { label: "Tenders", href: "/tenders" },
    { label: "News", href: "/news" },
    { label: "Governance", href: "/governance/board" },
    { label: "Contact", href: "/contact" },
  ];
}
