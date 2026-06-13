import { SectionHeading } from "@/components/public/SectionHeading";
import { IntroSupportingImage } from "@/components/public/IntroSupportingImage";
import {
  getIntroImageSettings,
  getSectionHeadingEmphasis,
  buildWhoWeAreColorCssVars,
  resolveIntroImageUrl,
  shouldShowIntroImage,
  type LandingSectionContent,
} from "@/lib/landing-page";
import { cn } from "@/lib/utils";

type Props = {
  section: LandingSectionContent;
};

export function IntroWhoWeAreSection({ section }: Props) {
  if (!section.isActive) return null;

  const introImage = getIntroImageSettings(section);
  const showImage = shouldShowIntroImage(section);
  const isBackground = introImage.imagePosition === "background" && showImage;
  const colorVars = buildWhoWeAreColorCssVars(section);

  const textBlock = (
    <SectionHeading
      eyebrow={section.eyebrow ?? undefined}
      title={section.sectionTitle ?? ""}
      emphasis={getSectionHeadingEmphasis(section) ?? undefined}
      description={section.body ?? undefined}
    />
  );

  const imageBlock = showImage && !isBackground && (
    <IntroSupportingImage
      imageUrl={resolveIntroImageUrl(section)}
      imageAlt={section.imageAlt ?? section.sectionTitle ?? "Who we are"}
      tagline={introImage.tagline}
      caption={introImage.imageCaption}
      imageFocusX={section.imageFocusX}
      imageFocusY={section.imageFocusY}
      imageZoom={section.imageZoom}
    />
  );

  return (
    <section
      className={cn(
        "intro-who-we-are-section section-padding bg-background relative overflow-hidden",
        !isBackground && "intro-section--textured",
        isBackground && "intro-section--background"
      )}
      style={{
        ...colorVars,
        ...(isBackground
          ? {
              backgroundImage: `linear-gradient(to right, color-mix(in srgb, var(--bg) 92%, transparent), color-mix(in srgb, var(--bg) 78%, transparent)), url(${resolveIntroImageUrl(section)})`,
              backgroundSize: "cover",
              backgroundPosition: `${section.imageFocusX ?? 50}% ${section.imageFocusY ?? 50}%`,
            }
          : undefined),
      }}
    >
      <div className="container-wide relative z-10">
        {showImage && introImage.imagePosition !== "hidden" ? (
          <div
            className={cn(
              "grid gap-8 lg:gap-10 items-center",
              isBackground ? "max-w-2xl" : "lg:grid-cols-2"
            )}
          >
            <div className={introImage.imagePosition === "left" ? "lg:order-2" : undefined}>
              {textBlock}
            </div>
            {imageBlock && (
              <div className={introImage.imagePosition === "left" ? "lg:order-1" : undefined}>
                {imageBlock}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl">{textBlock}</div>
        )}
      </div>
    </section>
  );
}
