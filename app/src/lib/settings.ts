import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { CACHE_TAGS } from "./cache-tags";
import { timed } from "./performance";

export type SiteSettings = {
  orgName: string;
  orgSubtitle: string;
  orgTagline: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  footerText: string;
  socialLinkedIn: string;
  socialTwitter: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYouTube: string;
  heroEyebrow: string;
  mandateText: string;
  whoWeAreText: string;
  deliveryStatsJson: string;
  activeTheme: string;
  primaryAccentColor: string;
  secondaryAccentColor: string;
  headingColorLightTheme: string;
  headingColorDarkTheme: string;
  eyebrowColorLightTheme: string;
  eyebrowColorDarkTheme: string;
  heroOverlayDarkness: string;
  logoMediaId: string;
  heroImageAbout: string;
  heroImageProjects: string;
  heroImageTenders: string;
  heroImageContractors: string;
  heroImageGovernance: string;
  heroImageNews: string;
  heroImageContact: string;
  heroImageGeneric: string;
  brandDisplayText: string;
  brandDisplayMode: string;
  headerBrandSubtitle: string;
  showBrandText: string;
  showBrandSubtitle: string;
  logoAlt: string;
  logoMediaIdWhite: string;
  logoMediaIdColored: string;
  logoMediaIdDark: string;
  logoMediaIdLight: string;
  logoMediaIdCompact: string;
  logoMediaIdCompactWhite: string;
  headerLogoVariantMode: string;
  showLogoImage: string;
  headerLogoHeightDesktop: string;
  headerLogoHeightMobile: string;
  headerLogoMaxWidthDesktop: string;
  headerLogoMaxWidthMobile: string;
  headerBrandZoneWidthDesktop: string;
  headerStyle: string;
  mainNavJson: string;
  headerContactLabel: string;
  headerContactHref: string;
  headerContractorLabel: string;
  headerContractorHref: string;
  showContractorHeaderCta: string;
  headerCtaStyle: string;
  showHamburgerDesktop: string;
  enquiryEmailForwardingEnabled: string;
  enquiryForwardTo: string;
  enquiryForwardCc: string;
  enquiryForwardBcc: string;
  enquiryEmailSubjectPrefix: string;
  enquirySmtpTestRecipient: string;
  smtpEnabled: string;
  smtpHost: string;
  smtpPort: string;
  smtpEncryption: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpReplyTo: string;
};

export type LogoAssetMeta = {
  url: string;
  width: number | null;
  height: number | null;
  mimeType: string;
};

export type SiteSettingsResolved = SiteSettings & {
  logoUrl: string | null;
  logoUrlWhite: string | null;
  logoUrlColored: string | null;
  logoUrlDark: string | null;
  logoUrlLight: string | null;
  logoUrlCompact: string | null;
  logoUrlCompactWhite: string | null;
  logoAsset: LogoAssetMeta | null;
  logoAssetWhite: LogoAssetMeta | null;
  logoAssetColored: LogoAssetMeta | null;
  logoAssetDark: LogoAssetMeta | null;
  logoAssetLight: LogoAssetMeta | null;
  logoAssetCompact: LogoAssetMeta | null;
  logoAssetCompactWhite: LogoAssetMeta | null;
};

const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  orgName: "National Infrastructure Delivery Corporation",
  orgSubtitle: "A Government-Owned Special Purpose Enterprise",
  orgTagline: "Building the foundations of tomorrow",
  contactEmail: "info@infrastructure.gov",
  contactPhone: "+1 (800) 555-0199",
  contactAddress: "100 Capital Boulevard, Government District",
  footerText: "Delivering critical infrastructure for the nation.",
  socialLinkedIn: "",
  socialTwitter: "",
  socialFacebook: "",
  socialInstagram: "",
  socialYouTube: "",
  heroEyebrow: "State Enterprise",
  mandateText:
    "We are mandated to plan, procure, and deliver major public infrastructure projects on behalf of the state, ensuring transparency, value for money, and world-class engineering standards.",
  whoWeAreText:
    "The National Infrastructure Delivery Corporation is a special-purpose state enterprise established to accelerate the delivery of critical public infrastructure. We combine government accountability with private-sector efficiency.",
  deliveryStatsJson: JSON.stringify([
    { label: "Active Projects", value: "24" },
    { label: "Capital Deployed", value: "$4.2B" },
    { label: "On-Time Delivery", value: "92%" },
    { label: "Contractors Registered", value: "380+" },
  ]),
  activeTheme: "dark",
  primaryAccentColor: "#3b82f6",
  secondaryAccentColor: "#d4a853",
  headingColorLightTheme: "#0b243f",
  headingColorDarkTheme: "#eef2f7",
  eyebrowColorLightTheme: "#315f8f",
  eyebrowColorDarkTheme: "#9ec4e4",
  heroOverlayDarkness: "0.55",
  logoMediaId: "",
  heroImageAbout: "",
  heroImageProjects: "",
  heroImageTenders: "",
  heroImageContractors: "",
  heroImageGovernance: "",
  heroImageNews: "",
  heroImageContact: "",
  heroImageGeneric: "",
  brandDisplayText: "",
  brandDisplayMode: "full_logo",
  headerBrandSubtitle: "",
  showBrandText: "false",
  showBrandSubtitle: "false",
  logoAlt: "",
  logoMediaIdWhite: "",
  logoMediaIdColored: "",
  logoMediaIdDark: "",
  logoMediaIdLight: "",
  logoMediaIdCompact: "",
  logoMediaIdCompactWhite: "",
  headerLogoVariantMode: "always_white",
  showLogoImage: "true",
  headerLogoHeightDesktop: "64",
  headerLogoHeightMobile: "48",
  headerLogoMaxWidthDesktop: "400",
  headerLogoMaxWidthMobile: "280",
  headerBrandZoneWidthDesktop: "400",
  headerStyle: "glass",
  mainNavJson: "",
  headerContactLabel: "Contact Us",
  headerContactHref: "/contact",
  headerContractorLabel: "Become a Contractor",
  headerContractorHref: "/contractors",
  showContractorHeaderCta: "false",
  headerCtaStyle: "filled",
  showHamburgerDesktop: "false",
  enquiryEmailForwardingEnabled: "true",
  enquiryForwardTo: "",
  enquiryForwardCc: "",
  enquiryForwardBcc: "",
  enquiryEmailSubjectPrefix: "New Website Enquiry",
  enquirySmtpTestRecipient: "",
  smtpEnabled: "false",
  smtpHost: "",
  smtpPort: "587",
  smtpEncryption: "starttls",
  smtpUser: "",
  smtpPassword: "",
  smtpFromEmail: "",
  smtpFromName: "",
  smtpReplyTo: "",
};

