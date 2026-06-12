import { ContentStatus } from "@prisma/client";
import { prisma } from "./db";
import {
  LANDING_PAGE_SLUG,
  type LandingPageContent,
  type LandingSectionKey,
} from "./landing-page";

export async function applyLandingPagePayload(
  payload: LandingPageContent,
  options?: { publishedBy?: string | null; clearDraft?: boolean }
) {
  const heroSettings = {
    enabled: payload.hero.enabled,
    layout: payload.hero.layout ?? "contained",
    overlayStrength: payload.hero.overlayStrength,
    slideDurationMs: payload.hero.slideDurationMs,
    zoomDurationMs: payload.hero.zoomDurationMs,
    landingDisplayStyle: payload.hero.landingDisplayStyle ?? "experimental",
    v2ShowPreHero: payload.hero.v2ShowPreHero !== false,
    v2PreHeroPreset: payload.hero.v2PreHeroPreset ?? "soft_blueprint",
    v2HeroPreset: payload.hero.v2HeroPreset ?? "contained_cinematic",
  };

  const page = await prisma.page.upsert({
    where: { slug: LANDING_PAGE_SLUG },
    create: {
      slug: LANDING_PAGE_SLUG,
      title: payload.title || "Landing Page",
      content: "",
      status: payload.status ?? ContentStatus.PUBLISHED,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      isLandingPage: true,
      settingsJson: JSON.stringify(heroSettings),
      publishedAt: payload.status === ContentStatus.DRAFT ? null : new Date(),
      publishedBy: options?.publishedBy ?? null,
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
    update: {
      title: payload.title || "Landing Page",
      status: payload.status ?? ContentStatus.PUBLISHED,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      isLandingPage: true,
      settingsJson: JSON.stringify(heroSettings),
      publishedAt: payload.status === ContentStatus.DRAFT ? undefined : new Date(),
      publishedBy: options?.publishedBy ?? null,
      ...(options?.clearDraft
        ? { draftData: null, draftEditedAt: null, draftEditedBy: null }
        : {}),
    },
  });

  for (const [key, section] of Object.entries(payload.sections) as [
    LandingSectionKey,
    (typeof payload.sections)[LandingSectionKey],
  ][]) {
    await prisma.pageSection.upsert({
      where: { pageId_sectionKey: { pageId: page.id, sectionKey: key } },
      create: {
        pageId: page.id,
        sectionKey: key,
        sectionTitle: section.sectionTitle,
        eyebrow: section.eyebrow,
        subtitle: section.subtitle,
        body: section.body,
        imageUrl: section.imageUrl,
        imageAlt: section.imageAlt,
        imageFocusX: section.imageFocusX ?? 50,
        imageFocusY: section.imageFocusY ?? 50,
        imageZoom: section.imageZoom ?? 100,
        ctaLabel: section.ctaLabel,
        ctaHref: section.ctaHref,
        settingsJson: JSON.stringify(section.settings ?? {}),
        displayOrder: section.displayOrder,
        isActive: section.isActive,
      },
      update: {
        sectionTitle: section.sectionTitle,
        eyebrow: section.eyebrow,
        subtitle: section.subtitle,
        body: section.body,
        imageUrl: section.imageUrl,
        imageAlt: section.imageAlt,
        imageFocusX: section.imageFocusX ?? 50,
        imageFocusY: section.imageFocusY ?? 50,
        imageZoom: section.imageZoom ?? 100,
        ctaLabel: section.ctaLabel,
        ctaHref: section.ctaHref,
        settingsJson: JSON.stringify(section.settings ?? {}),
        displayOrder: section.displayOrder,
        isActive: section.isActive,
      },
    });
  }

  const slideIds = payload.heroSlides.map((s) => s.id).filter(Boolean) as string[];
  await prisma.heroSlide.deleteMany({
    where: {
      pageId: page.id,
      ...(slideIds.length > 0 ? { id: { notIn: slideIds } } : {}),
    },
  });

  for (const slide of payload.heroSlides) {
    const slideData = {
      pageId: page.id,
      title: slide.title || slide.heading || "Hero Slide",
      eyebrow: slide.eyebrow,
      heading: slide.heading,
      subheading: slide.subheading,
      primaryLabel: slide.primaryLabel,
      primaryUrl: slide.primaryUrl,
      secondaryLabel: slide.secondaryLabel,
      secondaryUrl: slide.secondaryUrl,
      mediaType: "IMAGE" as const,
      mediaUrl: slide.mediaUrl,
      mediaAlt: slide.mediaAlt,
      imageFocusX: slide.imageFocusX ?? 50,
      imageFocusY: slide.imageFocusY ?? 50,
      imageZoom: slide.imageZoom ?? 100,
      overlayOpacity: slide.overlayOpacity,
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
      status: slide.isActive ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
      publishedAt: slide.isActive ? new Date() : null,
    };

    if (slide.id) {
      await prisma.heroSlide.update({ where: { id: slide.id }, data: slideData });
    } else {
      await prisma.heroSlide.create({ data: slideData });
    }
  }

  const statIds = payload.statItems.map((s) => s.id).filter(Boolean) as string[];
  await prisma.statItem.deleteMany({
    where: {
      pageId: page.id,
      ...(statIds.length > 0 ? { id: { notIn: statIds } } : {}),
    },
  });

  for (const stat of payload.statItems) {
    const statData = {
      pageId: page.id,
      label: stat.label,
      value: stat.value,
      prefix: stat.prefix,
      suffix: stat.suffix,
      icon: stat.icon,
      displayOrder: stat.displayOrder,
      isActive: stat.isActive,
    };

    if (stat.id) {
      await prisma.statItem.update({ where: { id: stat.id }, data: statData });
    } else {
      await prisma.statItem.create({ data: statData });
    }
  }

  return page;
}
