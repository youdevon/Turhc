import type { MediaAsset } from "@prisma/client";
import { readFile } from "fs/promises";
import { prisma } from "./db";
import { computeFileHash } from "./media-hash";
import { getImageDimensions } from "./image-dimensions";
import { getUploadPath } from "./uploads";
import path from "path";
import {
  deleteStoredMediaFile,
  getMediaUsage,
  reassignMediaReferences,
  type MediaUsageRef,
} from "./media-delete";

export type MediaDuplicateGroup = {
  groupKey: string;
  originalName: string;
  size: number;
  width: number | null;
  height: number | null;
  fileHash: string | null;
  primary: MediaAsset;
  duplicates: MediaAsset[];
};

export type MediaDuplicateGroupWithUsage = MediaDuplicateGroup & {
  duplicateUsage: Record<string, MediaUsageRef[]>;
};

function metaKey(asset: Pick<MediaAsset, "originalName" | "size" | "width" | "height">): string {
  return `meta:${asset.originalName}:${asset.size}:${asset.width ?? "null"}:${asset.height ?? "null"}`;
}

export async function findDuplicateGroups(): Promise<MediaDuplicateGroup[]> {
  const assets = await prisma.mediaAsset.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "asc" },
  });

  const buckets = new Map<string, MediaAsset[]>();

  for (const asset of assets) {
    const key = asset.fileHash ? `hash:${asset.fileHash}` : metaKey(asset);
    const list = buckets.get(key) ?? [];
    list.push(asset);
    buckets.set(key, list);
  }

  const groups: MediaDuplicateGroup[] = [];
  let index = 0;

  for (const [groupKey, members] of buckets) {
    if (members.length < 2) continue;
    index += 1;
    const [primary, ...duplicates] = members;
    groups.push({
      groupKey: `${index}:${groupKey}`,
      originalName: primary.originalName,
      size: primary.size,
      width: primary.width,
      height: primary.height,
      fileHash: primary.fileHash,
      primary,
      duplicates,
    });
  }

  return groups;
}

export async function findDuplicateGroupsWithUsage(): Promise<MediaDuplicateGroupWithUsage[]> {
  const groups = await findDuplicateGroups();
  const result: MediaDuplicateGroupWithUsage[] = [];

  for (const group of groups) {
    const duplicateUsage: Record<string, MediaUsageRef[]> = {};
    for (const dup of group.duplicates) {
      duplicateUsage[dup.id] = await getMediaUsage(dup.id);
    }
    result.push({ ...group, duplicateUsage });
  }

  return result;
}

export function getDuplicateAssetIds(groups: MediaDuplicateGroup[]): Set<string> {
  const ids = new Set<string>();
  for (const group of groups) {
    for (const dup of group.duplicates) ids.add(dup.id);
  }
  return ids;
}

export type RebuildMediaMetadataResult = {
  updated: number;
  missingOnDisk: string[];
  errors: string[];
};

export async function rebuildMediaMetadata(): Promise<RebuildMediaMetadataResult> {
  const assets = await prisma.mediaAsset.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "asc" },
  });

  const result: RebuildMediaMetadataResult = {
    updated: 0,
    missingOnDisk: [],
    errors: [],
  };

  for (const asset of assets) {
    let filepath: string | null = null;
    if (asset.url.startsWith("/api/uploads/")) {
      filepath = getUploadPath(asset.filename);
    } else if (asset.url.startsWith("/uploads/brand/")) {
      filepath = path.join(process.cwd(), "public", "uploads", "brand", asset.filename);
    }
    if (!filepath) continue;

    try {
      const buffer = await readFile(filepath);
      const fileHash = computeFileHash(buffer);
      const dims = getImageDimensions(buffer, asset.mimeType);

      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          size: buffer.length,
          width: dims?.width ?? asset.width,
          height: dims?.height ?? asset.height,
          fileHash,
        },
      });
      result.updated += 1;
    } catch {
      result.missingOnDisk.push(asset.originalName);
    }
  }

  return result;
}

export type CleanupDuplicatesResult = {
  groupsProcessed: number;
  removed: number;
  referencesUpdated: number;
  skippedInUse: number;
  details: Array<{
    group: string;
    keptId: string;
    removedIds: string[];
    reassigned: string[];
  }>;
};

export async function cleanupAllDuplicateMedia(): Promise<CleanupDuplicatesResult> {
  await rebuildMediaMetadata();

  const groups = await findDuplicateGroups();
  const result: CleanupDuplicatesResult = {
    groupsProcessed: groups.length,
    removed: 0,
    referencesUpdated: 0,
    skippedInUse: 0,
    details: [],
  };

  for (const group of groups) {
    const removedIds: string[] = [];
    const reassigned: string[] = [];

    for (const dup of group.duplicates) {
      const usage = await getMediaUsage(dup.id);
      if (usage.length > 0) {
        const migrated = await reassignMediaReferences(
          dup.id,
          dup.url,
          group.primary.id,
          group.primary.url
        );
        if (migrated.length > 0) {
          reassigned.push(...migrated);
          result.referencesUpdated += migrated.length;
        }
      }

      await prisma.mediaAsset.update({
        where: { id: dup.id },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      await deleteStoredMediaFile(dup.url);
      removedIds.push(dup.id);
      result.removed += 1;
    }

    result.details.push({
      group: group.originalName,
      keptId: group.primary.id,
      removedIds,
      reassigned,
    });
  }

  return result;
}
