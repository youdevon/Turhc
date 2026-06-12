import type { LogoAssetMeta, SiteSettingsResolved } from "./settings";
import type { ThemeMode } from "./theme";
import {
  getHeaderCompactLogo,
  getHeaderLogo,
  parseLogoVariantMode,
  type HeaderLogoAsset,
  type HeaderLogoInput,
  type LogoVariantMode,
  type ResolvedHeaderLogo,
} from "./header-logo";

export type { HeaderLogoAsset, LogoVariantMode, ResolvedHeaderLogo };
export { getHeaderLogo, getHeaderCompactLogo, parseLogoVariantMode };

export type NavLinkItem = {
  label: string;
  href: string;
  order: number;
  active: boolean;
};

export type HeaderCtaStyle = "link" | "outline" | "filled";

export type SocialPlatform = "facebook" | "instagram" | "youtube" | "linkedin" | "twitter";

export type SocialLinkItem = {
  platform: SocialPlatform;
  url: string;
};
export type HeaderStyle = "transparent" | "solid" | "glass";
export type BrandLayoutMode = "full_logo" | "compact_logo" | "text_only" | "logo_text";

export type HeaderConfig = {
  brandLayoutMode: BrandLayoutMode;
  brandDisplayText: string;
  brandSubtitle: string;
  showBrandText: boolean;
  showBrandSubtitle: boolean;
  logoVariantMode: LogoVariantMode;
  logoMain: HeaderLogoAsset;
  logoWhite: HeaderLogoAsset;
  logoColored: HeaderLogoAsset;
  logoLight: HeaderLogoAsset;
  logoDark: HeaderLogoAsset;
  logoCompact: HeaderLogoAsset;
  logoCompactWhite: HeaderLogoAsset;
  logoCompactColored: HeaderLogoAsset;
  logoAlt: string;
  showLogoImage: boolean;
  logoHeightDesktop: number;
  logoHeightMobile: number;
  logoMaxWidthDesktop: number;
  logoMaxWidthMobile: number;
  brandZoneWidthDesktop: number;
  headerStyle: HeaderStyle;
  navLinks: NavLinkItem[];
  contactLabel: string;
  contactHref: string;
  contractorLabel: string;
  contractorHref: string;
  showContractorHeaderCta: boolean;
  headerCtaStyle: HeaderCtaStyle;
  showHamburgerDesktop: boolean;
  theme: ThemeMode;
  socialLinks: SocialLinkItem[];
};

export const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { label: "Our Company", href: "/about", order: 0, active: true },
  { label: "Our Services", href: "/contractors", order: 1, active: true },
  { label: "Our Projects", href: "/projects", order: 2, active: true },
  { label: "Tenders", href: "/tenders", order: 3, active: true },
  { label: "News & Insights", href: "/news", order: 4, active: true },
  { label: "Governance", href: "/governance", order: 5, active: true },
];

const LOGO_HEIGHT_DESKTOP_DEFAULT = 64;
const LOGO_HEIGHT_MOBILE_DEFAULT = 48;
const LOGO_MAX_WIDTH_DESKTOP_DEFAULT = 400;
const LOGO_MAX_WIDTH_MOBILE_DEFAULT = 280;
const BRAND_ZONE_WIDTH_DEFAULT = 380;

export function parseNavLinksFromJson(json: string | undefined): NavLinkItem[] {
  if (!json?.trim()) return DEFAULT_NAV_LINKS;
  try {
    const parsed = JSON.parse(json) as NavLinkItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_NAV_LINKS;
    return parsed
      .filter((item) => item.label && item.href)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return DEFAULT_NAV_LINKS;
  }
}

export function serializeNavLinks(links: NavLinkItem[]): string {
  const normalized = links
    .map((item, index) => ({
      label: item.label.trim(),
      href: item.href.trim(),
      order: Number.isFinite(item.order) ? item.order : index,
      active: item.active !== false,
    }))
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index }));

  return JSON.stringify(normalized);
}

export function validateNavLinksJson(json: string): string | null {
  if (!json?.trim()) {
    return "Add at least one menu item with a menu label and page link.";
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return "Navigation could not be saved. Please check each menu item and try again.";
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return "Add at least one menu item with a menu label and page link.";
  }

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as Partial<NavLinkItem>;
    if (!item?.label?.trim()) {
      return `Menu item ${i + 1} is missing a menu label.`;
    }
    if (!item?.href?.trim()) {
      return `Menu item ${i + 1} is missing a page link.`;
    }
  }

  return null;
}

