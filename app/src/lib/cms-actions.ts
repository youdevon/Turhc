"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { auditContentAction, requireAdmin } from "./admin-actions";
import { requireAdministrator } from "./admin-roles";
import { resolveUserDeletion } from "./user-deletion";
import { auditFailedAction } from "./admin-actions";
import { buildChanges, buildCreateChanges, buildDeleteChanges } from "./audit";
import { collectChanges } from "./audit-helpers";
import { deriveBrandAcronym, parseNavLinksFromJson, serializeNavLinks, validateNavLinksJson } from "./header-config";
import { encryptSecret } from "./secret-crypto";
import { getSetting } from "./settings";
import { parseSmtpEncryption, validateSmtpFormValues } from "./smtp-settings";
import { validateHexColorField } from "./theme";
import { revalidatePublicPage, revalidatePublicSite, revalidateAboutPage } from "./revalidate-public";
import { GOVERNANCE_DOCUMENT_SECTION_PATHS } from "./document-categories";
import { parseHeroImageFraming, parseImageFraming, parsePhotoFraming } from "./photo-framing";
import { slugify, parseContentStatus } from "./utils";
import { ContentStatus } from "@prisma/client";
import {
  LANDING_PAGE_SLUG,
  sanitizeLandingPagePayload,
  validateLandingPagePayload,
  type LandingPageContent,
  type LandingSectionKey,
} from "./landing-page";
import {
  ABOUT_PAGE_SLUG,
  ABOUT_SECTION_KEYS,
  sanitizeAboutPagePayload,
  validateAboutPagePayload,
  type AboutPageContent,
} from "./about-page";
import {
  getOptionalString,
  getString,
  newsFormSchema,
  parseOptionalDate,
  parseOptionalFloat,
  projectFormSchema,
  tenderFormSchema,
  userFormSchema,
} from "./action-schemas";

async function setPublishedDate(status: ContentStatus, existing?: Date | null) {
  if (status === "PUBLISHED") return existing ?? new Date();
  return existing ?? null;
}

// Projects
export async function saveProject(formData: FormData) {
  await requireAdmin();
  const id = getOptionalString(formData, "id", 64);
  const title = getString(formData, "title", 300);
  const slug = getString(formData, "slug", 200) || slugify(title);
  const status = parseContentStatus(getString(formData, "status", 20));

  const parsed = projectFormSchema.safeParse({
    id,
    title,
    slug,
    sector: getString(formData, "sector", 120),
    location: getString(formData, "location", 200),
    description: getString(formData, "description", 50000),
    projectStatus: getString(formData, "projectStatus", 50),
    progressPercent: parseInt(getString(formData, "progressPercent", 10), 10) || 0,
    contractor: getOptionalString(formData, "contractor", 200),
    contractValue: parseOptionalFloat(formData.get("contractValue")),
    startDate: parseOptionalDate(formData.get("startDate")),
    expectedCompletion: parseOptionalDate(formData.get("expectedCompletion")),
    actualCompletion: parseOptionalDate(formData.get("actualCompletion")),
    featuredImageId: getOptionalString(formData, "featuredImageId", 64),
    featuredImageUrl: getOptionalString(formData, "featuredImageUrl", 2000),
    featuredImageAlt: getOptionalString(formData, "featuredImageAlt", 300),
    cardSummary: getOptionalString(formData, "cardSummary", 500),
    featured: formData.get("featured") === "on",
    statusContent: status,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid project data");
  }

  const data = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    sector: parsed.data.sector,
    location: parsed.data.location,
    description: parsed.data.description,
    status: parsed.data.projectStatus as never,
    progressPercent: parsed.data.progressPercent,
    contractor: parsed.data.contractor,
    contractValue: parsed.data.contractValue,
    startDate: parsed.data.startDate,
    expectedCompletion: parsed.data.expectedCompletion,
    actualCompletion: parsed.data.actualCompletion,
    featuredImageId: parsed.data.featuredImageId,
    featuredImageUrl: parsed.data.featuredImageUrl,
    featuredImageAlt: parsed.data.featuredImageAlt,
    ...parseImageFraming(formData),
    cardSummary: parsed.data.cardSummary,
    featured: parsed.data.featured,
    statusContent: parsed.data.statusContent,
  };

  if (id) {
    const existing = await prisma.project.findUnique({ where: { id } });
    const project = await prisma.project.update({
      where: { id },
      data: { ...data, publishedAt: await setPublishedDate(status, existing?.publishedAt) },
    });
    const changes = buildChanges(existing, data);
    await auditContentAction({
      action: status === "PUBLISHED" && existing?.statusContent !== "PUBLISHED" ? "CONTENT_PUBLISHED" : "CONTENT_UPDATED",
      module: "Projects",
      targetType: "Project",
      recordName: project.title,
      recordId: project.id,
      summary: `Updated project "${project.title}"`,
      changes,
      displayAction:
        status === "PUBLISHED" && existing?.statusContent !== "PUBLISHED" ? "Approved" : "Updated",
    });
  } else {
    const project = await prisma.project.create({
      data: { ...data, publishedAt: status === "PUBLISHED" ? new Date() : null },
    });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Projects",
      targetType: "Project",
      recordName: project.title,
      recordId: project.id,
      summary: `Created project "${project.title}"`,
      changes: buildCreateChanges({ ...data, statusContent: status }, [
        "title",
        "slug",
        "statusContent",
        "sector",
        "location",
      ]),
      displayAction: "Created",
    });
    redirect(`/admin/projects/${project.id}`);
  }
  await revalidatePublicSite();
  if (id) {
    const saved = await prisma.project.findUnique({ where: { id }, select: { slug: true } });
    if (saved?.slug) revalidatePath(`/projects/${saved.slug}`);
  }
}

