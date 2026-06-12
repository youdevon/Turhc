import { SectionHeading } from "@/components/public/SectionHeading";
import { FramedImage } from "@/components/public/FramedImage";
import {
  formatStatValue,
  getIntroImageSettings,
  getSectionHeadingEmphasis,
  resolveIntroImageUrl,
  shouldShowIntroImage,
  type LandingSectionContent,
  type LandingStatItem,
  type MandateCard,
} from "@/lib/landing-page";
import { STOCK_IMAGES } from "@/data/stock-images";

type VisionMissionBox = {
  title: string;
  description: string;
};

type Props = {
  whoWeAre: LandingSectionContent;
  mandateCards: MandateCard[];
  whoWeAreFallback: string;
  mandateFallback: string;
  stats: LandingStatItem[];
  secondaryImageUrl?: string | null;
};

function findCardDescription(cards: MandateCard[], keyword: string): string | null {
  const match = cards.find((card) => card.title.toLowerCase().includes(keyword));
  return match?.description?.trim() || null;
}

function resolveVisionMission(
  cards: MandateCard[],
  whoWeAreFallback: string,
  mandateFallback: string
): [VisionMissionBox, VisionMissionBox] {
  const visionDescription = findCardDescription(cards, "vision") ?? whoWeAreFallback.trim();
  const missionDescription = findCardDescription(cards, "mission") ?? mandateFallback.trim();

  return [
    { title: "Vision", description: visionDescription },
    { title: "Mission", description: missionDescription },
  ];
}

function resolveBodyParagraphs(section: LandingSectionContent, fallbacks: string[]): string[] {
  const fromBody = (section.body ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (fromBody.length >= 2) return fromBody;

  const [primaryFallback, secondaryFallback] = fallbacks.map((p) => p.trim()).filter(Boolean);

  if (fromBody.length === 1 && secondaryFallback && fromBody[0] !== secondaryFallback) {
    return [fromBody[0], secondaryFallback];
  }

  if (fromBody.length > 0) return fromBody;

  return [primaryFallback, secondaryFallback].filter(Boolean);
}

function resolveEstablishedYear(tagline?: string | null): string | null {
  if (!tagline?.trim()) return null;

  const trimmed = tagline.trim();
  if (/^\d{4}$/.test(trimmed)) return trimmed;

  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
  return yearMatch?.[0] ?? null;
}

export function AboutWhoWeAreSection({
  whoWeAre,
  mandateCards,
  whoWeAreFallback,
  mandateFallback,
  stats,
  secondaryImageUrl,
}: Props) {
  const [vision, mission] = resolveVisionMission(mandateCards, whoWeAreFallback, mandateFallback);
  const paragraphs = resolveBodyParagraphs(whoWeAre, [whoWeAreFallback, mandateFallback]);
  const introImage = getIntroImageSettings(whoWeAre);
  const showImage = shouldShowIntroImage(whoWeAre);
  const mainImage = resolveIntroImageUrl(whoWeAre);
  const accentImage = secondaryImageUrl?.trim() || STOCK_IMAGES.housing;
  const establishedYear = resolveEstablishedYear(introImage.tagline);

  return (
    <section className="about-page__who-we-are section-padding">
      <div className="container-wide">
        <div className="about-page__who-grid">
          <div className="about-page__who-copy">
            <SectionHeading
              eyebrow={whoWeAre.eyebrow ?? "Who We Are"}
              heading={whoWeAre.sectionTitle ?? "Built to Serve"}
              emphasis={getSectionHeadingEmphasis(whoWeAre) ?? "Every Family"}
            />

            {paragraphs.length > 0 && (
              <div className="about-page__body-copy">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            )}

            {(vision.description || mission.description) && (
              <div className="about-page__vm-grid">
                <div className="about-page__vm-box">
                  <h3 className="about-page__vm-title">{vision.title}</h3>
                  <p className="about-page__vm-body">{vision.description}</p>
                </div>
                <div className="about-page__vm-box">
                  <h3 className="about-page__vm-title">{mission.title}</h3>
                  <p className="about-page__vm-body">{mission.description}</p>
                </div>
              </div>
            )}

            {stats.length > 0 && (
              <div className="about-page__stats">
                {stats.map((stat) => (
                  <div key={stat.id ?? stat.label} className="about-page__stat">
                    <p className="about-page__stat-value">{formatStatValue(stat)}</p>
                    <p className="about-page__stat-label">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showImage && (
            <div className="about-page__who-media" aria-hidden={!whoWeAre.imageAlt}>
              <div className="about-page__image-stack">
                <div className="about-page__image-stack-main">
                  <FramedImage
                    src={mainImage}
                    alt={whoWeAre.imageAlt ?? whoWeAre.sectionTitle ?? "Who we are"}
                    className="about-page__stack-img"
                    loading="lazy"
                    imageFocusX={whoWeAre.imageFocusX}
                    imageFocusY={whoWeAre.imageFocusY}
                    imageZoom={whoWeAre.imageZoom}
                  />
                  {establishedYear && (
                    <div className="about-page__established-badge">
                      <span className="about-page__established-year">{establishedYear}</span>
                      <span className="about-page__established-label">Established</span>
                    </div>
                  )}
                </div>
                <div className="about-page__image-stack-accent">
                  <FramedImage
                    src={accentImage}
                    alt=""
                    className="about-page__stack-img"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
