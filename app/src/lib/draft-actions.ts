"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContentStatus } from "@prisma/client";
import { prisma } from "./db";
import { auditContentAction, requireAdmin } from "./admin-actions";
import { getRecordStatus, parseDraftJson } from "./content-draft";
import { applyLandingPagePayload } from "./landing-page-apply";
import {
  LANDING_PAGE_SLUG,
  sanitizeLandingPagePayload,
  validateLandingPagePayload,
  type LandingPageContent,
} from "./landing-page";
import { applyLandingV2PagePayload } from "./landing-page-v2-apply";
import { LANDING_V2_PAGE_SLUG, type LandingV2PageContent } from "./landing-page-v2";
import { revalidateLandingV2Page, revalidateAboutPage, revalidatePublicPage, revalidatePublicSite } from "./revalidate-public";
import {
  ABOUT_PAGE_SLUG,
  sanitizeAboutPagePayload,
  validateAboutPagePayload,
  type AboutPageContent,
} from "./about-page";
import { applyAboutPagePayload } from "./about-page-apply";
import { GOVERNANCE_DOCUMENT_SECTION_PATHS } from "./document-categories";
import { slugify } from "./utils";
import { parseHeroImageFraming, parseImageFraming, parsePhotoFraming } from "./photo-framing";

function actorName(session: { user: { name?: string | null; email?: string | null } }) {
  return session.user.name ?? session.user.email ?? null;
}

async function setPublishedDate(status: ContentStatus, existing?: Date | null) {
  if (status === ContentStatus.PUBLISHED) return existing ?? new Date();
  return existing ?? null;
}

// ——— Landing Page ———

export async function saveLandingPageDraft(formData: FormData) {
  const session = await requireAdmin();
  const raw = formData.get("payload") as string;
  if (!raw) throw new Error("Missing landing page payload");
  const payload = sanitizeLandingPagePayload(JSON.parse(raw) as LandingPageContent);
  const validationError = validateLandingPagePayload(payload);
  if (validationError) throw new Error(validationError);

  const page = await prisma.page.findUnique({ where: { slug: LANDING_PAGE_SLUG } });
  const isLive = page?.status === ContentStatus.PUBLISHED;

  if (!isLive) {
    await applyLandingPagePayload(
      { ...payload, status: ContentStatus.DRAFT },
      { publishedBy: null, clearDraft: true }
    );
    await prisma.page.update({
      where: { slug: LANDING_PAGE_SLUG },
      data: { status: ContentStatus.DRAFT, publishedAt: null },
    });
  } else {
    await prisma.page.update({
      where: { slug: LANDING_PAGE_SLUG },
      data: {
        draftData: JSON.stringify(payload),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "Landing Page",
    recordName: "Landing Page",
    recordId: page?.id,
    summary: "Saved draft changes for Landing Page.",
  });

  revalidatePath("/admin/landing-page-v2");
}

export async function publishLandingPage(formData: FormData) {
  const session = await requireAdmin();
  const raw = formData.get("payload") as string;
  if (!raw) throw new Error("Missing landing page payload");
  const payload = sanitizeLandingPagePayload(JSON.parse(raw) as LandingPageContent);
  const validationError = validateLandingPagePayload(payload);
  if (validationError) throw new Error(validationError);

  const page = await applyLandingPagePayload(
    { ...payload, status: ContentStatus.PUBLISHED },
    { publishedBy: actorName(session), clearDraft: true }
  );

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "Landing Page",
    recordName: page.title,
    recordId: page.id,
    summary: "Published changes to Landing Page.",
  });

  await revalidatePublicSite();
  revalidatePath("/admin/landing-page-v2");
}

export async function discardLandingPageDraft() {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { slug: LANDING_PAGE_SLUG } });
  if (!page?.draftData) return;

  await prisma.page.update({
    where: { slug: LANDING_PAGE_SLUG },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });

  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "Landing Page",
    recordName: "Landing Page",
    recordId: page.id,
    summary: "Discarded draft changes for Landing Page.",
  });

  revalidatePath("/admin/landing-page-v2");
}