export async function deleteProject(id: string) {
  await requireAdmin();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return;
  await prisma.project.delete({ where: { id } });
  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "Projects",
    targetType: "Project",
    recordName: project.title,
    recordId: id,
    summary: `Deleted project "${project.title}"`,
    changes: buildDeleteChanges(project as Record<string, unknown>, ["title", "slug", "statusContent"]),
    displayAction: "Deleted",
  });
  revalidatePath("/projects");
  redirect("/admin/projects");
}

// Tenders
export async function saveTender(formData: FormData) {
  await requireAdmin();
  const id = getOptionalString(formData, "id", 64);
  const title = getString(formData, "title", 300);
  const slug = getString(formData, "slug", 200) || slugify(title);
  const status = parseContentStatus(getString(formData, "status", 20));
  const framing = parseHeroImageFraming(formData);

  const parsed = tenderFormSchema.safeParse({
    id,
    referenceNumber: getString(formData, "referenceNumber", 100),
    title,
    slug,
    category: getString(formData, "category", 120),
    department: getString(formData, "department", 120),
    description: getString(formData, "description", 50000),
    openingDate: new Date(getString(formData, "openingDate", 30)),
    closingDate: new Date(getString(formData, "closingDate", 30)),
    tenderStatus: getString(formData, "tenderStatus", 20),
    estimatedValue: parseOptionalFloat(formData.get("estimatedValue")),
    successfulBidder: getOptionalString(formData, "successfulBidder", 200),
    awardInfo: getOptionalString(formData, "awardInfo", 10000),
    heroImageUrl: getOptionalString(formData, "heroImageUrl", 2000),
    heroImageAlt: getOptionalString(formData, "heroImageAlt", 300),
    heroImageFocusX: framing.heroImageFocusX,
    heroImageFocusY: framing.heroImageFocusY,
    heroImageZoom: framing.heroImageZoom,
    statusContent: status,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid tender data");
  }

  const {
    id: tenderId,
    tenderStatus,
    statusContent,
    ...rest
  } = parsed.data;
  const data = {
    ...rest,
    status: tenderStatus,
    statusContent,
  };

  if (tenderId) {
    const existing = await prisma.tender.findUnique({ where: { id: tenderId } });
    const tender = await prisma.tender.update({
      where: { id: tenderId },
      data: { ...data, publishedAt: await setPublishedDate(statusContent, existing?.publishedAt) },
    });
    const changes = collectChanges(existing, data, [
      { key: "title", label: "Title" },
      { key: "referenceNumber", label: "Reference" },
      { key: "statusContent", label: "Content status" },
      { key: "status", label: "Tender status" },
      { key: "category", label: "Category" },
      { key: "closingDate", label: "Closing date", format: (v) => (v instanceof Date ? v.toLocaleDateString() : String(v)) },
    ]);
    await auditContentAction({
      action: statusContent === "PUBLISHED" && existing?.statusContent !== "PUBLISHED" ? "CONTENT_PUBLISHED" : "CONTENT_UPDATED",
      module: "Tenders",
      recordName: tender.title,
      recordId: tender.id,
      summary: `Updated tender "${tender.title}"`,
      details: { changes },
    });
  } else {
    const tender = await prisma.tender.create({
      data: { ...data, publishedAt: statusContent === "PUBLISHED" ? new Date() : null },
    });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Tenders",
      recordName: tender.title,
      recordId: tender.id,
      summary: `Created tender "${tender.title}"`,
      details: { changes: [`Reference: ${data.referenceNumber}`] },
    });
    redirect(`/admin/tenders/${tender.id}`);
  }
  revalidatePath("/tenders");
  revalidatePath("/");
}

