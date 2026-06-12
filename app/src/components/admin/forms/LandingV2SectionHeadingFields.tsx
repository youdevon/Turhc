import type { LandingV2SectionContent } from "@/lib/landing-page-v2";
import { getV2SectionHeadingEmphasis } from "@/lib/landing-page-v2";
import {
  V2_EMPHASIS_PRESETS,
  V2_HEADING_SIZES,
  V2_HEADING_STYLES,
} from "@/lib/landing-page-v2-presets";

type Props = {
  section: LandingV2SectionContent;
  onUpdate: (patch: Partial<LandingV2SectionContent>) => void;
  onUpdateSettings: (patch: Record<string, unknown>) => void;
  showDescription?: boolean;
  descriptionField?: "subtitle" | "body";
  showLink?: boolean;
};

export function LandingV2SectionHeadingFields({
  section,
  onUpdate,
  onUpdateSettings,
  showDescription = false,
  descriptionField = "subtitle",
  showLink = false,
}: Props) {
  const descriptionValue =
    descriptionField === "body" ? (section.body ?? "") : (section.subtitle ?? "");

  return (
    <>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground-muted">Eyebrow label</span>
        <input value={section.eyebrow ?? ""} onChange={(e) => onUpdate({ eyebrow: e.target.value })} className="admin-input" />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground-muted">Heading main</span>
        <input value={section.sectionTitle ?? ""} onChange={(e) => onUpdate({ sectionTitle: e.target.value })} className="admin-input" />
      </label>
      <label className="space-y-1.5 text-sm md:col-span-2">
        <span className="font-medium text-foreground-muted">Heading emphasis</span>
        <input
          value={getV2SectionHeadingEmphasis(section) ?? ""}
          onChange={(e) => onUpdateSettings({ headingEmphasis: e.target.value, accentText: e.target.value })}
          className="admin-input"
        />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground-muted">Heading style</span>
        <select value={(section.settings.headingStyle as string) ?? "standard"} onChange={(e) => onUpdateSettings({ headingStyle: e.target.value })} className="admin-input">
          {V2_HEADING_STYLES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground-muted">Heading size</span>
        <select value={(section.settings.headingSize as string) ?? "medium"} onChange={(e) => onUpdateSettings({ headingSize: e.target.value })} className="admin-input">
          {V2_HEADING_SIZES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </label>
      <label className="space-y-1.5 text-sm md:col-span-2">
        <span className="font-medium text-foreground-muted">Emphasis preset</span>
        <select value={(section.settings.emphasisPreset as string) ?? "blue_italic"} onChange={(e) => onUpdateSettings({ emphasisPreset: e.target.value })} className="admin-input">
          {V2_EMPHASIS_PRESETS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </label>
      {showDescription ? (
        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground-muted">Description</span>
          <textarea rows={3} value={descriptionValue} onChange={(e) => onUpdate(descriptionField === "body" ? { body: e.target.value } : { subtitle: e.target.value })} className="admin-input" />
        </label>
      ) : null}
      {showLink ? (
        <>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-foreground-muted">Link text</span>
            <input value={section.ctaLabel ?? ""} onChange={(e) => onUpdate({ ctaLabel: e.target.value })} className="admin-input" />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-foreground-muted">Link URL</span>
            <input value={section.ctaHref ?? ""} onChange={(e) => onUpdate({ ctaHref: e.target.value })} className="admin-input" />
          </label>
        </>
      ) : null}
    </>
  );
}