// ——— Landing Page V2 ———

export async function saveLandingV2PageDraft(formData: FormData) {
  const session = await requireAdmin();
  const raw = formData.get("payload") as string;
  if (!raw) throw new Error("Missing landing page V2 payload");
  const payload = JSON.parse(raw) as LandingV2PageContent;

  const page = await prisma.page.findUnique({ where: { slug: LANDING_V2_PAGE_SLUG } });
  const isLive = page?.status === ContentStatus.PUBLISHED;

  if (!isLive) {
    await applyLandingV2PagePayload(
      { ...payload, status: ContentStatus.DRAFT },
      { publishedBy: null, clearDraft: true }
    );
    await prisma.page.update({
      where: { slug: LANDING_V2_PAGE_SLUG },
      data: { status: ContentStatus.DRAFT, publishedAt: null },
    });
  } else {
    await prisma.page.update({
      where: { slug: LANDING_V2_PAGE_SLUG },
      data: {
        draftData: JSON.stringify(payload),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "Landing Page V2",
    recordName: "Landing Page V2",
    recordId: page?.id,
    summary: "Saved draft changes for Landing Page V2.",
  });

  revalidatePath("/admin/landing-page-v2");
}

export async function publishLandingV2Page(formData: FormData) {
  const session = await requireAdmin();
  const raw = formData.get("payload") as string;
  if (!raw) throw new Error("Missing landing page V2 payload");
  const payload = JSON.parse(raw) as LandingV2PageContent;

  const page = await applyLandingV2PagePayload(
    { ...payload, status: ContentStatus.PUBLISHED },
    { publishedBy: actorName(session), clearDraft: true }
  );

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "Landing Page V2",
    recordName: page.title,
    recordId: page.id,
    summary: "Published changes to Landing Page V2.",
  });

  revalidateLandingV2Page();
  revalidatePath("/admin/landing-page-v2");
}

export async function discardLandingV2PageDraft() {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { slug: LANDING_V2_PAGE_SLUG } });
  if (!page?.draftData) return;

  await prisma.page.update({
    where: { slug: LANDING_V2_PAGE_SLUG },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });

  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "Landing Page V2",
    recordName: "Landing Page V2",
    recordId: page.id,
    summary: "Discarded draft changes for Landing Page V2.",
  });

  revalidatePath("/admin/landing-page-v2");
}
// ——— Projects ———

function extractProjectData(formData: FormData) {
  return {
    title: formData.get("title") as string,
    slug: (formData.get("slug") as string) || slugify(formData.get("title") as string),
    sector: formData.get("sector") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
    status: formData.get("projectStatus") as never,
    progressPercent: parseInt(formData.get("progressPercent") as string) || 0,
    contractor: (formData.get("contractor") as string) || null,
    contractValue: formData.get("contractValue") ? parseFloat(formData.get("contractValue") as string) : null,
    startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : null,
    expectedCompletion: formData.get("expectedCompletion")
      ? new Date(formData.get("expectedCompletion") as string)
      : null,
    actualCompletion: formData.get("actualCompletion")
      ? new Date(formData.get("actualCompletion") as string)
      : null,
    featuredImageId: (formData.get("featuredImageId") as string) || null,
    featuredImageUrl: (formData.get("featuredImageUrl") as string) || null,
    featuredImageAlt: (formData.get("featuredImageAlt") as string) || null,
    ...parseImageFraming(formData),
    cardSummary: (formData.get("cardSummary") as string) || null,
    featured: formData.get("featured") === "on",
  };
}