export async function deleteTender(id: string) {
  await requireAdmin();
  const tender = await prisma.tender.findUnique({ where: { id } });
  if (!tender) return;
  await prisma.tender.delete({ where: { id } });
  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "Tenders",
    recordName: tender.title,
    recordId: id,
    summary: `Deleted tender "${tender.title}"`,
  });
  redirect("/admin/tenders");
}

// News
export async function saveNews(formData: FormData) {
  await requireAdmin();
  const id = getOptionalString(formData, "id", 64);
  const title = getString(formData, "title", 300);
  const slug = getString(formData, "slug", 200) || slugify(title);
  const status = parseContentStatus(getString(formData, "status", 20));
  const framing = parseImageFraming(formData);

  const parsed = newsFormSchema.safeParse({
    id,
    title,
    slug,
    category: getString(formData, "category", 120),
    summary: getString(formData, "summary", 2000),
    body: getString(formData, "body", 100000),
    featuredImageId: getOptionalString(formData, "featuredImageId", 64),
    imageFocusX: framing.imageFocusX,
    imageFocusY: framing.imageFocusY,
    imageZoom: framing.imageZoom,
    projectId: getOptionalString(formData, "projectId", 64),
    tenderId: getOptionalString(formData, "tenderId", 64),
    status,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid news data");
  }

  const { id: postId, status: contentStatus, ...data } = parsed.data;

  if (postId) {
    const existing = await prisma.newsPost.findUnique({ where: { id: postId } });
    const post = await prisma.newsPost.update({
      where: { id: postId },
      data: { ...data, status: contentStatus, publishedAt: await setPublishedDate(contentStatus, existing?.publishedAt) },
    });
    const changes = collectChanges(existing, data, [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
    ]);
    await auditContentAction({
      action: contentStatus === "PUBLISHED" && existing?.status !== "PUBLISHED" ? "CONTENT_PUBLISHED" : "CONTENT_UPDATED",
      module: "News",
      recordName: post.title,
      recordId: post.id,
      summary: `Updated news post "${post.title}"`,
      details: { changes },
    });
  } else {
    const post = await prisma.newsPost.create({
      data: { ...data, status: contentStatus, publishedAt: contentStatus === "PUBLISHED" ? new Date() : null },
    });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "News",
      recordName: post.title,
      recordId: post.id,
      summary: `Created news post "${post.title}"`,
    });
    redirect(`/admin/news/${post.id}`);
  }
  revalidatePath("/news");
  revalidatePath("/");
}

export async function deleteNews(id: string) {
  await requireAdmin();
  const post = await prisma.newsPost.findUnique({ where: { id } });
  if (!post) return;
  await prisma.newsPost.delete({ where: { id } });
  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "News",
    recordName: post.title,
    recordId: id,
    summary: `Deleted news post "${post.title}"`,
  });
  redirect("/admin/news");
}

