import { ContentStatus } from "@prisma/client";
import { prisma } from "./db";
import {
  ABOUT_PAGE_SLUG,
  ABOUT_SECTION_KEYS,
  type AboutPageContent,
} from "./about-page";

export async function applyAboutPagePayload(
  payload: AboutPageContent,
  options?: { publishedBy?: string | null; clearDraft?: boolean }
) {
  const page = await prisma.page.upsert({
    where: { slug: ABOUT_PAGE_SLUG },
    create: {
      slug: ABOUT_PAGE_SLUG,
      title: payload.hero.title || "About",
      content: "",
      summary: payload.hero.subtitle,
      status: payload.status,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      heroEyebrow: payload.hero.eyebrow,
      heroTitle: payload.hero.title,
      heroSubtitle: payload.hero.subtitle,
      heroImageUrl: payload.hero.imageUrl,
      heroImageAlt: payload.hero.imageAlt,
      heroImageFocusX: payload.hero.imageFocusX,
      heroImageFocusY: payload.hero.imageFocusY,
      heroImageZoom: payload.hero.imageZoom,
      heroOverlayStrength: payload.hero.overlayStrength,
      settingsJson: JSON.stringify(payload.images),
      publishedAt: payload.status === ContentStatus.PUBLISHED ? new Date() : null,
      publishedBy: options?.publishedBy ?? null,
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
    update: {
      title: payload.hero.title || "About",
      summary: payload.hero.subtitle,
      status: payload.status,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      heroEyebrow: payload.hero.eyebrow,
      heroTitle: payload.hero.title,
      heroSubtitle: payload.hero.subtitle,
      heroImageUrl: payload.hero.imageUrl,
      heroImageAlt: payload.hero.imageAlt,
      heroImageFocusX: payload.hero.imageFocusX,
      heroImageFocusY: payload.hero.imageFocusY,
      heroImageZoom: payload.hero.imageZoom,
      heroOverlayStrength: payload.hero.overlayStrength,
      settingsJson: JSON.stringify(payload.images),
      publishedAt: payload.status === ContentStatus.PUBLISHED ? new Date() : undefined,
      publishedBy: options?.publishedBy ?? undefined,
      ...(options?.clearDraft
        ? { draftData: null, draftEditedAt: null, draftEditedBy: null }
        : {}),
    },
  });

  for (const key of Object.values(ABOUT_SECTION_KEYS)) {
    const section = payload.sections[key];
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
        imageFocusX: section.imageFocusX,
        imageFocusY: section.imageFocusY,
        imageZoom: section.imageZoom,
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
        imageFocusX: section.imageFocusX,
        imageFocusY: section.imageFocusY,
        imageZoom: section.imageZoom,
        ctaLabel: section.ctaLabel,
        ctaHref: section.ctaHref,
        settingsJson: JSON.stringify(section.settings ?? {}),
        displayOrder: section.displayOrder,
        isActive: section.isActive,
      },
    });
  }

  const statIds = payload.statItems.map((s) => s.id).filter(Boolean) as string[];
  await prisma.statItem.deleteMany({
    where: {
      pageId: page.id,
      ...(statIds.length > 0 ? { id: { notIn: statIds } } : {}),
    },
  });

  for (const [index, stat] of payload.statItems.entries()) {
    const statData = {
      pageId: page.id,
      label: stat.label,
      value: stat.value,
      prefix: stat.prefix,
      suffix: stat.suffix,
      icon: stat.icon,
      displayOrder: index,
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
