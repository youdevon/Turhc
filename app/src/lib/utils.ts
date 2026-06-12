import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugifyLib from "slugify";
import type { ContentStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true });
}

export function formatCurrency(value: number | string | null | undefined, currency = "USD"): string {
  if (value == null) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  PLANNED: "admin-badge-planned",
  TENDERING: "admin-badge-tendering",
  AWARDED: "admin-badge-awarded",
  IN_PROGRESS: "admin-badge-in_progress",
  COMPLETED: "admin-badge-completed",
  SUSPENDED: "admin-badge-suspended",
  OPEN: "admin-badge-open",
  CLOSED: "admin-badge-closed",
  CANCELLED: "admin-badge-cancelled",
  DRAFT: "admin-badge-draft",
  PUBLISHED: "admin-badge-published",
  ARCHIVED: "admin-badge-archived",
  ACTIVE: "admin-badge-active",
  HIDDEN: "admin-badge-hidden",
  UNREAD: "admin-badge-unread",
  NEW: "admin-badge-new",
  READ: "admin-badge-archived",
  RESPONDED: "admin-badge-completed",
  DELETED: "admin-badge-cancelled",
  INACTIVE: "admin-badge-archived",
};

export function getStatusColor(status: string): string {
  return STATUS_BADGE_CLASS[status] ?? "admin-badge-archived";
}

export function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    IN_PROGRESS: "In Progress",
    statusContent: "Publishing Status",
    UNREAD: "Unread",
    READ: "Read",
    RESPONDED: "Responded",
    DELETED: "Deleted",
  };
  if (labels[status]) return labels[status];
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseContentStatus(value: string): ContentStatus {
  if (value === "PUBLISHED" || value === "ARCHIVED") return value;
  return "DRAFT";
}