// Hero Slides
export async function saveHeroSlide(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string | null;
  const status = parseContentStatus(formData.get("status") as string);
  const data = {
    title: formData.get("title") as string,
    eyebrow: (formData.get("eyebrow") as string) || null,
    heading: formData.get("heading") as string,
    subheading: (formData.get("subheading") as string) || null,
    primaryLabel: (formData.get("primaryLabel") as string) || null,
    primaryUrl: (formData.get("primaryUrl") as string) || null,
    secondaryLabel: (formData.get("secondaryLabel") as string) || null,
    secondaryUrl: (formData.get("secondaryUrl") as string) || null,
    mediaType: (formData.get("mediaType") as "IMAGE" | "VIDEO") || "IMAGE",
    mediaUrl: formData.get("mediaUrl") as string,
    ...parseImageFraming(formData),
    overlayOpacity: parseFloat(formData.get("overlayOpacity") as string) || 0.55,
    sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    showStats: formData.get("showStats") === "on",
    statsJson: (formData.get("statsJson") as string) || null,
    status,
  };

  if (id) {
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    const slide = await prisma.heroSlide.update({
      where: { id },
      data: { ...data, publishedAt: await setPublishedDate(status, existing?.publishedAt) },
    });
    await auditContentAction({
      action: "CONTENT_UPDATED",
      module: "Hero Slides",
      recordName: slide.title,
      recordId: slide.id,
      summary: `Updated hero slide "${slide.title}"`,
    });
  } else {
    const slide = await prisma.heroSlide.create({
      data: { ...data, publishedAt: status === "PUBLISHED" ? new Date() : null },
    });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Hero Slides",
      recordName: slide.title,
      recordId: slide.id,
      summary: `Created hero slide "${slide.title}"`,
    });
    redirect(`/admin/hero-slides/${slide.id}`);
  }
  await revalidatePublicSite();
}

export async function deleteHeroSlide(id: string) {
  await requireAdmin();
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) return;
  await prisma.heroSlide.delete({ where: { id } });
  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "Hero Slides",
    recordName: slide.title,
    recordId: id,
    summary: `Deleted hero slide "${slide.title}"`,
  });
  await revalidatePublicSite();
  redirect("/admin/hero-slides");
}

// Documents
export async function saveDocument(formData: FormData): Promise<{ id: string }> {
  await requireAdmin();
  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const status = parseContentStatus(formData.get("status") as string);
  const mediaId = (formData.get("mediaId") as string) || "";

  if (!mediaId) {
    throw new Error("Please upload a file before saving.");
  }

  const data = {
    title,
    slug,
    description: (formData.get("description") as string) || null,
    category: formData.get("category") as never,
    mediaId,
    year: formData.get("year") ? parseInt(formData.get("year") as string) : null,
    status,
  };

  let docId: string;

  if (id) {
    const doc = await prisma.document.update({
      where: { id },
      data: { ...data, publishedAt: status === "PUBLISHED" ? new Date() : null },
    });
    docId = doc.id;
    await auditContentAction({
      action: "CONTENT_UPDATED",
      module: "Documents",
      recordName: doc.title,
      recordId: doc.id,
      summary: `Updated document "${doc.title}"`,
    });
    revalidatePath(`/admin/documents/${docId}`);
  } else {
    const doc = await prisma.document.create({
      data: { ...data, publishedAt: status === "PUBLISHED" ? new Date() : null },
    });
    docId = doc.id;
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Documents",
      recordName: doc.title,
      recordId: doc.id,
      summary: `Created document "${doc.title}"`,
    });
  }

  for (const path of GOVERNANCE_DOCUMENT_SECTION_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/admin/documents");

  return { id: docId };
}

export async function deleteDocument(id: string) {
  await requireAdmin();
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return;
  await prisma.document.delete({ where: { id } });
  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "Documents",
    recordName: doc.title,
    recordId: id,
    summary: `Deleted document "${doc.title}"`,
  });
  for (const path of GOVERNANCE_DOCUMENT_SECTION_PATHS) {
    revalidatePath(path);
  }
  redirect("/admin/documents");
}

// Board / Leadership
export async function saveBoardMember(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string | null;
  const status = parseContentStatus(formData.get("status") as string);
  const data = {
    name: formData.get("name") as string,
    title: formData.get("title") as string,
    bio: (formData.get("bio") as string) || null,
    photoId: (formData.get("photoId") as string) || null,
    ...parsePhotoFraming(formData),
    sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    status,
  };

  if (id) {
    const member = await prisma.boardMember.update({ where: { id }, data });
    await auditContentAction({
      action: "CONTENT_UPDATED",
      module: "Board",
      recordName: member.name,
      recordId: member.id,
      summary: `Updated board member profile for ${member.name}`,
    });
    revalidatePath(`/admin/board/${member.id}`);
  } else {
    const member = await prisma.boardMember.create({ data });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Board",
      recordName: member.name,
      recordId: member.id,
      summary: `Added board member ${member.name}`,
    });
    redirect(`/admin/board/${member.id}`);
  }
  revalidatePath("/admin/board");
  revalidatePath("/governance/board");
}

