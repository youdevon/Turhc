import type { LogoAssetMeta } from "./settings";
import type { ThemeMode } from "./theme";

export type HeaderLogoAsset = LogoAssetMeta | null;
export type LogoVariantMode = "auto" | "always_white" | "always_colored" | "theme_based";
export type LogoColorVariant = "white" | "colored";

export type HeaderLogoInput = {
  isOverHero: boolean;
  isScrolled: boolean;
  /** True when the header overlaps a dark hero/carousel surface (not a light pre-hero band). */
  isOverDarkSurface: boolean;
  /**
   * When true, skip the white-logo branch for dark-surface detection.
   * Used on light-theme inner pages where the header bar sits above (not over) page heroes.
   */
  suppressDarkSurfaceWhiteLogo?: boolean;
  activeTheme: ThemeMode;
  logoVariantMode: LogoVariantMode;
  mainLogo: HeaderLogoAsset;
  whiteLogo: HeaderLogoAsset;
  coloredLogo: HeaderLogoAsset;
  /** Coloured/dark-background mark (legacy `logoMediaIdLight`). Not the white-on-dark asset. */
  lightLogo?: HeaderLogoAsset;
  darkLogo?: HeaderLogoAsset;
};

export type ResolvedHeaderLogo = {
  asset: HeaderLogoAsset;
  variant: LogoColorVariant;
  whiteAsset: HeaderLogoAsset;
  coloredAsset: HeaderLogoAsset;
  /** White-only asset forced onto a light header — apply dark rendering in CSS. */
  renderAsDarkOnLight?: boolean;
};

function pickAsset(...candidates: (HeaderLogoAsset | undefined)[]): HeaderLogoAsset {
  for (const candidate of candidates) {
    if (candidate?.url) return candidate;
  }
  return null;
}

function assetUrl(asset: HeaderLogoAsset | undefined): string | undefined {
  return asset?.url;
}

function sameAssetUrl(a: HeaderLogoAsset | undefined, b: HeaderLogoAsset | undefined): boolean {
  const aUrl = assetUrl(a);
  const bUrl = assetUrl(b);
  return !!(aUrl && bUrl && aUrl === bUrl);
}

function parseLogoVariantMode(value: string | undefined): LogoVariantMode {
  if (value === "always_white") return "always_white";
  if (value === "always_colored") return "always_colored";
  if (value === "theme_based") return "theme_based";
  return "auto";
}

export { parseLogoVariantMode };

/** Select white or colored logo asset for the current header state. */
export function getHeaderLogo(input: HeaderLogoInput): ResolvedHeaderLogo | null {
  const main = input.mainLogo;
  const white = pickAsset(input.whiteLogo, main);
  // Never use darkLogo (white-on-dark mark) in the coloured chain.
  const colored = pickAsset(input.coloredLogo, input.lightLogo, main);

  if (!white && !colored && !main) return null;

  const mode = input.logoVariantMode;

  let variant: LogoColorVariant;

  const useDarkSurfaceWhite =
    input.isOverDarkSurface && !input.isScrolled && !input.suppressDarkSurfaceWhiteLogo;

  if (mode === "always_white") {
    variant =
      input.activeTheme === "light" && !useDarkSurfaceWhite ? "colored" : "white";
  } else if (mode === "always_colored") {
    variant = "colored";
  } else if (mode === "theme_based") {
    variant = input.activeTheme === "light" ? "colored" : "white";
  } else {
    // auto — white over dark hero/carousel; coloured on light surfaces / when scrolled
    if (useDarkSurfaceWhite) {
      variant = "white";
    } else if (input.activeTheme === "light") {
      variant = "colored";
    } else {
      variant = "white";
    }
  }

  const asset = variant === "white" ? pickAsset(white, main) : pickAsset(colored, main);

  if (!asset) return null;

  const whiteAsset = white ?? main;
  const coloredAsset = colored ?? main ?? white;
  const needsColoredOnLight =
    variant === "colored" &&
    (input.suppressDarkSurfaceWhiteLogo ||
      (input.activeTheme === "light" && (input.isScrolled || !input.isOverDarkSurface)));
  const renderAsDarkOnLight =
    needsColoredOnLight &&
    sameAssetUrl(asset, whiteAsset) &&
    sameAssetUrl(whiteAsset, coloredAsset);

  return {
    asset,
    variant,
    whiteAsset,
    coloredAsset,
    renderAsDarkOnLight,
  };
}

export type HeaderCompactLogoInput = HeaderLogoInput & {
  compactMain: HeaderLogoAsset;
  compactWhite: HeaderLogoAsset;
  compactColored: HeaderLogoAsset;
};

/** Compact mark for mobile; falls back to full logo assets when compact variants are missing. */
export function getHeaderCompactLogo(input: HeaderCompactLogoInput): ResolvedHeaderLogo | null {
  return getHeaderLogo({
    isOverHero: input.isOverHero,
    isScrolled: input.isScrolled,
    isOverDarkSurface: input.isOverDarkSurface,
    suppressDarkSurfaceWhiteLogo: input.suppressDarkSurfaceWhiteLogo,
    activeTheme: input.activeTheme,
    logoVariantMode: input.logoVariantMode,
    mainLogo: pickAsset(input.compactMain, input.mainLogo),
    whiteLogo: pickAsset(input.compactWhite, input.whiteLogo, input.mainLogo),
    coloredLogo: pickAsset(input.compactColored, input.coloredLogo, input.lightLogo, input.mainLogo),
    lightLogo: input.lightLogo,
    darkLogo: input.darkLogo,
  });
}

/** True when both variants should be preloaded for crossfade (different URLs). */
export function shouldCrossfadeLogos(resolved: ResolvedHeaderLogo | null): boolean {
  if (!resolved) return false;
  const whiteUrl = resolved.whiteAsset?.url;
  const coloredUrl = resolved.coloredAsset?.url;
  return !!(whiteUrl && coloredUrl && whiteUrl !== coloredUrl);
}