export const COMMON_NAV_PAGE_LINKS = [
  { href: "/about", label: "Our Company" },
  { href: "/contractors", label: "Our Services" },
  { href: "/projects", label: "Our Projects" },
  { href: "/tenders", label: "Tenders" },
  { href: "/news", label: "News & Insights" },
  { href: "/governance", label: "Governance" },
  { href: "/contact", label: "Contact" },
] as const;

function parseNavJson(json: string | undefined): NavLinkItem[] {
  return parseNavLinksFromJson(json).filter((item) => item.active !== false);
}

export function deriveBrandAcronym(orgName: string): string {
  const words = orgName.split(/\s+/).filter((w) => w.length > 2 && !/^(the|and|of|for|a)$/i.test(w));
  if (words.length >= 2) {
    return words
      .slice(0, 4)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  return orgName.slice(0, 4).toUpperCase();
}

const LEGACY_DEFAULT_BRAND = "NIDC";
const LEGACY_DEFAULT_ORG = "National Infrastructure Delivery Corporation";

export function resolveBrandDisplayText(settings: {
  brandDisplayText: string;
  orgName: string;
}): string {
  const custom = settings.brandDisplayText?.trim();
  if (!custom) return deriveBrandAcronym(settings.orgName);
  if (custom === LEGACY_DEFAULT_BRAND && settings.orgName.trim() !== LEGACY_DEFAULT_ORG) {
    return deriveBrandAcronym(settings.orgName);
  }
  return custom;
}

function parseBrandLayoutMode(value: string | undefined): BrandLayoutMode {
  if (value === "logo_only") return "full_logo";
  if (value === "compact_logo" || value === "text_only" || value === "logo_text") return value;
  return "full_logo";
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function resolveWhiteAsset(settings: SiteSettingsResolved): HeaderLogoAsset {
  return settings.logoAssetWhite ?? settings.logoAssetDark ?? null;
}

function resolveColoredAsset(settings: SiteSettingsResolved): HeaderLogoAsset {
  return settings.logoAssetColored ?? settings.logoAssetLight ?? null;
}

export function buildHeaderLogoState(
  config: HeaderConfig,
  isOverHero: boolean,
  isScrolled: boolean,
  isOverDarkSurface: boolean,
  suppressDarkSurfaceWhiteLogo = false
): HeaderLogoInput {
  return {
    isOverHero,
    isScrolled,
    isOverDarkSurface,
    suppressDarkSurfaceWhiteLogo,
    activeTheme: config.theme,
    logoVariantMode: config.logoVariantMode,
    mainLogo: config.logoMain,
    whiteLogo: config.logoWhite,
    coloredLogo: config.logoColored,
    lightLogo: config.logoLight,
    darkLogo: config.logoDark,
  };
}

export function resolveHeaderFullLogo(
  config: HeaderConfig,
  isOverHero: boolean,
  isScrolled: boolean,
  isOverDarkSurface: boolean,
  suppressDarkSurfaceWhiteLogo = false
): ResolvedHeaderLogo | null {
  return getHeaderLogo(
    buildHeaderLogoState(
      config,
      isOverHero,
      isScrolled,
      isOverDarkSurface,
      suppressDarkSurfaceWhiteLogo
    )
  );
}

export function resolveHeaderCompactLogo(
  config: HeaderConfig,
  isOverHero: boolean,
  isScrolled: boolean,
  isOverDarkSurface: boolean,
  suppressDarkSurfaceWhiteLogo = false
): ResolvedHeaderLogo | null {
  const base = buildHeaderLogoState(
    config,
    isOverHero,
    isScrolled,
    isOverDarkSurface,
    suppressDarkSurfaceWhiteLogo
  );
  return getHeaderCompactLogo({
    ...base,
    compactMain: config.logoCompact,
    compactWhite: config.logoCompactWhite,
    compactColored: config.logoCompactColored,
  });
}

export function resolveSocialLinks(settings: {
  socialFacebook: string;
  socialInstagram: string;
  socialYouTube: string;
  socialLinkedIn: string;
  socialTwitter: string;
}): SocialLinkItem[] {
  const entries: SocialLinkItem[] = [
    { platform: "facebook", url: settings.socialFacebook },
    { platform: "instagram", url: settings.socialInstagram },
    { platform: "youtube", url: settings.socialYouTube },
    { platform: "linkedin", url: settings.socialLinkedIn },
    { platform: "twitter", url: settings.socialTwitter },
  ];
  return entries
    .map((e) => ({ ...e, url: e.url?.trim() ?? "" }))
    .filter((e) => e.url.length > 0);
}

export function getHeaderConfig(settings: SiteSettingsResolved): HeaderConfig {
  const theme: ThemeMode = settings.activeTheme === "light" ? "light" : "dark";
  const headerStyle = (settings.headerStyle as HeaderStyle) || "glass";
  const headerCtaStyle = (settings.headerCtaStyle as HeaderCtaStyle) || "filled";
  const brandLayoutMode = parseBrandLayoutMode(settings.brandDisplayMode);

  return {
    brandLayoutMode,
    brandDisplayText: resolveBrandDisplayText(settings),
    brandSubtitle: settings.headerBrandSubtitle?.trim() || settings.orgSubtitle,
    showBrandText: settings.showBrandText === "true",
    showBrandSubtitle: settings.showBrandSubtitle === "true",
    logoVariantMode: parseLogoVariantMode(settings.headerLogoVariantMode),
    logoMain: settings.logoAsset,
    logoWhite: resolveWhiteAsset(settings),
    logoColored: resolveColoredAsset(settings),
    logoLight: settings.logoAssetLight,
    logoDark: settings.logoAssetDark,
    logoCompact: settings.logoAssetCompact,
    logoCompactWhite: settings.logoAssetCompactWhite,
    logoCompactColored: settings.logoAssetCompact,
    logoAlt:
      settings.logoAlt?.trim() ||
      settings.orgName ||
      "Organisation logo",
    showLogoImage: settings.showLogoImage !== "false",
    logoHeightDesktop: parsePositiveInt(settings.headerLogoHeightDesktop, LOGO_HEIGHT_DESKTOP_DEFAULT),
    logoHeightMobile: parsePositiveInt(settings.headerLogoHeightMobile, LOGO_HEIGHT_MOBILE_DEFAULT),
    logoMaxWidthDesktop: parsePositiveInt(settings.headerLogoMaxWidthDesktop, LOGO_MAX_WIDTH_DESKTOP_DEFAULT),
    logoMaxWidthMobile: parsePositiveInt(settings.headerLogoMaxWidthMobile, LOGO_MAX_WIDTH_MOBILE_DEFAULT),
    brandZoneWidthDesktop: parsePositiveInt(settings.headerBrandZoneWidthDesktop, BRAND_ZONE_WIDTH_DEFAULT),
    headerStyle,
    navLinks: parseNavJson(settings.mainNavJson),
    contactLabel: settings.headerContactLabel || "Contact Us",
    contactHref: settings.headerContactHref || "/contact",
    contractorLabel: settings.headerContractorLabel || "Become a Contractor",
    contractorHref: settings.headerContractorHref || "/contractors",
    showContractorHeaderCta: settings.showContractorHeaderCta === "true",
    headerCtaStyle,
    showHamburgerDesktop: settings.showHamburgerDesktop === "true",
    theme,
    socialLinks: resolveSocialLinks(settings),
  };
}

export function shouldShowHeaderLogo(config: HeaderConfig): boolean {
  if (config.brandLayoutMode === "text_only") return false;
  if (!config.showLogoImage) return false;
  return !!(config.logoMain || config.logoWhite || config.logoColored || config.logoCompact);
}

export function shouldShowHeaderBrandText(config: HeaderConfig): boolean {
  if (config.brandLayoutMode === "text_only") return true;
  if (config.brandLayoutMode === "full_logo" || config.brandLayoutMode === "compact_logo") return false;
  return config.showBrandText;
}

export function shouldShowHeaderBrandSubtitle(config: HeaderConfig): boolean {
  if (config.brandLayoutMode !== "logo_text") return false;
  return config.showBrandSubtitle && config.showBrandText;
}

export function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type LogoUrlFields = {
  logoUrl?: string | null;
  logoUrlWhite?: string | null;
  logoUrlColored?: string | null;
  logoUrlDark?: string | null;
  logoUrlLight?: string | null;
};

/** Pick the logo variant that contrasts with a light or dark background. */
export function getLogoUrlForBackground(
  logos: LogoUrlFields,
  background: "light" | "dark"
): string | null {
  if (background === "light") {
    return logos.logoUrlColored ?? logos.logoUrlLight ?? logos.logoUrl ?? null;
  }
  return logos.logoUrlWhite ?? logos.logoUrlDark ?? logos.logoUrl ?? logos.logoUrlColored ?? null;
}
