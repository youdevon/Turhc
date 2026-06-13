import { z } from "zod";
import { ContentStatus, TenderStatus } from "@prisma/client";
import { ENQUIRY_TYPE_VALUES } from "./enquiry-types";

export const contentStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const projectFormSchema = z.object({
  id: z.string().max(64).optional().nullable(),
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  sector: z.string().max(120),
  location: z.string().max(200),
  description: z.string().max(50000),
  projectStatus: z.string().max(50),
  progressPercent: z.number().int().min(0).max(100),
  contractor: z.string().max(200).nullable(),
  contractValue: z.number().nullable(),
  startDate: z.date().nullable(),
  expectedCompletion: z.date().nullable(),
  actualCompletion: z.date().nullable(),
  featuredImageId: z.string().cuid().nullable(),
  featuredImageUrl: z.string().max(2000).nullable(),
  featuredImageAlt: z.string().max(300).nullable(),
  cardSummary: z.string().max(500).nullable(),
  featured: z.boolean(),
  statusContent: z.nativeEnum(ContentStatus),
});

export const tenderFormSchema = z.object({
  id: z.string().max(64).optional().nullable(),
  referenceNumber: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  category: z.string().min(1).max(120),
  department: z.string().min(1).max(120),
  description: z.string().min(1).max(50000),
  openingDate: z.date(),
  closingDate: z.date(),
  tenderStatus: z.nativeEnum(TenderStatus),
  estimatedValue: z.number().nullable(),
  successfulBidder: z.string().max(200).nullable(),
  awardInfo: z.string().max(10000).nullable(),
  heroImageUrl: z.string().max(2000).nullable(),
  heroImageAlt: z.string().max(300).nullable(),
  heroImageFocusX: z.number().int().min(0).max(100),
  heroImageFocusY: z.number().int().min(0).max(100),
  heroImageZoom: z.number().int().min(50).max(200),
  statusContent: z.nativeEnum(ContentStatus),
});

export const newsFormSchema = z.object({
  id: z.string().max(64).optional().nullable(),
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  category: z.string().min(1).max(120),
  summary: z.string().min(1).max(2000),
  body: z.string().min(1).max(100000),
  featuredImageId: z.string().cuid().nullable(),
  imageFocusX: z.number().int().min(0).max(100),
  imageFocusY: z.number().int().min(0).max(100),
  imageZoom: z.number().int().min(50).max(200),
  projectId: z.string().cuid().nullable(),
  tenderId: z.string().cuid().nullable(),
  status: z.nativeEnum(ContentStatus),
});

export const userFormSchema = z.object({
  id: z.string().max(64).optional().nullable(),
  email: z.string().email().max(254),
  name: z.string().min(1).max(200),
  roleId: z.string().cuid(),
  password: z.string().max(200).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const enquiryApiSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  companyName: z.string().max(200).optional().nullable(),
  email: z.string().email().max(254),
  phone: z.string().max(50).optional().nullable(),
  enquiryType: z.string().refine((val) => (ENQUIRY_TYPE_VALUES as readonly string[]).includes(val)),
  subject: z.string().max(300).optional().nullable(),
  message: z.string().min(10).max(10000),
  relatedTenderRef: z.string().max(100).optional().nullable(),
  relatedProjectRef: z.string().max(100).optional().nullable(),
});

export function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseOptionalFloat(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const num = parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

export function getString(formData: FormData, key: string, max = 10_000): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

export function getOptionalString(formData: FormData, key: string, max = 10_000): string | null {
  const value = getString(formData, key, max);
  return value || null;
}
