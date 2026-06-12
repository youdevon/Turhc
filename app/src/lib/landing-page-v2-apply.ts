import { ContentStatus } from "@prisma/client";
import { prisma } from "./db";
import {
  LANDING_V2_PAGE_SLUG,
  type LandingV2PageContent,
  type LandingV2SectionKey,
} from "./landing-page-v2";

export async function applyLandingV2PagePayload(
  payload: LandingV2PageContent,
  options?: { publishedBy?: string | null; clearDraft?: boolean }
) {
  const pageSettings = {
    showPreHero: payload.settings?.showPreHero !== false,
  };

  const page = await prisma.page.upsert({
    where: { slug: LANDING_V2_PAGE_SLUG },
    create: {
      slug: LANDING_V2_PAGE_SLUG,
      title: payload.title || "Landing Page V2",
      content: "",
      status: payload.status ?? ContentStatus.PUBLISHED,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      isLandingPage: false,
      settingsJson: JSON.stringify(pageSettings),
      publishedAt: payload.status === ContentStatus.DRAFT ? null : new Date(),
      publishedBy: options?.publishedBy ?? null,
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
    update: {
      title: payload.title || "Landing Page V2",
      status: payload.status ?? ContentStatus.PUBLISHED,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      isLandingPage: false,
      settingsJson: JSON.stringify(pageSettings),
      publishedAt: payload.status === ContentStatus.DRAFT ? undefined : new Date(),
      publishedBy: options?.publishedBy ?? null,
      ...(options?.clearDraft
        ? { draftData: null, draftEditedAt: null, draftEditedBy: null }
        : {}),
    },
  });

  for (const [key, section] of Object.entries(payload.sections) as [
    LandingV2SectionKey,
    (typeof payload.sections)[LandingV2SectionKey],
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

  return page;
}
