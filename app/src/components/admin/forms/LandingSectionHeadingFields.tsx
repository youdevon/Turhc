import type { LandingSectionContent } from "@/lib/landing-page";
import { getSectionHeadingEmphasis } from "@/lib/landing-page";

type Props = {
  section: LandingSectionContent;
  onUpdate: (patch: Partial<LandingSectionContent>) => void;
  onUpdateSettings: (patch: Record<string, unknown>) => void;
  showDescription?: boolean;
  descriptionLabel?: string;
  descriptionField?: "subtitle" | "body";
  showLink?: boolean;
};

export function LandingSectionHeadingFields({
  section,
  onUpdate,
  onUpdateSettings,
  showDescription = false,
  descriptionLabel = "Description",
  descriptionField = "subtitle",
  showLink = false,
}: Props) {
  const descriptionValue =
    descriptionField === "body" ? (section.body ?? "") : (section.subtitle ?? "");

  return (
    <>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground-muted">Eyebrow label</span>
        <input
          value={section.eyebrow ?? ""}
          onChange={(e) => onUpdate({ eyebrow: e.target.value })}
          className="admin-input"
          placeholder="e.g. Our Services"
        />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-foreground-muted">Heading main</span>
        <input
          value={section.sectionTitle ?? ""}
          onChange={(e) => onUpdate({ sectionTitle: e.target.value })}
          className="admin-input"
          placeholder="e.g. Dedicated to"
        />
      </label>
      <label className="space-y-1.5 text-sm md:col-span-2">
        <span className="font-medium text-foreground-muted">Heading emphasis (optional)</span>
        <input
          value={getSectionHeadingEmphasis(section) ?? ""}
          onChange={(e) =>
            onUpdateSettings({
              headingEmphasis: e.target.value,
              accentText: e.target.value,
            })
          }
          className="admin-input"
          placeholder='e.g. Enhancing Lives — or "in Under 2 Minutes" for a continuation phrase'
        />
      </label>
      {showDescription ? (
        <label className="space-y-1.5 text-sm md:col-span-2">
          <span className="font-medium text-foreground-muted">{descriptionLabel}</span>
          <textarea
            rows={3}
            value={descriptionValue}
            onChange={(e) =>
              onUpdate(descriptionField === "body" ? { body: e.target.value } : { subtitle: e.target.value })
            }
            className="admin-input"
          />
        </label>
      ) : null}
      {showLink ? (
        <>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-foreground-muted">Link text</span>
            <input
              value={section.ctaLabel ?? ""}
              onChange={(e) => onUpdate({ ctaLabel: e.target.value })}
              className="admin-input"
              placeholder="e.g. View All Schemes"
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-foreground-muted">Link URL</span>
            <input
              value={section.ctaHref ?? ""}
              onChange={(e) => onUpdate({ ctaHref: e.target.value })}
              className="admin-input"
              placeholder="/schemes"
            />
          </label>
        </>
      ) : null}
    </>
  );
}