async function fetchSiteSettingsFromDb(): Promise<SiteSettings> {
  return timed("getSiteSettings", async () => {
    const settings = await prisma.siteSetting.findMany({ select: { key: true, value: true } });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return { ...SITE_SETTINGS_DEFAULTS, ...map } as SiteSettings;
  });
}

const getSiteSettingsCrossRequest = unstable_cache(fetchSiteSettingsFromDb, ["site-settings"], {
  tags: [CACHE_TAGS.settings],
  revalidate: 3600,
});

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  return getSiteSettingsCrossRequest();
});

async function resolveLogoAssets(settings: SiteSettings) {
  const ids = [
    settings.logoMediaId,
    settings.logoMediaIdWhite || settings.logoMediaIdDark,
    settings.logoMediaIdColored || settings.logoMediaIdLight,
    settings.logoMediaIdDark,
    settings.logoMediaIdLight,
    settings.logoMediaIdCompact,
    settings.logoMediaIdCompactWhite,
  ].filter((id): id is string => Boolean(id?.trim()));

  const uniqueIds = [...new Set(ids)];
  const media =
    uniqueIds.length === 0
      ? []
      : await prisma.mediaAsset.findMany({
          where: { id: { in: uniqueIds }, isDeleted: false },
          select: { id: true, url: true, width: true, height: true, mimeType: true },
        });

  const byId = new Map(media.map((m) => [m.id, m]));

  function meta(id: string | undefined): LogoAssetMeta | null {
    if (!id?.trim()) return null;
    const row = byId.get(id);
    if (!row) return null;
    return { url: row.url, width: row.width, height: row.height, mimeType: row.mimeType };
  }

  const logoAsset = meta(settings.logoMediaId);
  const logoAssetWhite = meta(settings.logoMediaIdWhite || settings.logoMediaIdDark);
  const logoAssetColored = meta(settings.logoMediaIdColored || settings.logoMediaIdLight);

  return {
    logoUrl: logoAsset?.url ?? null,
    logoUrlWhite: logoAssetWhite?.url ?? null,
    logoUrlColored: logoAssetColored?.url ?? null,
    logoUrlDark: meta(settings.logoMediaIdDark)?.url ?? null,
    logoUrlLight: meta(settings.logoMediaIdLight)?.url ?? null,
    logoUrlCompact: meta(settings.logoMediaIdCompact)?.url ?? null,
    logoUrlCompactWhite: meta(settings.logoMediaIdCompactWhite)?.url ?? null,
    logoAsset,
    logoAssetWhite,
    logoAssetColored,
    logoAssetDark: meta(settings.logoMediaIdDark),
    logoAssetLight: meta(settings.logoMediaIdLight),
    logoAssetCompact: meta(settings.logoMediaIdCompact),
    logoAssetCompactWhite: meta(settings.logoMediaIdCompactWhite),
  };
}

const getSiteSettingsResolvedCrossRequest = unstable_cache(
  async (): Promise<SiteSettingsResolved> => {
    const settings = await fetchSiteSettingsFromDb();
    const logos = await resolveLogoAssets(settings);
    return { ...settings, ...logos };
  },
  ["site-settings-resolved"],
  { tags: [CACHE_TAGS.settings], revalidate: 3600 }
);

export const getSiteSettingsResolved = cache(async (): Promise<SiteSettingsResolved> => {
  return getSiteSettingsResolvedCrossRequest();
});

export async function getSetting(key: keyof SiteSettings): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({ where: { key }, select: { value: true } });
  return setting?.value ?? SITE_SETTINGS_DEFAULTS[key];
}

/** Bypass cache — use after admin settings save or for SMTP. */
export async function getSiteSettingsFresh(): Promise<SiteSettings> {
  return fetchSiteSettingsFromDb();
}

/** Always current settings + logos — used by public layouts so theme stays in sync. */
export async function getSiteSettingsResolvedFresh(): Promise<SiteSettingsResolved> {
  const settings = await fetchSiteSettingsFromDb();
  const logos = await resolveLogoAssets(settings);
  return { ...settings, ...logos };
}
