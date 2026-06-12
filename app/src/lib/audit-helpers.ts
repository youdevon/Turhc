import type { AuditAction, AuditLog, Prisma } from "@prisma/client";
import { formatStatus } from "./utils";

export type HumanAuditAction =
  | "Created"
  | "Updated"
  | "Deleted"
  | "Logged In"
  | "Login Failed"
  | "Logged Out"
  | "Exported"
  | "Approved"
  | "Rejected"
  | "Viewed"
  | "Password Reset"
  | "Permission Changed";

export type AuditChangeEntry = { from: unknown; to: unknown };
export type AuditChangeMap = Record<string, AuditChangeEntry>;

export type ParsedAuditDetails = {
  summary?: string;
  changes?: string[] | AuditChangeMap;
  [key: string]: unknown;
};

const ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: "Logged In",
  LOGIN_FAILED: "Login Failed",
  LOGOUT: "Logged Out",
  CONTENT_CREATED: "Created",
  CONTENT_UPDATED: "Updated",
  CONTENT_PUBLISHED: "Approved",
  CONTENT_UNPUBLISHED: "Updated",
  CONTENT_ARCHIVED: "Updated",
  CONTENT_DELETED: "Deleted",
  DRAFT_SAVED: "Updated",
  DRAFT_DISCARDED: "Updated",
  FILE_UPLOADED: "Created",
  SETTINGS_CHANGED: "Updated",
  USER_CREATED: "Created",
  USER_UPDATED: "Updated",
  USER_DEACTIVATED: "Updated",
  USER_DELETED: "Deleted",
  ENQUIRY_CREATED: "Created",
  ENQUIRY_READ: "Viewed",
  ENQUIRY_UPDATED: "Updated",
  ENQUIRY_DELETED: "Deleted",
  PASSWORD_RESET: "Password Reset",
  PERMISSION_CHANGED: "Permission Changed",
  VIEWED: "Viewed",
  EXPORTED: "Exported",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const HUMAN_AUDIT_ACTIONS: HumanAuditAction[] = [
  "Created",
  "Updated",
  "Deleted",
  "Logged In",
  "Login Failed",
  "Logged Out",
  "Exported",
  "Approved",
  "Rejected",
  "Viewed",
  "Password Reset",
  "Permission Changed",
];

export const AUDIT_TARGET_TYPES = [
  "Landing Page",
  "Page",
  "Project",
  "Tender",
  "News Post",
  "Governance Document",
  "Board Member",
  "Leadership Member",
  "Media File",
  "Enquiry",
  "User",
  "Site Settings",
  "Navigation Menu",
  "System",
  "Auth",
  "Enquiries",
  "Projects",
  "Tenders",
  "News",
  "Pages",
  "Media",
  "Users",
  "Hero Slides",
  "Documents",
  "Board",
  "Leadership",
] as const;

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  slug: "Slug",
  name: "Name",
  email: "Email",
  status: "Status",
  statusContent: "Publishing Status",
  projectStatus: "Project Status",
  tenderStatus: "Tender Status",
  userStatus: "Account Status",
  featured: "Featured on Homepage",
  progressPercent: "Progress",
  sector: "Sector",
  location: "Location",
  category: "Category",
  department: "Department",
  referenceNumber: "Reference Number",
  roleId: "Role",
  summary: "Summary",
  content: "Content",
  description: "Description",
  orgName: "Organisation Name",
  activeTheme: "Theme",
  mainNavJson: "Navigation Menu",
  password: "Password",
};

export function formatAuditAction(
  action: AuditAction | string,
  displayAction?: string | null
): string {
  if (displayAction?.trim()) return displayAction;
  return ACTION_LABELS[action as AuditAction] ?? formatStatus(action);
}

