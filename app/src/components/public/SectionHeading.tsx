import { ArrowRight } from "lucide-react";
import { PreviewAwareLink } from "@/components/public/PreviewAwareLink";
import { cn } from "@/lib/utils";
import {
  resolveSectionEmphasisColor,
  resolveSectionEmphasisLayout,
  type SectionEmphasisColorVariant,
  type SectionEmphasisLayout,
  type SectionHeadingThemeVariant,
} from "@/lib/section-heading";

type Props = {
  eyebrow?: string;
  /** Primary statement line */
  heading?: string;
  /** @deprecated Use `heading` */
  title?: string;
  /** Contrasting emphasis words or line */
  emphasis?: string;
  /** @deprecated Use `emphasis` */
  accentText?: string;
  description?: string;
  align?: "left" | "center";
  linkLabel?: string;
  linkHref?: string;
  className?: string;
  themeVariant?: SectionHeadingThemeVariant;
  emphasisColorVariant?: SectionEmphasisColorVariant;
  emphasisLayout?: SectionEmphasisLayout;
};

export function SectionHeading({
  eyebrow,
  heading,
  title,
  emphasis,
  accentText,
  description,
  align = "left",
  linkLabel,
  linkHref,
  className,
  themeVariant = "light",
  emphasisColorVariant,
  emphasisLayout = "auto",
}: Props) {
  const mainHeading = (heading ?? title ?? "").trim();
  const emphasisText = (emphasis ?? accentText ?? "").trim();
  const resolvedLayout =
    emphasisLayout === "auto"
      ? resolveSectionEmphasisLayout(emphasisText)
      : emphasisLayout;
  const resolvedColor =
    emphasisColorVariant ?? resolveSectionEmphasisColor(emphasisText, resolvedLayout, themeVariant);
  const isBlockEmphasis = resolvedLayout === "block";

  return (
    <div
      className={cn(
        "public-section-heading-wrap",
        "public-section-heading",
        align === "center" && "public-section-heading--center",
        themeVariant === "dark" && "public-section-heading--dark",
        className
      )}
    >
      <div className="public-section-heading__body">
        {eyebrow ? (
          <p className="public-section-heading__eyebrow">
            <span className="public-section-heading__eyebrow-line" aria-hidden="true" />
            <span className="public-section-heading__eyebrow-text">{eyebrow}</span>
          </p>
        ) : null}

        {mainHeading || emphasisText ? (
          <h2
            className={cn(
              "public-section-heading__title",
              isBlockEmphasis && emphasisText && "public-section-heading__title--stacked"
            )}
          >
            {mainHeading ? (
              <span className="public-section-heading__primary">{mainHeading}</span>
            ) : null}
            {emphasisText ? (
              <span
                className={cn(
                  "public-section-heading__emphasis",
                  isBlockEmphasis
                    ? "public-section-heading__emphasis--block"
                    : "public-section-heading__emphasis--inline",
                  resolvedColor === "gold"
                    ? "public-section-heading__emphasis--gold"
                    : "public-section-heading__emphasis--blue"
                )}
              >
                {isBlockEmphasis || !mainHeading ? emphasisText : ` ${emphasisText}`}
              </span>
            ) : null}
          </h2>
        ) : null}

        {description ? <p className="public-section-heading__description">{description}</p> : null}
      </div>

      {linkLabel && linkHref ? (
        <PreviewAwareLink href={linkHref} className="public-section-heading__link">
          <span>{linkLabel}</span>
          <ArrowRight className="public-section-heading__link-icon" aria-hidden="true" />
        </PreviewAwareLink>
      ) : null}
    </div>
  );
}
