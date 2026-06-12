export type SectionHeadingThemeVariant = "light" | "dark";
export type SectionEmphasisColorVariant = "blue" | "gold";
export type SectionEmphasisLayout = "auto" | "inline" | "block";

const CONTINUATION_PATTERN = /^(in|for|and|or|to|with|&|at|by|from|of|on|the|a|an)\b/i;

export function resolveSectionEmphasisLayout(emphasis: string): "inline" | "block" {
  const trimmed = emphasis.trim();
  if (!trimmed) return "block";

  if (/^[a-z]/.test(trimmed)) return "inline";
  if (CONTINUATION_PATTERN.test(trimmed)) return "inline";

  return "block";
}

export function resolveSectionEmphasisColor(
  emphasis: string,
  layout: "inline" | "block",
  themeVariant: SectionHeadingThemeVariant = "light"
): SectionEmphasisColorVariant {
  if (themeVariant === "dark") return "gold";
  return layout === "inline" ? "gold" : "blue";
}
