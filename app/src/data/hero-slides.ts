import type { HeroSlide as DbHeroSlide } from "@prisma/client";

export type HeroSlide = {
  id: string;
  imageUrl: string;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  primaryButtonUrl: string;
  secondaryButtonLabel: string;
  secondaryButtonUrl: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "highway",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
    eyebrow: "State Enterprise",
    title: "Delivering infrastructure that powers national progress",
    subtitle:
      "Planning, procuring, and building critical highways and transport corridors with transparency and engineering excellence.",
    primaryButtonLabel: "View Projects",
    primaryButtonUrl: "/projects",
    secondaryButtonLabel: "Open Tenders",
    secondaryButtonUrl: "/tenders?status=OPEN",
  },
  {
    id: "civic",
    imageUrl:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=80",
    eyebrow: "Public Works",
    title: "Modern civic infrastructure for growing communities",
    subtitle:
      "From government facilities to urban development, we deliver projects that serve the public good for generations.",
    primaryButtonLabel: "Our Mandate",
    primaryButtonUrl: "/about",
    secondaryButtonLabel: "Governance",
    secondaryButtonUrl: "/governance",
  },
  {
    id: "construction",
    imageUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80",
    eyebrow: "Major Works",
    title: "Building at scale with world-class standards",
    subtitle:
      "Heavy infrastructure delivery backed by rigorous procurement, safety compliance, and accountable project management.",
    primaryButtonLabel: "Featured Projects",
    primaryButtonUrl: "/projects",
    secondaryButtonLabel: "Contact Us",
    secondaryButtonUrl: "/contact",
  },
  {
    id: "bridge",
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80",
    eyebrow: "Procurement",
    title: "Connecting the nation through transport infrastructure",
    subtitle:
      "Bridges, ports, and transit systems — open tenders for qualified contractors on major public works.",
    primaryButtonLabel: "Contractor Portal",
    primaryButtonUrl: "/contractors",
    secondaryButtonLabel: "View Tenders",
    secondaryButtonUrl: "/tenders",
  },
];

/** Map CMS hero slide records to the carousel slide shape. */
export function mapHeroSlidesFromDb(slides: DbHeroSlide[]): HeroSlide[] {
  return slides.map((slide) => ({
    id: slide.id,
    imageUrl: slide.mediaUrl,
    imageFocusX: slide.imageFocusX,
    imageFocusY: slide.imageFocusY,
    imageZoom: slide.imageZoom,
    eyebrow: slide.eyebrow ?? "",
    title: slide.heading,
    subtitle: slide.subheading ?? "",
    primaryButtonLabel: slide.primaryLabel ?? "",
    primaryButtonUrl: slide.primaryUrl ?? "",
    secondaryButtonLabel: slide.secondaryLabel ?? "",
    secondaryButtonUrl: slide.secondaryUrl ?? "",
  }));
}

type LandingSlideInput = {
  id?: string;
  heading: string;
  eyebrow: string | null;
  subheading: string | null;
  primaryLabel: string | null;
  primaryUrl: string | null;
  secondaryLabel: string | null;
  secondaryUrl: string | null;
  mediaUrl: string;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  sortOrder?: number;
  isActive: boolean;
};

export function mapLandingSlidesToCarousel(slides: LandingSlideInput[]): HeroSlide[] {
  return slides
    .filter((slide) => slide.isActive && slide.mediaUrl)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((slide) => ({
      id: slide.id ?? slide.heading,
      imageUrl: slide.mediaUrl,
      imageFocusX: slide.imageFocusX,
      imageFocusY: slide.imageFocusY,
      imageZoom: slide.imageZoom,
      eyebrow: slide.eyebrow ?? "",
      title: slide.heading,
      subtitle: slide.subheading ?? "",
      primaryButtonLabel: slide.primaryLabel ?? "",
      primaryButtonUrl: slide.primaryUrl ?? "",
      secondaryButtonLabel: slide.secondaryLabel ?? "",
      secondaryButtonUrl: slide.secondaryUrl ?? "",
    }));
}