export async function saveLeadershipMember(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string | null;
  const status = parseContentStatus(formData.get("status") as string);
  const data = {
    name: formData.get("name") as string,
    title: formData.get("title") as string,
    department: (formData.get("department") as string) || null,
    bio: (formData.get("bio") as string) || null,
    photoId: (formData.get("photoId") as string) || null,
    ...parsePhotoFraming(formData),
    sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    status,
  };

  if (id) {
    const member = await prisma.leadershipMember.update({ where: { id }, data });
    await auditContentAction({
      action: "CONTENT_UPDATED",
      module: "Leadership",
      recordName: member.name,
      recordId: member.id,
      summary: `Updated leadership profile for ${member.name}`,
    });
    revalidatePath(`/admin/leadership/${member.id}`);
  } else {
    const member = await prisma.leadershipMember.create({ data });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Leadership",
      recordName: member.name,
      recordId: member.id,
      summary: `Added leadership team member ${member.name}`,
    });
    redirect(`/admin/leadership/${member.id}`);
  }
  revalidatePath("/admin/leadership");
  revalidatePath("/about");
  revalidatePath("/governance/leadership");
}

export async function deleteBoardMember(id: string) {
  await requireAdmin();
  const member = await prisma.boardMember.findUnique({ where: { id } });
  if (!member) return;
  await prisma.boardMember.delete({ where: { id } });
  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "Board",
    targetType: "BoardMember",
    recordName: member.name,
    recordId: id,
    summary: `Deleted board member "${member.name}"`,
    changes: buildDeleteChanges(member as Record<string, unknown>, ["name", "title", "status"]),
    displayAction: "Deleted",
  });
  revalidatePath("/admin/board");
  revalidatePath("/governance/board");
  redirect("/admin/board");
}

export async function deleteLeadershipMember(id: string) {
  await requireAdmin();
  const member = await prisma.leadershipMember.findUnique({ where: { id } });
  if (!member) return;
  await prisma.leadershipMember.delete({ where: { id } });
  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "Leadership",
    targetType: "LeadershipMember",
    recordName: member.name,
    recordId: id,
    summary: `Deleted leadership member "${member.name}"`,
    changes: buildDeleteChanges(member as Record<string, unknown>, ["name", "title", "department", "status"]),
    displayAction: "Deleted",
  });
  revalidatePath("/admin/leadership");
  revalidatePath("/governance/leadership");
  revalidatePath("/about");
  redirect("/admin/leadership");
}

// Pages
export async function savePage(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const status = parseContentStatus(formData.get("status") as string);
  const overlayRaw = formData.get("heroOverlayStrength") as string;
  const data = {
    title,
    slug,
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
    status,
  };

  if (id) {
    const existing = await prisma.page.findUnique({ where: { id } });
    const page = await prisma.page.update({
      where: { id },
      data: { ...data, publishedAt: await setPublishedDate(status, existing?.publishedAt) },
    });
    await auditContentAction({
      action: "CONTENT_UPDATED",
      module: "Pages",
      recordName: page.title,
      recordId: page.id,
      summary: `Updated page "${page.title}"`,
    });
  } else {
    const page = await prisma.page.create({
      data: { ...data, publishedAt: status === "PUBLISHED" ? new Date() : null },
    });
    await auditContentAction({
      action: "CONTENT_CREATED",
      module: "Pages",
      recordName: page.title,
      recordId: page.id,
      summary: `Created page "${page.title}"`,
    });
    redirect(`/admin/pages/${page.id}`);
  }
  await revalidatePublicPage(slug);
}

function formCheckboxValue(formData: FormData, key: string): string {
  const values = formData.getAll(key);
  return values.some((v) => v === "true" || v === "on") ? "true" : "false";
}

