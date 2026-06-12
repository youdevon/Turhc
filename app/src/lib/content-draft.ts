import { ContentStatus } from "@prisma/client";

export type WorkflowStatus =
  | "PUBLISHED"
  | "DRAFT_ONLY"
  | "UNPUBLISHED_CHANGES"
  | "ARCHIVED";

export type DraftableRecord = {
  status?: ContentStatus;
  statusContent?: ContentStatus;
  draftData?: string | null;
};

export function getRecordStatus(record: DraftableRecord): ContentStatus {
  return record.statusContent ?? record.status ?? ContentStatus.DRAFT;
}

export function hasUnpublishedDraft(record: DraftableRecord): boolean {
  return Boolean(record.draftData?.trim()) && getRecordStatus(record) === ContentStatus.PUBLISHED;
}

export function getWorkflowStatus(record: DraftableRecord): WorkflowStatus {
  const status = getRecordStatus(record);
  if (status === ContentStatus.ARCHIVED) return "ARCHIVED";
  if (status === ContentStatus.DRAFT) return "DRAFT_ONLY";
  if (hasUnpublishedDraft(record)) return "UNPUBLISHED_CHANGES";
  return "PUBLISHED";
}

export function parseDraftJson<T>(json: string | null | undefined): T | null {
  if (!json?.trim()) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function mergeWithDraft<T extends Record<string, unknown>>(
  live: T,
  draftData: string | null | undefined
): T & { hasDraft: boolean } {
  const draft = parseDraftJson<Partial<T>>(draftData);
  if (!draft) return { ...live, hasDraft: false };
  return { ...live, ...draft, hasDraft: true };
}

export function workflowStatusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "DRAFT_ONLY":
      return "Draft only";
    case "UNPUBLISHED_CHANGES":
      return "Unpublished changes";
    case "ARCHIVED":
      return "Archived";
  }
}
