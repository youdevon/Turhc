import { unstable_noStore as noStore, unstable_cache } from "next/cache";
import { ContentStatus } from "@prisma/client";
import { prisma } from "./db";
import { CACHE_TAGS } from "./cache-tags";
import { parseDraftJson } from "./content-draft";
import { PAGE_HERO_DEFAULTS } from "@/data/stock-images";
import { STOCK_IMAGES } from "@/data/stock-images";

export const ABOUT_PAGE_SLUG = "about";

export const ABOUT_SECTION_KEYS = {
  WHO_WE_ARE: "who_we_are",
  LEADERSHIP: "leadership",
} as const;

export type AboutSectionKey = (typeof ABOUT_SECTION_KEYS)[keyof typeof ABOUT_SECTION_KEYS];

export type AboutSectionContent = {
  sectionKey: AboutSectionKey;
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
  settings: Record<string, unknown>;
  displayOrder: number;
  isActive: boolean;
};

export type AboutStatItem = {
  id?: string;
  label: string;
  value: string;
  prefix: string | null;
  suffix: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type AboutPageImageSettings = {
  accentImageUrl: string | null;
  accentImageAlt: string | null;
  accentImageFocusX: number;
  accentImageFocusY: number;
  accentImageZoom: number;
  establishedYear: string | null;
  establishedLabel: string | null;
};

export type AboutPageHero = {
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageFocusX: number;
  imageFocusY: number;
  imageZoom: number;
  overlayStrength: number;
};

export type AboutPageContent = {
  pageId?: string;
  status: ContentStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  hero: AboutPageHero;
  sections: Record<AboutSectionKey, AboutSectionContent>;
  statItems: AboutStatItem[];
  images: AboutPageImageSettings;
};

export type AboutPageContentWithMeta = AboutPageContent & {
  hasDraft?: boolean;
};

export type AboutContentMode = "public" | "admin" | "preview";

const heroDefaults = PAGE_HERO_DEFAULTS.about;

function section(
  key: AboutSectionKey,
  partial: Partial<AboutSectionContent> & Pick<AboutSectionContent, "sectionTitle">
): AboutSectionContent {
  return {
    sectionKey: key,
    eyebrow: null,
    subtitle: null,
    body: null,
    imageUrl: null,
    imageAlt: null,
    imageFocusX: 50,
    imageFocusY: 50,
    imageZoom: 100,
    ctaLabel: null,
    ctaHref: null,
    settings: {},
    displayOrder: key === ABOUT_SECTION_KEYS.WHO_WE_ARE ? 0 : 1,
    isActive: true,
    ...partial,
  };
}

export const ABOUT_PAGE_DEFAULTS: AboutPageContent = {
  status: ContentStatus.PUBLISHED,
  metaTitle: "About",
  metaDescription:
    "Learn about our mandate, leadership, and commitment to delivering critical public infrastructure.",
  hero: {
    eyebrow: heroDefaults.eyebrow,
    title: heroDefaults.title,
    subtitle: heroDefaults.subtitle,
    imageUrl: STOCK_IMAGES.about,
    imageAlt: `${heroDefaults.title} banner`,
    imageFocusX: 50,
    imageFocusY: 50,
    imageZoom: 100,
    overlayStrength: 0.55,
  },
  sections: {
    [ABOUT_SECTION_KEYS.WHO_WE_ARE]: section(ABOUT_SECTION_KEYS.WHO_WE_ARE, {
      eyebrow: "Who We Are",
      sectionTitle: "A trusted partner in",
      body: [
        "The National Infrastructure Delivery Corporation is a special-purpose state enterprise established to accelerate the delivery of critical public infrastructure.",
        "We combine government accountability with private-sector efficiency to deliver housing, civil works, and community infrastructure that strengthens communities across the nation.",
      ].join("\n\n"),
      imageUrl: STOCK_IMAGES.construction,
      imageAlt: "Residential housing and community infrastructure development",
      settings: {
        headingEmphasis: "national development",
        showImage: true,
        visionTitle: "Vision",
        visionDescription:
          "A nation connected by world-class infrastructure that improves quality of life for every citizen.",
        missionTitle: "Mission",
        missionDescription:
          "To plan, procure, and deliver major public infrastructure with transparency, value for money, and engineering excellence.",
      },
    }),
    [ABOUT_SECTION_KEYS.LEADERSHIP]: section(ABOUT_SECTION_KEYS.LEADERSHIP, {
      eyebrow: "Our Leaders",
      sectionTitle: "We Are Here",
      subtitle:
        "Meet the executive team guiding our housing delivery mandate with accountability and public service.",
      settings: {
        headingEmphasis: "to Serve You",
      },
    }),
  },
  statItems: [
    { label: "Estimated Units", value: "240", prefix: null, suffix: null, icon: null, displayOrder: 0, isActive: true },
    { label: "Capital Deployed", value: "4.2B", prefix: "$", suffix: null, icon: null, displayOrder: 1, isActive: true },
    { label: "On-Time Delivery", value: "92", prefix: null, suffix: "%", icon: null, displayOrder: 2, isActive: true },
  ],
  images: {
    accentImageUrl: STOCK_IMAGES.housing,
    accentImageAlt: "Community housing development",
    accentImageFocusX: 50,
    accentImageFocusY: 50,
    accentImageZoom: 100,
    establishedYear: "2018",
    establishedLabel: "Established",
  },
};

type AboutPageRow = NonNullable<Awaited<ReturnType<typeof loadAboutPageRow>>>;

function parsePageImages(raw: string | null | undefined): AboutPageImageSettings {
  if (!raw) return ABOUT_PAGE_DEFAULTS.images;
  try {
    const parsed = JSON.parse(raw) as Partial<AboutPageImageSettings>;
    return {
      accentImageUrl: parsed.accentImageUrl ?? ABOUT_PAGE_DEFAULTS.images.accentImageUrl,
      accentImageAlt: parsed.accentImageAlt ?? ABOUT_PAGE_DEFAULTS.images.accentImageAlt,
      accentImageFocusX: parsed.accentImageFocusX ?? 50,
      accentImageFocusY: parsed.accentImageFocusY ?? 50,
      accentImageZoom: parsed.accentImageZoom ?? 100,
      establishedYear: parsed.establishedYear ?? null,
      establishedLabel: parsed.establishedLabel ?? ABOUT_PAGE_DEFAULTS.images.establishedLabel,
    };
  } catch {
    return ABOUT_PAGE_DEFAULTS.images;
  }
}

function mergeSections(rows: AboutPageRow["sections"]): Record<AboutSectionKey, AboutSectionContent> {
  const merged = { ...ABOUT_PAGE_DEFAULTS.sections };
  for (const row of rows) {
    const key = row.sectionKey as AboutSectionKey;
    if (!(key in merged)) continue;
    let settings: Record<string, unknown> = {};
    if (row.settingsJson) {
      try {
        settings = JSON.parse(row.settingsJson) as Record<string, unknown>;
      } catch {
        settings = {};
      }
    }
    merged[key] = {
      sectionKey: key,
      sectionTitle: row.sectionTitle,
      eyebrow: row.eyebrow,
      subtitle: row.subtitle,
      body: row.body,
      imageUrl: row.imageUrl,
      imageAlt: row.imageAlt,
      imageFocusX: row.imageFocusX,
      imageFocusY: row.imageFocusY,
      imageZoom: row.imageZoom,
      ctaLabel: row.ctaLabel,
      ctaHref: row.ctaHref,
      settings: { ...merged[key].settings, ...settings },
      displayOrder: row.displayOrder,
      isActive: row.isActive,
    };
  }
  return merged;
}

function buildAboutContentFromPage(page: AboutPageRow): AboutPageContent {
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
      : ABOUT_PAGE_DEFAULTS.statItems;

  return {
    pageId: page.id,
    status: page.status,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    hero: {
      eyebrow: page.heroEyebrow,
      title: page.heroTitle ?? page.title,
      subtitle: page.heroSubtitle ?? page.summary,
      imageUrl: page.heroImageUrl,
      imageAlt: page.heroImageAlt,
      imageFocusX: page.heroImageFocusX,
      imageFocusY: page.heroImageFocusY,
      imageZoom: page.heroImageZoom,
      overlayStrength: page.heroOverlayStrength ?? 0.55,
    },
    sections: mergeSections(page.sections),
    statItems: stats,
    images: parsePageImages(page.settingsJson),
  };
}

async function loadAboutPageRow() {
  return prisma.page.findUnique({
    where: { slug: ABOUT_PAGE_SLUG },
    include: {
      sections: { orderBy: { displayOrder: "asc" } },
      statItems: { orderBy: { displayOrder: "asc" } },
    },
  });
}

async function loadAboutPageContent(mode: AboutContentMode): Promise<AboutPageContentWithMeta> {
  const page = await loadAboutPageRow();
  if (!page) return { ...ABOUT_PAGE_DEFAULTS, hasDraft: false };

  const published = buildAboutContentFromPage(page);
  const draft = parseDraftJson<AboutPageContent>(page.draftData);
  const hasDraft = Boolean(draft);

  if (mode === "admin") {
    if (draft) return { ...published, ...draft, hasDraft: true };
    return { ...published, hasDraft: false };
  }

  if (mode === "preview") {
    if (draft && page.status === ContentStatus.PUBLISHED) {
      return { ...published, ...draft, status: ContentStatus.PUBLISHED, hasDraft: true };
    }
    if (page.status === ContentStatus.PUBLISHED) return { ...published, hasDraft: false };
    if (draft) return { ...published, ...draft, hasDraft: true };
    return { ...published, hasDraft: false };
  }

  if (page.status !== ContentStatus.PUBLISHED) return { ...ABOUT_PAGE_DEFAULTS, hasDraft: false };
  return { ...published, hasDraft: false };
}

const getAboutPageContentPublicCached = unstable_cache(
  () => loadAboutPageContent("public"),
  ["about-page-public"],
  { tags: [CACHE_TAGS.about], revalidate: 3600 }
);

export async function getAboutPageContent(
  mode: AboutContentMode = "public"
): Promise<AboutPageContentWithMeta> {
  if (mode === "admin" || mode === "preview") {
    noStore();
    return loadAboutPageContent(mode);
  }
  return getAboutPageContentPublicCached();
}

export function getAboutSection(content: AboutPageContent, key: AboutSectionKey): AboutSectionContent {
  return content.sections[key] ?? ABOUT_PAGE_DEFAULTS.sections[key];
}

export function getAboutSectionHeadingEmphasis(section: AboutSectionContent): string | null {
  const value = section.settings.headingEmphasis ?? section.settings.accentText;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getAboutVisionMission(section: AboutSectionContent) {
  const settings = section.settings;
  return {
    visionTitle: (typeof settings.visionTitle === "string" && settings.visionTitle.trim()) || "Vision",
    visionDescription:
      (typeof settings.visionDescription === "string" && settings.visionDescription.trim()) || "",
    missionTitle: (typeof settings.missionTitle === "string" && settings.missionTitle.trim()) || "Mission",
    missionDescription:
      (typeof settings.missionDescription === "string" && settings.missionDescription.trim()) || "",
  };
}

export function shouldShowAboutMainImage(section: AboutSectionContent): boolean {
  return section.settings.showImage !== false && Boolean(section.imageUrl?.trim());
}

export function resolveAboutMainImageUrl(section: AboutSectionContent): string {
  return section.imageUrl?.trim() || ABOUT_PAGE_DEFAULTS.sections[ABOUT_SECTION_KEYS.WHO_WE_ARE].imageUrl!;
}

export function resolveAboutAccentImageUrl(images: AboutPageImageSettings): string {
  return images.accentImageUrl?.trim() || ABOUT_PAGE_DEFAULTS.images.accentImageUrl!;
}

export function formatAboutStatValue(item: AboutStatItem): string {
  return `${item.prefix ?? ""}${item.value}${item.suffix ?? ""}`;
}

export function sanitizeAboutPagePayload(payload: AboutPageContent): AboutPageContent {
  return {
    ...payload,
    metaTitle: payload.metaTitle?.trim() || null,
    metaDescription: payload.metaDescription?.trim() || null,
    hero: {
      ...payload.hero,
      eyebrow: payload.hero.eyebrow?.trim() || null,
      title: payload.hero.title?.trim() || null,
      subtitle: payload.hero.subtitle?.trim() || null,
      imageUrl: payload.hero.imageUrl?.trim() || null,
      imageAlt: payload.hero.imageAlt?.trim() || null,
      overlayStrength: Math.min(0.9, Math.max(0.2, payload.hero.overlayStrength ?? 0.55)),
    },
    images: {
      ...payload.images,
      accentImageUrl: payload.images.accentImageUrl?.trim() || null,
      accentImageAlt: payload.images.accentImageAlt?.trim() || null,
      establishedYear: payload.images.establishedYear?.trim() || null,
      establishedLabel: payload.images.establishedLabel?.trim() || "Established",
    },
    statItems: payload.statItems
      .map((item, index) => ({
        ...item,
        label: item.label.trim(),
        value: item.value.trim(),
        displayOrder: index,
      }))
      .filter((item) => item.label && item.value),
  };
}

export function validateAboutPagePayload(payload: AboutPageContent): string | null {
  if (!payload.hero.title?.trim()) return "Hero title is required.";
  const whoWeAre = payload.sections[ABOUT_SECTION_KEYS.WHO_WE_ARE];
  if (!whoWeAre.sectionTitle?.trim()) return "Who We Are heading is required.";
  return null;
}