export async function saveProjectDraft(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string | null;
  const data = extractProjectData(formData);

  if (!id) {
    const project = await prisma.project.create({
      data: { ...data, statusContent: ContentStatus.DRAFT },
    });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Projects",
      recordName: project.title,
      recordId: project.id,
      summary: `Created draft project "${project.title}"`,
    });
    redirect(`/admin/projects/${project.id}`);
  }

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) throw new Error("Project not found");

  if (existing.statusContent === ContentStatus.PUBLISHED) {
    await prisma.project.update({
      where: { id },
      data: {
        draftData: JSON.stringify(data),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  } else {
    await prisma.project.update({
      where: { id },
      data: { ...data, statusContent: ContentStatus.DRAFT, draftData: null },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "Projects",
    recordName: data.title,
    recordId: id,
    summary: `Saved draft changes for Project: ${data.title}.`,
  });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
}

export async function publishProject(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;
  const data = extractProjectData(formData);
  const existing = await prisma.project.findUnique({ where: { id } });

  await prisma.project.update({
    where: { id },
    data: {
      ...data,
      statusContent: ContentStatus.PUBLISHED,
      publishedAt: await setPublishedDate(ContentStatus.PUBLISHED, existing?.publishedAt),
      publishedBy: actorName(session),
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
  });

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "Projects",
    recordName: data.title,
    recordId: id,
    summary: `Published changes to Project: ${data.title}.`,
  });

  await revalidatePublicSite();
  revalidatePath(`/projects/${data.slug}`);
  revalidatePath(`/admin/projects/${id}`);
}

export async function discardProjectDraft(id: string, title: string) {
  await requireAdmin();
  await prisma.project.update({
    where: { id },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });
  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "Projects",
    recordName: title,
    recordId: id,
    summary: `Discarded draft changes for Project: ${title}.`,
  });
  revalidatePath(`/admin/projects/${id}`);
}

// ——— Pages ———

function extractPageData(formData: FormData) {
  const overlayRaw = formData.get("heroOverlayStrength") as string;
  return {
    title: formData.get("title") as string,
    slug: (formData.get("slug") as string) || slugify(formData.get("title") as string),
    summary: (formData.get("summary") as string) || null,
    content: formData.get("content") as string,
    metaTitle: (formData.get("metaTitle") as string) || null,
    metaDescription: (formData.get("metaDescription") as string) || null,
    heroEyebrow: (formData.get("heroEyebrow") as string) || null,
    heroTitle: (formData.get("heroTitle") as string) || null,
    heroSubtitle: (formData.get("heroSubtitle") as string) || null,
    heroImageUrl: (formData.get("heroImageUrl") as string) || null,
    heroImageAlt: (formData.get("heroImageAlt") as string) || null,
    ...parseHeroImageFraming(formData),
    heroCtaLabel: (formData.get("heroCtaLabel") as string) || null,
    heroCtaHref: (formData.get("heroCtaHref") as string) || null,
    heroOverlayStrength: overlayRaw ? parseFloat(overlayRaw) : null,
  };
}

