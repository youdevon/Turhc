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
import { revalidatePublicPage, revalidatePublicSite } from "./revalidate-public";
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
  deleteStoredMediaFile,
  formatMediaUsageMessage,
  getMediaUsage,
} from "./media-delete";

async function setPublishedDate(status: ContentStatus, existing?: Date | null) {
  if (status === "PUBLISHED") return existing ?? new Date();
  return existing ?? null;
}

// Projects
export async function saveProject(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const status = parseContentStatus(formData.get("status") as string);
  const data = {
    title,
    slug,
    sector: formData.get("sector") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
    status: formData.get("projectStatus") as never,
    progressPercent: parseInt(formData.get("progressPercent") as string) || 0,
    contractor: (formData.get("contractor") as string) || null,
    contractValue: formData.get("contractValue") ? parseFloat(formData.get("contractValue") as string) : null,
    startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : null,
    expectedCompletion: formData.get("expectedCompletion") ? new Date(formData.get("expectedCompletion") as string) : null,
    actualCompletion: formData.get("actualCompletion") ? new Date(formData.get("actualCompletion") as string) : null,
    featuredImageId: (formData.get("featuredImageId") as string) || null,
    featuredImageUrl: (formData.get("featuredImageUrl") as string) || null,
    featuredImageAlt: (formData.get("featuredImageAlt") as string) || null,
    ...parseImageFraming(formData),
    cardSummary: (formData.get("cardSummary") as string) || null,
    featured: formData.get("featured") === "on",
    statusContent: status,
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
  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const status = parseContentStatus(formData.get("status") as string);
  const data = {
    referenceNumber: formData.get("referenceNumber") as string,
    title,
    slug,
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
    statusContent: status,
  };

  if (id) {
    const existing = await prisma.tender.findUnique({ where: { id } });
    const tender = await prisma.tender.update({
      where: { id },
      data: { ...data, publishedAt: await setPublishedDate(status, existing?.publishedAt) },
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
      action: status === "PUBLISHED" && existing?.statusContent !== "PUBLISHED" ? "CONTENT_PUBLISHED" : "CONTENT_UPDATED",
      module: "Tenders",
      recordName: tender.title,
      recordId: tender.id,
      summary: `Updated tender "${tender.title}"`,
      details: { changes },
    });
  } else {
    const tender = await prisma.tender.create({
      data: { ...data, publishedAt: status === "PUBLISHED" ? new Date() : null },
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
  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const status = parseContentStatus(formData.get("status") as string);
  const data = {
    title,
    slug,
    category: formData.get("category") as string,
    summary: formData.get("summary") as string,
    body: formData.get("body") as string,
    featuredImageId: (formData.get("featuredImageId") as string) || null,
    ...parseImageFraming(formData),
    projectId: (formData.get("projectId") as string) || null,
    tenderId: (formData.get("tenderId") as string) || null,
    status,
  };

  if (id) {
    const existing = await prisma.newsPost.findUnique({ where: { id } });
    const post = await prisma.newsPost.update({
      where: { id },
      data: { ...data, publishedAt: await setPublishedDate(status, existing?.publishedAt) },
    });
    const changes = collectChanges(existing, data, [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
    ]);
    await auditContentAction({
      action: status === "PUBLISHED" && existing?.status !== "PUBLISHED" ? "CONTENT_PUBLISHED" : "CONTENT_UPDATED",
      module: "News",
      recordName: post.title,
      recordId: post.id,
      summary: `Updated news post "${post.title}"`,
      details: { changes },
    });
  } else {
    const post = await prisma.newsPost.create({
      data: { ...data, publishedAt: status === "PUBLISHED" ? new Date() : null },
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
  const id = formData.get("id") as string | null;
  const email = (formData.get("email") as string).trim().toLowerCase();
  const name = formData.get("name") as string;
  const roleId = formData.get("roleId") as string;
  const password = formData.get("password") as string;
  const status = formData.get("userStatus") as "ACTIVE" | "INACTIVE";

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
  await requireAdmin();

  const asset = await prisma.mediaAsset.findFirst({ where: { id, isDeleted: false } });
  if (!asset) {
    throw new Error("File not found. It may have already been deleted.");
  }

  const usage = await getMediaUsage(id);
  if (usage.length > 0) {
    throw new Error(formatMediaUsageMessage(usage));
  }

  await prisma.mediaAsset.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  await deleteStoredMediaFile(asset.url);

  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "Media",
    recordName: asset.originalName,
    recordId: asset.id,
    summary: `Deleted file "${asset.originalName}" from the media library`,
    details: {
      changes: [`File type: ${asset.mimeType}`, `Removed from disk: ${asset.url}`],
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin", "layout");
}
