import { SectionHeading } from "@/components/public/SectionHeading";
import { FramedImage } from "@/components/public/FramedImage";
import {
  formatAboutStatValue,
  getAboutSectionHeadingEmphasis,
  getAboutVisionMission,
  resolveAboutMainImageUrl,
  shouldShowAboutMainImage,
  type AboutPageContent,
  type AboutSectionContent,
} from "@/lib/about-page";

type Props = {
  whoWeAre: AboutSectionContent;
  images: AboutPageContent["images"];
  stats: AboutPageContent["statItems"];
};

function resolveBodyParagraphs(section: AboutSectionContent): string[] {
  return (section.body ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function AboutWhoWeAreSection({ whoWeAre, images, stats }: Props) {
  if (!whoWeAre.isActive) return null;

  const { visionTitle, visionDescription, missionTitle, missionDescription } =
    getAboutVisionMission(whoWeAre);
  const paragraphs = resolveBodyParagraphs(whoWeAre);
  const showImage = shouldShowAboutMainImage(whoWeAre);
  const mainImage = resolveAboutMainImageUrl(whoWeAre);
  const establishedYear = images.establishedYear?.trim() || null;
  const establishedLabel = images.establishedLabel?.trim() || "Established";
  const activeStats = stats.filter((item) => item.isActive).slice(0, 3);

  return (
    <section className="about-page__who-we-are section-padding">
      <div className="container-wide">
        <div className="about-page__who-grid">
          <div className="about-page__who-copy">
            <SectionHeading
              eyebrow={whoWeAre.eyebrow ?? "Who We Are"}
              heading={whoWeAre.sectionTitle ?? "Built to Serve"}
              emphasis={getAboutSectionHeadingEmphasis(whoWeAre) ?? undefined}
            />

            {paragraphs.length > 0 && (
              <div className="about-page__body-copy">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            )}

            {(visionDescription || missionDescription) && (
              <div className="about-page__vm-grid">
                <div className="about-page__vm-box">
                  <h3 className="about-page__vm-title">{visionTitle}</h3>
                  <p className="about-page__vm-body">{visionDescription}</p>
                </div>
                <div className="about-page__vm-box">
                  <h3 className="about-page__vm-title">{missionTitle}</h3>
                  <p className="about-page__vm-body">{missionDescription}</p>
                </div>
              </div>
            )}

            {activeStats.length > 0 && (
              <div className="about-page__stats">
                {activeStats.map((stat) => (
                  <div key={stat.id ?? stat.label} className="about-page__stat">
                    <p className="about-page__stat-value">{formatAboutStatValue(stat)}</p>
                    <p className="about-page__stat-label">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showImage && (
            <div className="about-page__who-media" aria-hidden={!whoWeAre.imageAlt}>
              <div className="about-page__who-image">
                <FramedImage
                  src={mainImage}
                  alt={whoWeAre.imageAlt ?? whoWeAre.sectionTitle ?? "Who we are"}
                  className="about-page__who-image-img"
                  loading="lazy"
                  imageFocusX={whoWeAre.imageFocusX}
                  imageFocusY={whoWeAre.imageFocusY}
                  imageZoom={whoWeAre.imageZoom}
                />
                {establishedYear && (
                  <div className="about-page__established-badge">
                    <span className="about-page__established-year">{establishedYear}</span>
                    <span className="about-page__established-label">{establishedLabel}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