export function formatAuditTimestamp(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatAuditFieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatAuditChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function parseAuditDetails(details: string | null | undefined): ParsedAuditDetails {
  if (!details) return {};
  try {
    return JSON.parse(details) as ParsedAuditDetails;
  } catch {
    return { summary: details };
  }
}

export function buildAuditSummary(
  action: AuditAction,
  module: string,
  recordName: string,
  extra?: { summary?: string; displayAction?: HumanAuditAction | string }
): string {
  if (extra?.summary) return extra.summary;
  const label = formatAuditAction(action, extra?.displayAction);
  if (!recordName || recordName === "System") return label;
  return `${label} — ${module}: ${recordName}`;
}

export function getAuditActorName(
  log: Pick<AuditLog, "actorName" | "actorEmail"> & { user?: { name: string; email: string } | null }
): string {
  return log.actorName ?? log.user?.name ?? "System";
}

export function getAuditActorEmail(
  log: Pick<AuditLog, "actorEmail"> & { user?: { email: string } | null }
): string | null {
  return log.actorEmail ?? log.user?.email ?? null;
}

export function getAuditTargetType(log: Pick<AuditLog, "targetType" | "module">): string | null {
  return log.targetType ?? log.module ?? null;
}

export function getAuditTargetName(log: Pick<AuditLog, "targetName" | "recordName">): string | null {
  return log.targetName ?? log.recordName ?? null;
}

export function getAuditEventDescription(
  log: Pick<AuditLog, "action" | "displayAction" | "module" | "recordName" | "targetType" | "targetName" | "details">
): string {
  const parsed = parseAuditDetails(log.details);
  if (parsed.summary) return parsed.summary;

  const targetType = getAuditTargetType(log);
  const targetName = getAuditTargetName(log);
  const action = formatAuditAction(log.action, log.displayAction);

  if (!targetType && !targetName) return action;
  if (targetName) return `${action} — ${targetName}`;
  return `${action} — ${targetType}`;
}

export function getAuditChangesMap(
  log: Pick<AuditLog, "changes" | "details">
): AuditChangeMap | null {
  if (log.changes && typeof log.changes === "object" && !Array.isArray(log.changes)) {
    return log.changes as AuditChangeMap;
  }

  const parsed = parseAuditDetails(log.details);
  if (parsed.changes && typeof parsed.changes === "object" && !Array.isArray(parsed.changes)) {
    return parsed.changes as AuditChangeMap;
  }

  if (Array.isArray(parsed.changes)) {
    const map: AuditChangeMap = {};
    parsed.changes.forEach((entry, index) => {
      if (typeof entry !== "string") return;
      const parts = entry.split(":");
      const label = parts[0]?.trim() || `Change ${index + 1}`;
      const rest = parts.slice(1).join(":").trim();
      const arrowSplit = rest.split("→").map((part) => part.trim());
      map[label] =
        arrowSplit.length === 2
          ? { from: arrowSplit[0] || null, to: arrowSplit[1] || null }
          : { from: null, to: rest || entry };
    });
    return Object.keys(map).length > 0 ? map : null;
  }

  return null;
}

export function getAuditChangeRows(
  log: Pick<AuditLog, "changes" | "details">
): Array<{ field: string; before: string; after: string }> {
  const map = getAuditChangesMap(log);
  if (!map) return [];

  return Object.entries(map).flatMap(([field, entry]) => {
    if (entry === null || entry === undefined) return [];

    if (typeof entry !== "object" || Array.isArray(entry)) {
      return [
        {
          field: formatAuditFieldLabel(field),
          before: "—",
          after: formatAuditChangeValue(entry),
        },
      ];
    }

    const change = entry as AuditChangeEntry;
    return [
      {
        field: formatAuditFieldLabel(field),
        before: formatAuditChangeValue(change.from),
        after: formatAuditChangeValue(change.to),
      },
    ];
  });
}

/** @deprecated Use getAuditChangeRows for structured before/after display. */
export function getAuditChangeList(log: Pick<AuditLog, "changes" | "details">): string[] {
  return getAuditChangeRows(log).map((row) => `${row.field}: ${row.before} → ${row.after}`);
}

export function collectChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown>,
  fields: Array<{ key: string; label: string; format?: (value: unknown) => string }>
): string[] {
  if (!before) return [];

  const changes: string[] = [];
  for (const field of fields) {
    const prev = before[field.key];
    const next = after[field.key];
    if (prev === next) continue;
    const format = field.format ?? ((value: unknown) => String(value ?? "—"));
    changes.push(`${field.label}: ${format(prev)} → ${format(next)}`);
  }
  return changes;
}

export type AuditLogListItem = {
  id: string;
  userId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: AuditAction;
  displayAction: string | null;
  module: string;
  recordName: string;
  recordId: string | null;
  targetType: string | null;
  targetName: string | null;
  changes: Prisma.JsonValue;
  ipAddress: string | null;
  userAgent: string | null;
  outcome: string;
  failReason: string | null;
  details: string | null;
  createdAt: Date;
  user: { name: string; email: string } | null;
};