// Settings
export async function saveSettings(formData: FormData) {
  await requireAdministrator();

  const rawNavJson = formData.get("mainNavJson") as string;
  const navError = validateNavLinksJson(rawNavJson);
  if (navError) {
    throw new Error(navError);
  }
  const normalizedNavJson = serializeNavLinks(parseNavLinksFromJson(rawNavJson));

  const keys = [
    "orgName", "orgSubtitle", "orgTagline", "contactEmail", "contactPhone",
    "contactAddress", "footerText", "whoWeAreText", "mandateText", "deliveryStatsJson",
    "socialFacebook", "socialInstagram", "socialYouTube", "socialLinkedIn", "socialTwitter",
    "activeTheme", "primaryAccentColor", "secondaryAccentColor",
    "headingColorLightTheme", "headingColorDarkTheme",
    "eyebrowColorLightTheme", "eyebrowColorDarkTheme",
    "heroOverlayDarkness",
    "logoMediaId",
    "logoMediaIdWhite", "logoMediaIdColored",
    "logoMediaIdDark", "logoMediaIdLight",
    "logoMediaIdCompact", "logoMediaIdCompactWhite",
    "headerLogoVariantMode",
    "logoAlt",
    "heroImageAbout", "heroImageProjects", "heroImageTenders", "heroImageContractors",
    "heroImageGovernance", "heroImageNews", "heroImageContact", "heroImageGeneric",
    "brandDisplayText", "brandDisplayMode", "headerBrandSubtitle",
    "headerLogoHeightDesktop", "headerLogoHeightMobile",
    "headerLogoMaxWidthDesktop", "headerLogoMaxWidthMobile",
    "headerBrandZoneWidthDesktop",
    "headerStyle", "mainNavJson",
    "headerContactLabel", "headerContactHref", "headerContractorLabel", "headerContractorHref",
    "headerCtaStyle",
    "enquiryForwardTo", "enquiryForwardCc", "enquiryForwardBcc", "enquiryEmailSubjectPrefix",
    "enquirySmtpTestRecipient",
    "smtpHost", "smtpPort", "smtpEncryption", "smtpUser",
    "smtpFromEmail", "smtpFromName", "smtpReplyTo",
  ];

  const smtpEnabled = formCheckboxValue(formData, "smtpEnabled") === "true";
  const smtpPasswordInput = (formData.get("smtpPassword") as string) ?? "";
  const existingSmtpPassword = await getSetting("smtpPassword");
  const smtpPasswordConfigured = Boolean(existingSmtpPassword?.trim());

  const smtpValidationError = validateSmtpFormValues(
    {
      smtpEnabled,
      smtpHost: (formData.get("smtpHost") as string) ?? "",
      smtpPort: (formData.get("smtpPort") as string) ?? "587",
      smtpEncryption: parseSmtpEncryption(formData.get("smtpEncryption") as string),
      smtpUser: (formData.get("smtpUser") as string) ?? "",
      smtpFromEmail: (formData.get("smtpFromEmail") as string) ?? "",
      smtpFromName: (formData.get("smtpFromName") as string) ?? "",
      smtpReplyTo: (formData.get("smtpReplyTo") as string) ?? "",
    },
    smtpPasswordConfigured,
    smtpPasswordInput
  );
  if (smtpValidationError) {
    throw new Error(smtpValidationError);
  }

  const headingColorError =
    validateHexColorField(
      (formData.get("headingColorLightTheme") as string) ?? "",
      "Light theme heading colour"
    ) ??
    validateHexColorField(
      (formData.get("headingColorDarkTheme") as string) ?? "",
      "Dark theme heading colour"
    ) ??
    validateHexColorField(
      (formData.get("eyebrowColorLightTheme") as string) ?? "",
      "Light theme eyebrow label colour"
    ) ??
    validateHexColorField(
      (formData.get("eyebrowColorDarkTheme") as string) ?? "",
      "Dark theme eyebrow label colour"
    );
  if (headingColorError) {
    throw new Error(headingColorError);
  }

  const orgName = (formData.get("orgName") as string) ?? "";

  for (const key of keys) {
    let value = formData.get(key) as string;
    if (value == null) continue;

    if (key === "brandDisplayText" && !value.trim()) {
      value = deriveBrandAcronym(orgName);
    }

    if (key === "mainNavJson") {
      value = normalizedNavJson;
    }

    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value, label: key },
      update: { value },
    });
  }

  for (const key of [
    "showLogoImage",
    "showBrandText",
    "showBrandSubtitle",
    "showContractorHeaderCta",
    "showHamburgerDesktop",
    "enquiryEmailForwardingEnabled",
    "smtpEnabled",
  ] as const) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: formCheckboxValue(formData, key), label: key },
      update: { value: formCheckboxValue(formData, key) },
    });
  }

  let smtpPasswordToStore = existingSmtpPassword;
  if (smtpPasswordInput.trim()) {
    smtpPasswordToStore = encryptSecret(smtpPasswordInput.trim());
  } else if (formCheckboxValue(formData, "smtpClearPassword") === "true") {
    smtpPasswordToStore = "";
  }
  await prisma.siteSetting.upsert({
    where: { key: "smtpPassword" },
    create: { key: "smtpPassword", value: smtpPasswordToStore, label: "SMTP Password", group: "email" },
    update: { value: smtpPasswordToStore },
  });

  // Keep legacy keys in sync for older readers
  const whiteId = (formData.get("logoMediaIdWhite") as string) || (formData.get("logoMediaIdDark") as string) || "";
  const coloredId = (formData.get("logoMediaIdColored") as string) || (formData.get("logoMediaIdLight") as string) || "";
  for (const [key, value] of [
    ["logoMediaIdDark", whiteId],
    ["logoMediaIdLight", coloredId],
  ] as const) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value, label: key },
      update: { value },
    });
  }

  await auditContentAction({
    action: "SETTINGS_CHANGED",
    module: "Settings",
    recordName: "Site Settings",
    summary: "Updated site settings (branding, appearance, navigation, email, and contact details)",
    details: {
      changes: [
        "Organisation profile and contact details may have changed",
        "Header, logo, theme, or hero settings may have changed",
        "SMTP or enquiry notification settings may have changed",
      ],
    },
  });
  await revalidatePublicSite();
  revalidatePath("/admin/settings");
}

