export const V2_VISUAL_PRESETS = [
  { value: "soft_blueprint", label: "Soft Blueprint Background" },
  { value: "floating_image_right", label: "Floating Image Right" },
  { value: "wide_image_scene", label: "Wide Image Scene" },
  { value: "split_text_image", label: "Split Text and Image" },
  { value: "image_behind_text", label: "Image Behind Text" },
  { value: "contained_cinematic", label: "Contained Cinematic" },
  { value: "minimal_text_only", label: "Minimal Text Only" },
] as const;

export type V2VisualPreset = (typeof V2_VISUAL_PRESETS)[number]["value"];

export const V2_HEADING_STYLES = [
  { value: "standard", label: "Standard" },
  { value: "editorial_serif", label: "Editorial Serif" },
  { value: "compact", label: "Compact" },
  { value: "hero", label: "Hero" },
  { value: "cta_bold", label: "CTA Bold" },
] as const;

export type V2HeadingStyle = (typeof V2_HEADING_STYLES)[number]["value"];

export const V2_HEADING_SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "feature", label: "Feature" },
] as const;

export type V2HeadingSize = (typeof V2_HEADING_SIZES)[number]["value"];

export const V2_EMPHASIS_PRESETS = [
  { value: "none", label: "None" },
  { value: "blue_italic", label: "Blue Italic" },
  { value: "gold_italic", label: "Gold Italic" },
  { value: "same_colour_italic", label: "Same Colour Italic" },
] as const;

export type V2EmphasisPreset = (typeof V2_EMPHASIS_PRESETS)[number]["value"];

export const V2_HERO_OVERLAY_PRESETS = [
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "dark", label: "Dark" },
  { value: "gradient_blue", label: "Gradient Blue" },
  { value: "gradient_dark", label: "Gradient Dark" },
] as const;

export type V2HeroOverlayPreset = (typeof V2_HERO_OVERLAY_PRESETS)[number]["value"];

export function resolveV2EmphasisColor(
  preset: V2EmphasisPreset | undefined
): "blue" | "gold" | "inherit" | null {
  switch (preset) {
    case "blue_italic":
      return "blue";
    case "gold_italic":
      return "gold";
    case "same_colour_italic":
      return "inherit";
    default:
      return null;
  }
}
