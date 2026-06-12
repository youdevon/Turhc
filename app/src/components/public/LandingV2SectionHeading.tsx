import { SectionHeading } from "@/components/public/SectionHeading";
import {
  getV2EmphasisColorVariant,
  getV2SectionHeadingEmphasis,
  type LandingV2SectionContent,
} from "@/lib/landing-page-v2";
import type { V2HeadingSize, V2HeadingStyle } from "@/lib/landing-page-v2-presets";
import { cn } from "@/lib/utils";

type Props = {
  section: LandingV2SectionContent;
  align?: "left" | "center";
  className?: string;
};

export function LandingV2SectionHeading({ section, align = "left", className }: Props) {
  const headingStyle = section.settings.headingStyle as V2HeadingStyle | undefined;
  const headingSize = section.settings.headingSize as V2HeadingSize | undefined;
  const emphasisPreset = section.settings.emphasisPreset;
  const emphasisColor = getV2EmphasisColorVariant(section);

  return (
    <SectionHeading
      eyebrow={section.eyebrow ?? undefined}
      heading={section.sectionTitle ?? ""}
      emphasis={getV2SectionHeadingEmphasis(section) ?? undefined}
      description={(section.subtitle ?? section.body) ?? undefined}
      linkLabel={section.ctaLabel ?? undefined}
      linkHref={section.ctaHref ?? undefined}
      align={align}
      emphasisColorVariant={
        emphasisColor === "blue" ? "blue" : emphasisColor === "gold" ? "gold" : undefined
      }
      className={cn(
        "landing-v2__section-heading",
        headingStyle && `landing-v2__section-heading--style-${headingStyle}`,
        headingSize && `landing-v2__section-heading--size-${headingSize}`,
        emphasisPreset === "same_colour_italic" && "landing-v2__section-heading--same-emphasis",
        className
      )}
    />
  );
}