export async function savePageDraft(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string | null;
  const data = extractPageData(formData);

  if (!id) {
    const page = await prisma.page.create({
      data: { ...data, content: data.content, status: ContentStatus.DRAFT },
    });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Pages",
      recordName: page.title,
      recordId: page.id,
      summary: `Created draft page "${page.title}"`,
    });
    redirect(`/admin/pages/${page.id}`);
  }

  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) throw new Error("Page not found");

  if (existing.status === ContentStatus.PUBLISHED) {
    await prisma.page.update({
      where: { id },
      data: {
        draftData: JSON.stringify(data),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  } else {
    await prisma.page.update({
      where: { id },
      data: { ...data, status: ContentStatus.DRAFT, draftData: null },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "Pages",
    recordName: data.title,
    recordId: id,
    summary: `Saved draft changes for Page: ${data.title}.`,
  });

  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${id}`);
}

export async function publishPageContent(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;
  const data = extractPageData(formData);
  const existing = await prisma.page.findUnique({ where: { id } });

  await prisma.page.update({
    where: { id },
    data: {
      ...data,
      status: ContentStatus.PUBLISHED,
      publishedAt: await setPublishedDate(ContentStatus.PUBLISHED, existing?.publishedAt),
      publishedBy: actorName(session),
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
  });

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "Pages",
    recordName: data.title,
    recordId: id,
    summary: `Published changes to Page: ${data.title}.`,
  });

  await revalidatePublicPage(data.slug);
  revalidatePath(`/admin/pages/${id}`);
}

export async function discardPageDraft(id: string, title: string) {
  await requireAdmin();
  await prisma.page.update({
    where: { id },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });
  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "Pages",
    recordName: title,
    recordId: id,
    summary: `Discarded draft changes for Page: ${title}.`,
  });
  revalidatePath(`/admin/pages/${id}`);
}

// ——— Tenders ———

function extractTenderData(formData: FormData) {
  return {
    referenceNumber: formData.get("referenceNumber") as string,
    title: formData.get("title") as string,
    slug: (formData.get("slug") as string) || slugify(formData.get("title") as string),
    category: formData.get("category") as string,
    department: formData.get("department") as string,
    description: formData.get("description") as string,
    openingDate: new Date(formData.get("openingDate") as string),
    closingDate: new Date(formData.get("closingDate") as string),
    status: formData.get("tenderStatus") as never,
    estimatedValue: formData.get("estimatedValue") ? parseFloat(formData.get("estimatedValue") as string) : null,
    successfulBidder: (formData.get("successfulBidder") as string) || null,
    awardInfo: (formData.get("awardInfo") as string) || null,
    heroImageUrl: (formData.get("heroImageUrl") as string) || null,
    heroImageAlt: (formData.get("heroImageAlt") as string) || null,
    ...parseHeroImageFraming(formData),
  };
}

async function saveTenderDraftImpl(session: Awaited<ReturnType<typeof requireAdmin>>, formData: FormData) {
  const id = formData.get("id") as string | null;
  const data = extractTenderData(formData);

  if (!id) {
    const tender = await prisma.tender.create({ data: { ...data, statusContent: ContentStatus.DRAFT } });
    redirect(`/admin/tenders/${tender.id}`);
  }

  const existing = await prisma.tender.findUnique({ where: { id } });
  if (!existing) throw new Error("Tender not found");

  if (existing.statusContent === ContentStatus.PUBLISHED) {
    await prisma.tender.update({
      where: { id },
      data: {
        draftData: JSON.stringify(data),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  } else {
    await prisma.tender.update({
      where: { id },
      data: { ...data, statusContent: ContentStatus.DRAFT, draftData: null },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "Tenders",
    recordName: data.title,
    recordId: id,
    summary: `Saved draft changes for Tender: ${data.title}.`,
  });

  revalidatePath(`/admin/tenders/${id}`);
}

export async function saveTenderDraft(formData: FormData) {
  const session = await requireAdmin();
  await saveTenderDraftImpl(session, formData);
}

export async function publishTenderContent(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;
  const data = extractTenderData(formData);
  const existing = await prisma.tender.findUnique({ where: { id } });

  await prisma.tender.update({
    where: { id },
    data: {
      ...data,
      statusContent: ContentStatus.PUBLISHED,
      publishedAt: await setPublishedDate(ContentStatus.PUBLISHED, existing?.publishedAt),
      publishedBy: actorName(session),
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
  });

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "Tenders",
    recordName: data.title,
    recordId: id,
    summary: `Published changes to Tender: ${data.title}.`,
  });

  revalidatePath("/tenders");
  revalidatePath(`/tenders/${data.slug}`);
  revalidatePath(`/admin/tenders/${id}`);
}

export async function discardTenderDraft(id: string, title: string) {
  await requireAdmin();
  await prisma.tender.update({
    where: { id },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });
  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "Tenders",
    recordName: title,
    recordId: id,
    summary: `Discarded draft changes for Tender: ${title}.`,
  });
  revalidatePath(`/admin/tenders/${id}`);
}

// ——— News ———

function extractNewsData(formData: FormData) {
  return {
    title: formData.get("title") as string,
    slug: (formData.get("slug") as string) || slugify(formData.get("title") as string),
    category: formData.get("category") as string,
    summary: formData.get("summary") as string,
    body: formData.get("body") as string,
    featuredImageId: (formData.get("featuredImageId") as string) || null,
    ...parseImageFraming(formData),
    projectId: (formData.get("projectId") as string) || null,
    tenderId: (formData.get("tenderId") as string) || null,
  };
}

export async function saveNewsDraft(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string | null;
  const data = extractNewsData(formData);

  if (!id) {
    const post = await prisma.newsPost.create({ data: { ...data, status: ContentStatus.DRAFT } });
    redirect(`/admin/news/${post.id}`);
  }

  const existing = await prisma.newsPost.findUnique({ where: { id } });
  if (!existing) throw new Error("News post not found");

  if (existing.status === ContentStatus.PUBLISHED) {
    await prisma.newsPost.update({
      where: { id },
      data: {
        draftData: JSON.stringify(data),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  } else {
    await prisma.newsPost.update({
      where: { id },
      data: { ...data, status: ContentStatus.DRAFT, draftData: null },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "News",
    recordName: data.title,
    recordId: id,
    summary: `Saved draft changes for News: ${data.title}.`,
  });

  revalidatePath(`/admin/news/${id}`);
}

export async function publishNewsContent(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;
  const data = extractNewsData(formData);
  const existing = await prisma.newsPost.findUnique({ where: { id } });

  await prisma.newsPost.update({
    where: { id },
    data: {
      ...data,
      status: ContentStatus.PUBLISHED,
      publishedAt: await setPublishedDate(ContentStatus.PUBLISHED, existing?.publishedAt),
      publishedBy: actorName(session),
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
  });

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "News",
    recordName: data.title,
    recordId: id,
    summary: `Published changes to News: ${data.title}.`,
  });

  revalidatePath("/news");
  revalidatePath(`/news/${data.slug}`);
  revalidatePath(`/admin/news/${id}`);
}

export async function discardNewsDraft(id: string, title: string) {
  await requireAdmin();
  await prisma.newsPost.update({
    where: { id },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });
  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "News",
    recordName: title,
    recordId: id,
    summary: `Discarded draft changes for News: ${title}.`,
  });
  revalidatePath(`/admin/news/${id}`);
}

// ——— Board / Leadership ———

function parsePhotoFocus(formData: FormData) {
  return parsePhotoFraming(formData);
}

function extractBoardData(formData: FormData) {
  return {
    name: formData.get("name") as string,
    title: formData.get("title") as string,
    bio: (formData.get("bio") as string) || null,
    photoId: (formData.get("photoId") as string) || null,
    ...parsePhotoFocus(formData),
    sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
  };
}

export async function saveBoardMemberDraft(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string | null;
  const data = extractBoardData(formData);

  if (!id) {
    const member = await prisma.boardMember.create({ data: { ...data, status: ContentStatus.DRAFT } });
    redirect(`/admin/board/${member.id}`);
  }

  const existing = await prisma.boardMember.findUnique({ where: { id } });
  if (!existing) throw new Error("Board member not found");

  if (existing.status === ContentStatus.PUBLISHED) {
    await prisma.boardMember.update({
      where: { id },
      data: {
        draftData: JSON.stringify(data),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  } else {
    await prisma.boardMember.update({
      where: { id },
      data: { ...data, status: ContentStatus.DRAFT, draftData: null },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "Board",
    recordName: data.name,
    recordId: id,
    summary: `Saved draft changes for board member ${data.name}.`,
  });

  revalidatePath(`/admin/board/${id}`);
}

export async function publishBoardMemberContent(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;
  const data = extractBoardData(formData);
  const existing = await prisma.boardMember.findUnique({ where: { id } });

  await prisma.boardMember.update({
    where: { id },
    data: {
      ...data,
      status: ContentStatus.PUBLISHED,
      publishedAt: await setPublishedDate(ContentStatus.PUBLISHED, existing?.publishedAt),
      publishedBy: actorName(session),
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
  });

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "Board",
    recordName: data.name,
    recordId: id,
    summary: `Published changes for board member ${data.name}.`,
  });

  revalidatePath("/governance/board");
  revalidatePath(`/admin/board/${id}`);
  revalidatePath("/about");
}

export async function discardBoardMemberDraft(id: string, name: string) {
  await requireAdmin();
  await prisma.boardMember.update({
    where: { id },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });
  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "Board",
    recordName: name,
    recordId: id,
    summary: `Discarded draft changes for board member ${name}.`,
  });
  revalidatePath(`/admin/board/${id}`);
}

function extractLeadershipData(formData: FormData) {
  return {
    name: formData.get("name") as string,
    title: formData.get("title") as string,
    department: (formData.get("department") as string) || null,
    bio: (formData.get("bio") as string) || null,
    photoId: (formData.get("photoId") as string) || null,
    ...parsePhotoFocus(formData),
    sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
  };
}

export async function saveLeadershipMemberDraft(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string | null;
  const data = extractLeadershipData(formData);

  if (!id) {
    const member = await prisma.leadershipMember.create({
      data: { ...data, status: ContentStatus.DRAFT },
    });
    redirect(`/admin/leadership/${member.id}`);
  }

  const existing = await prisma.leadershipMember.findUnique({ where: { id } });
  if (!existing) throw new Error("Leadership member not found");

  if (existing.status === ContentStatus.PUBLISHED) {
    await prisma.leadershipMember.update({
      where: { id },
      data: {
        draftData: JSON.stringify(data),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  } else {
    await prisma.leadershipMember.update({
      where: { id },
      data: { ...data, status: ContentStatus.DRAFT, draftData: null },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "Leadership",
    recordName: data.name,
    recordId: id,
    summary: `Saved draft changes for leadership member ${data.name}.`,
  });

  revalidatePath(`/admin/leadership/${id}`);
}

export async function publishLeadershipMemberContent(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;
  const data = extractLeadershipData(formData);
  const existing = await prisma.leadershipMember.findUnique({ where: { id } });

  await prisma.leadershipMember.update({
    where: { id },
    data: {
      ...data,
      status: ContentStatus.PUBLISHED,
      publishedAt: await setPublishedDate(ContentStatus.PUBLISHED, existing?.publishedAt),
      publishedBy: actorName(session),
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
  });

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "Leadership",
    recordName: data.name,
    recordId: id,
    summary: `Published changes for leadership member ${data.name}.`,
  });

  revalidatePath("/about");
  revalidatePath("/governance/leadership");
  revalidatePath(`/admin/leadership/${id}`);
}

export async function discardLeadershipMemberDraft(id: string, name: string) {
  await requireAdmin();
  await prisma.leadershipMember.update({
    where: { id },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });
  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "Leadership",
    recordName: name,
    recordId: id,
    summary: `Discarded draft changes for leadership member ${name}.`,
  });
  revalidatePath(`/admin/leadership/${id}`);
}

// ——— About Page ———

export async function saveAboutPageDraft(formData: FormData) {
  const session = await requireAdmin();
  const raw = formData.get("payload") as string;
  if (!raw) throw new Error("Missing about page payload");

  const payload = sanitizeAboutPagePayload(JSON.parse(raw) as AboutPageContent);
  const validationError = validateAboutPagePayload(payload);
  if (validationError) throw new Error(validationError);

  const page = await prisma.page.findUnique({ where: { slug: ABOUT_PAGE_SLUG } });
  const isLive = page?.status === ContentStatus.PUBLISHED;

  if (!isLive) {
    await applyAboutPagePayload(
      { ...payload, status: ContentStatus.DRAFT },
      { publishedBy: null, clearDraft: true }
    );
  } else {
    await prisma.page.update({
      where: { slug: ABOUT_PAGE_SLUG },
      data: {
        draftData: JSON.stringify(payload),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "About Page",
    recordName: "About Page",
    recordId: page?.id,
    summary: "Saved draft changes for About Page.",
  });

  revalidatePath("/admin/about");
}

export async function publishAboutPage(formData: FormData) {
  const session = await requireAdmin();
  const raw = formData.get("payload") as string;
  if (!raw) throw new Error("Missing about page payload");

  const payload = sanitizeAboutPagePayload(JSON.parse(raw) as AboutPageContent);
  const validationError = validateAboutPagePayload(payload);
  if (validationError) throw new Error(validationError);

  const page = await applyAboutPagePayload(
    { ...payload, status: ContentStatus.PUBLISHED },
    { publishedBy: actorName(session), clearDraft: true }
  );

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "About Page",
    recordName: page.title,
    recordId: page.id,
    summary: "Published changes to About Page.",
  });

  await revalidateAboutPage();
  revalidatePath("/admin/about");
}

export async function discardAboutPageDraft() {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { slug: ABOUT_PAGE_SLUG } });
  if (!page?.draftData) return;

  await prisma.page.update({
    where: { slug: ABOUT_PAGE_SLUG },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });

  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "About Page",
    recordName: "About Page",
    recordId: page.id,
    summary: "Discarded draft changes for About Page.",
  });

  revalidatePath("/admin/about");
}

// ——— Documents ———

function extractDocumentData(formData: FormData) {
  const mediaId = (formData.get("mediaId") as string) || "";
  if (!mediaId) throw new Error("Please upload a file before saving.");

  return {
    title: formData.get("title") as string,
    slug: (formData.get("slug") as string) || slugify(formData.get("title") as string),
    description: (formData.get("description") as string) || null,
    category: formData.get("category") as never,
    mediaId,
    year: formData.get("year") ? parseInt(formData.get("year") as string, 10) : null,
  };
}

export async function saveDocumentDraft(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string | null;
  const data = extractDocumentData(formData);

  if (!id) {
    const doc = await prisma.document.create({ data: { ...data, status: ContentStatus.DRAFT } });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Documents",
      recordName: doc.title,
      recordId: doc.id,
      summary: `Created draft document "${doc.title}"`,
    });
    redirect(`/admin/documents/${doc.id}`);
  }

  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) throw new Error("Document not found");

  if (existing.status === ContentStatus.PUBLISHED) {
    await prisma.document.update({
      where: { id },
      data: {
        draftData: JSON.stringify(data),
        draftEditedAt: new Date(),
        draftEditedBy: actorName(session),
      },
    });
  } else {
    await prisma.document.update({
      where: { id },
      data: { ...data, status: ContentStatus.DRAFT, draftData: null },
    });
  }

  await auditContentAction({
    action: "DRAFT_SAVED",
    module: "Documents",
    recordName: data.title,
    recordId: id,
    summary: `Saved draft changes for Document: ${data.title}.`,
  });

  for (const path of GOVERNANCE_DOCUMENT_SECTION_PATHS) {
    revalidatePath(path);
  }
  revalidatePath(`/admin/documents/${id}`);
}

export async function publishDocumentContent(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;
  const data = extractDocumentData(formData);
  const existing = await prisma.document.findUnique({ where: { id } });

  await prisma.document.update({
    where: { id },
    data: {
      ...data,
      status: ContentStatus.PUBLISHED,
      publishedAt: await setPublishedDate(ContentStatus.PUBLISHED, existing?.publishedAt),
      publishedBy: actorName(session),
      draftData: null,
      draftEditedAt: null,
      draftEditedBy: null,
    },
  });

  await auditContentAction({
    action: "CONTENT_PUBLISHED",
    module: "Documents",
    recordName: data.title,
    recordId: id,
    summary: `Published changes to Document: ${data.title}.`,
  });

  for (const path of GOVERNANCE_DOCUMENT_SECTION_PATHS) {
    revalidatePath(path);
  }
  revalidatePath(`/admin/documents/${id}`);
}

export async function discardDocumentDraft(id: string, title: string) {
  await requireAdmin();
  await prisma.document.update({
    where: { id },
    data: { draftData: null, draftEditedAt: null, draftEditedBy: null },
  });
  await auditContentAction({
    action: "DRAFT_DISCARDED",
    module: "Documents",
    recordName: title,
    recordId: id,
    summary: `Discarded draft changes for Document: ${title}.`,
  });
  revalidatePath(`/admin/documents/${id}`);
}