// Landing Page
export async function saveLandingPage(formData: FormData) {
  await requireAdmin();
  const raw = formData.get("payload") as string;
  if (!raw) throw new Error("Missing landing page payload");

  const payload = sanitizeLandingPagePayload(JSON.parse(raw) as LandingPageContent);
  const validationError = validateLandingPagePayload(payload);
  if (validationError) throw new Error(validationError);

  const heroSettings = {
    enabled: payload.hero.enabled,
    layout: payload.hero.layout ?? "contained",
    overlayStrength: payload.hero.overlayStrength,
    slideDurationMs: payload.hero.slideDurationMs,
    zoomDurationMs: payload.hero.zoomDurationMs,
  };

  const page = await prisma.page.upsert({
    where: { slug: LANDING_PAGE_SLUG },
    create: {
      slug: LANDING_PAGE_SLUG,
      title: payload.title || "Landing Page",
      content: "",
      status: payload.status,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      isLandingPage: true,
      settingsJson: JSON.stringify(heroSettings),
      publishedAt: payload.status === "PUBLISHED" ? new Date() : null,
    },
    update: {
      title: payload.title || "Landing Page",
      status: payload.status,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      isLandingPage: true,
      settingsJson: JSON.stringify(heroSettings),
      publishedAt: payload.status === "PUBLISHED" ? new Date() : undefined,
    },
  });

  for (const [key, section] of Object.entries(payload.sections) as [LandingSectionKey, (typeof payload.sections)[LandingSectionKey]][]) {
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

  const activeSections = Object.entries(payload.sections)
    .filter(([, section]) => section.isActive)
    .map(([key]) => key.replace(/_/g, " "));

  await auditContentAction({
    action: "CONTENT_UPDATED",
    module: "Landing Page",
    recordName: page.title,
    recordId: page.id,
    summary: `Updated landing page content (${payload.heroSlides.filter((s) => s.isActive).length} hero slides, ${activeSections.length} active sections)`,
    details: {
      changes: [
        `Publish status: ${payload.status}`,
        `Hero slideshow: ${payload.hero.enabled ? "enabled" : "disabled"}`,
        `Active sections: ${activeSections.join(", ") || "none"}`,
        `${payload.statItems.filter((s) => s.isActive).length} statistics shown`,
      ],
    },
  });
  await revalidatePublicSite();
}

// About Page
export async function saveAboutPage(formData: FormData) {
  await requireAdmin();
  const raw = formData.get("payload") as string;
  if (!raw) throw new Error("Missing about page payload");

  const payload = sanitizeAboutPagePayload(JSON.parse(raw) as AboutPageContent);
  const validationError = validateAboutPagePayload(payload);
  if (validationError) throw new Error(validationError);

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
      publishedAt: payload.status === "PUBLISHED" ? new Date() : null,
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
      publishedAt: payload.status === "PUBLISHED" ? new Date() : undefined,
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

  await auditContentAction({
    action: "CONTENT_UPDATED",
    module: "About Page",
    recordName: page.title,
    recordId: page.id,
    summary: "Updated about page content",
    details: {
      changes: [
        `Publish status: ${payload.status}`,
        `${payload.statItems.filter((s) => s.isActive).length} statistics shown`,
      ],
    },
  });

  await revalidateAboutPage();
}

const MIN_USER_PASSWORD_LENGTH = 8;

function assertValidUserPassword(password: string, label = "Password") {
  if (password.length < MIN_USER_PASSWORD_LENGTH) {
    throw new Error(`${label} must be at least ${MIN_USER_PASSWORD_LENGTH} characters.`);
  }
}

// Users
export async function resetUserPassword(formData: FormData) {
  await requireAdministrator();

  const userId = (formData.get("userId") as string | null)?.trim();
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!userId) throw new Error("User not found.");
  if (!newPassword.trim()) throw new Error("Enter a new password.");
  if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");

  assertValidUserPassword(newPassword, "New password");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!user) throw new Error("User not found.");

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });

  await auditContentAction({
    action: "PASSWORD_RESET",
    module: "Users",
    targetType: "User",
    recordName: user.name,
    recordId: user.id,
    summary: `Reset password for ${user.name}`,
    changes: { password: { from: "[changed]", to: "[changed]" } },
    displayAction: "Password Reset",
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function saveUser(formData: FormData) {
  await requireAdministrator();
  const parsed = userFormSchema.safeParse({
    id: getOptionalString(formData, "id", 64),
    email: getString(formData, "email", 254).toLowerCase(),
    name: getString(formData, "name", 200),
    roleId: getString(formData, "roleId", 64),
    password: getString(formData, "password", 200) || undefined,
    status: getString(formData, "userStatus", 20) as "ACTIVE" | "INACTIVE",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid user data");
  }

  const { id, email, name, roleId, password, status } = parsed.data;

  if (id) {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    const data: Record<string, unknown> = { email, name, roleId, status };
    const user = await prisma.user.update({ where: { id }, data: data as never });
    const updated = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    const roleChanged = existing?.roleId !== roleId;
    const changes = buildChanges(
      existing
        ? {
            ...existing,
            role: existing.role.name,
          }
        : null,
      {
        ...data,
        role: updated?.role.name,
      }
    );
    await auditContentAction({
      action: roleChanged ? "PERMISSION_CHANGED" : status === "INACTIVE" ? "USER_DEACTIVATED" : "USER_UPDATED",
      module: "Users",
      targetType: "User",
      recordName: user.name,
      recordId: user.id,
      summary: roleChanged
        ? `Changed permissions for ${user.name}`
        : status === "INACTIVE"
          ? `Deactivated user account for ${user.name}`
          : `Updated user account for ${user.name}`,
      changes,
      displayAction: roleChanged ? "Permission Changed" : "Updated",
    });
  } else {
    if (!password) throw new Error("Password required for new users");
    assertValidUserPassword(password);
    const user = await prisma.user.create({
      data: { email, name, roleId, status, passwordHash: await bcrypt.hash(password, 12) },
    });
    await auditContentAction({
      action: "USER_CREATED",
      module: "Users",
      recordName: user.name,
      recordId: user.id,
      summary: `Created user account for ${user.name}`,
      details: { changes: [`Email: ${email}`] },
    });
    redirect(`/admin/users/${user.id}`);
  }
  redirect("/admin/users");
}

export async function deleteUser(id: string) {
  const session = await requireAdministrator();
  const result = await resolveUserDeletion(prisma, {
    actorUserId: session.user.id,
    actorRole: session.user.role,
    targetUserId: id,
  });

  if (!result.ok) {
    await auditFailedAction({
      action: "Deleted",
      legacyAction: "USER_DELETED",
      target: { type: "User", name: "User account", id },
      failReason: result.reason,
    });
    throw new Error(result.reason);
  }

  const user = result.user;
  await prisma.user.delete({ where: { id } });

  await auditContentAction({
    action: "USER_DELETED",
    module: "Users",
    targetType: "User",
    recordName: user.name,
    recordId: user.id,
    summary: `Deleted user account for ${user.name}`,
    changes: buildDeleteChanges(user as Record<string, unknown>, ["name", "email", "status"]),
    displayAction: "Deleted",
  });

  revalidatePath("/admin/users");
}

// Media
export async function deleteMediaAsset(id: string) {
  const { removeMediaAssetAction } = await import("./media-actions");
  const result = await removeMediaAssetAction(id);
  if (!result.ok) {
    throw new Error(result.error);
  }
}
