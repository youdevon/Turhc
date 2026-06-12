import type { SiteSettings } from "./settings";

export type ThemeMode = "dark" | "light";

export type AppearanceSettings = {
  activeTheme: ThemeMode;
  primaryAccentColor: string;
  secondaryAccentColor: string;
  headingColorLightTheme: string;
  headingColorDarkTheme: string;
  heroOverlayDarkness: number;
};

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHexColor(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? "";
  if (HEX_COLOR_RE.test(trimmed)) return trimmed.toLowerCase();
  return fallback;
}

export function validateHexColorField(value: string, fieldLabel: string): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || HEX_COLOR_RE.test(trimmed)) return null;
  return `${fieldLabel} must be a valid hex colour (e.g. #0b243f).`;
}

export const APPEARANCE_DEFAULTS: AppearanceSettings = {
  activeTheme: "dark",
  primaryAccentColor: "#3b82f6",
  secondaryAccentColor: "#d4a853",
  headingColorLightTheme: "#0b243f",
  headingColorDarkTheme: "#eef2f7",
  heroOverlayDarkness: 0.55,
};

export const LIGHT_APPEARANCE_DEFAULTS: AppearanceSettings = {
  activeTheme: "light",
  primaryAccentColor: "#1e6fff",
  secondaryAccentColor: "#b9872d",
  headingColorLightTheme: "#0b243f",
  headingColorDarkTheme: "#eef2f7",
  heroOverlayDarkness: 0.58,
};

export function parseThemeMode(value: string | undefined): ThemeMode {
  return value === "light" ? "light" : "dark";
}

export function getAppearanceFromSettings(settings: SiteSettings): AppearanceSettings {
  const theme = parseThemeMode(settings.activeTheme);
  const defaults = theme === "light" ? LIGHT_APPEARANCE_DEFAULTS : APPEARANCE_DEFAULTS;
  return {
    activeTheme: theme,
    primaryAccentColor: normalizeHexColor(settings.primaryAccentColor, defaults.primaryAccentColor),
    secondaryAccentColor: normalizeHexColor(settings.secondaryAccentColor, defaults.secondaryAccentColor),
    headingColorLightTheme: normalizeHexColor(
      settings.headingColorLightTheme,
      defaults.headingColorLightTheme
    ),
    headingColorDarkTheme: normalizeHexColor(settings.headingColorDarkTheme, defaults.headingColorDarkTheme),
    heroOverlayDarkness: parseFloat(settings.heroOverlayDarkness) || defaults.heroOverlayDarkness,
  };
}

/** Inline CSS variables applied on <html> for CMS-driven accent overrides */
export function buildThemeInlineStyle(appearance: AppearanceSettings): Record<string, string> {
  const overlay = Math.min(1, Math.max(0.2, appearance.heroOverlayDarkness));
  return {
    "--accent": appearance.primaryAccentColor,
    "--accent-strong": appearance.primaryAccentColor,
    "--gold": appearance.secondaryAccentColor,
    "--section-heading-primary-light": appearance.headingColorLightTheme,
    "--section-heading-primary-dark": appearance.headingColorDarkTheme,
    "--hero-overlay": String(overlay),
  };
}
