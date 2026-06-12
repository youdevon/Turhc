/** Temporary Unsplash stock images for demo content until media uploads are connected. */

export const STOCK_IMAGES = {
  road: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80",
  bridge: "https://images.unsplash.com/photo-1581094794329-cd2c58dbb709?w=1920&q=80",
  construction: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80",
  housing: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80",
  civic: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80",
  airport: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80",
  water: "https://images.unsplash.com/photo-1548839140-29a7492991a8?w=1920&q=80",
  port: "https://images.unsplash.com/photo-1494412519320-aa4fbab0cc28?w=1920&q=80",
  rail: "https://images.unsplash.com/photo-1474487548417-781cbbae8f42?w=1920&q=80",
  tenders: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80",
  contractors: "https://images.unsplash.com/photo-1541976590-713941681591?w=1920&q=80",
  governance: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=1920&q=80",
  news: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920&q=80",
  contact: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80",
  about: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80",
  generic: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80",
} as const;

export type HeroPageType =
  | "about"
  | "projects"
  | "tenders"
  | "contractors"
  | "governance"
  | "news"
  | "contact"
  | "generic";

/** Category/sector fallbacks for project cards when no featured image is set. */
export const PROJECT_SECTOR_FALLBACK_IMAGES: Record<string, string> = {
  "Roads & Highways": STOCK_IMAGES.road,
  "Bridges & Structures": STOCK_IMAGES.bridge,
  "Water & Wastewater": STOCK_IMAGES.water,
  "Ports & Maritime": STOCK_IMAGES.port,
  "Rail & Transit": STOCK_IMAGES.rail,
  Aviation: STOCK_IMAGES.airport,
  "Government Buildings": STOCK_IMAGES.civic,
  "Housing & Residential": STOCK_IMAGES.housing,
  Housing: STOCK_IMAGES.housing,
};

export const DEFAULT_PROJECT_CARD_IMAGE = STOCK_IMAGES.construction;

export const HERO_PAGE_TYPE_IMAGES: Record<HeroPageType, string> = {
  about: STOCK_IMAGES.about,
  projects: STOCK_IMAGES.construction,
  tenders: STOCK_IMAGES.tenders,
  contractors: STOCK_IMAGES.contractors,
  governance: STOCK_IMAGES.governance,
  news: STOCK_IMAGES.news,
  contact: STOCK_IMAGES.contact,
  generic: STOCK_IMAGES.generic,
};

export const PAGE_HERO_DEFAULTS: Record<
  string,
  { eyebrow: string; title: string; subtitle: string; pageType: HeroPageType }
> = {
  about: {
    eyebrow: "About Us",
    title: "Building national infrastructure with accountability",
    subtitle: "A government-owned enterprise delivering critical public works with transparency and engineering excellence.",
    pageType: "about",
  },
  projects: {
    eyebrow: "Infrastructure",
    title: "Our Projects",
    subtitle: "Explore major public infrastructure projects across sectors and regions.",
    pageType: "projects",
  },
  tenders: {
    eyebrow: "Procurement",
    title: "Tenders",
    subtitle: "Browse open and closed procurement opportunities for qualified contractors.",
    pageType: "tenders",
  },
  contractors: {
    eyebrow: "Contractor Portal",
    title: "Work with us on national infrastructure",
    subtitle: "Registration, prequalification, and guidance for contractors bidding on public works.",
    pageType: "contractors",
  },
  governance: {
    eyebrow: "Transparency",
    title: "Governance & Accountability",
    subtitle: "Committed to ethical governance, transparent procurement, and public accountability.",
    pageType: "governance",
  },
  news: {
    eyebrow: "Updates",
    title: "News & Public Notices",
    subtitle: "Official announcements, project updates, and public notices.",
    pageType: "news",
  },
  contact: {
    eyebrow: "Contact",
    title: "Enquiries",
    subtitle: "Get in touch with our team regarding projects, tenders, or general enquiries.",
    pageType: "contact",
  },
};

export const PROJECT_STOCK_IMAGES = [
  STOCK_IMAGES.road,
  STOCK_IMAGES.water,
  STOCK_IMAGES.port,
  STOCK_IMAGES.rail,
  STOCK_IMAGES.bridge,
  STOCK_IMAGES.civic,
  STOCK_IMAGES.airport,
  STOCK_IMAGES.construction,
] as const;
