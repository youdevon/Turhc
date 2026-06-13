"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { auditContentAction, requireAdmin } from "./admin-actions";
import {
  findDuplicateGroupsWithUsage,
  rebuildMediaMetadata,
  type MediaDuplicateGroupWithUsage,
} from "./media-duplicates";
import {
  clearMediaReferences,
  deleteStoredMediaFile,
  formatMediaUsageMessage,
  getBlockingMediaUsage,
  getMediaUsage,
  isMediaFileOnDisk,
  reassignMediaReferences,
  type MediaUsageRef,
} from "./media-delete";
import { findDuplicateGroups } from "./media-duplicates";

function revalidateMedia() {
  revalidatePath("/admin/media");
  revalidatePath("/admin", "layout");
}

export async function getMediaDuplicateReport(): Promise<MediaDuplicateGroupWithUsage[]> {
  await requireAdmin();
  return findDuplicateGroupsWithUsage();
}

export async function rebuildMediaMetadataAction() {
  await requireAdmin();
  const result = await rebuildMediaMetadata();

  await auditContentAction({
    action: "CONTENT_UPDATED",
    module: "Media",
    recordName: "Media Library",
    summary: `Rebuilt metadata for ${result.updated} media file${result.updated === 1 ? "" : "s"}`,
    details: {
      updated: result.updated,
      missingOnDisk: result.missingOnDisk,
      errors: result.errors,
    },
  });

  revalidateMedia();
  return result;
}

export async function softDeleteDuplicateMedia(id: string) {
  await requireAdmin();
  const asset = await prisma.mediaAsset.findFirst({ where: { id, isDeleted: false } });
  if (!asset) throw new Error("File not found");

  const groups = await findDuplicateGroups();
  const group = groups.find((g) => g.duplicates.some((d) => d.id === id));
  if (!group) throw new Error("This file is not marked as a duplicate.");

  const usage = await getMediaUsage(id);
  if (usage.length > 0) {
    await reassignMediaReferences(
      asset.id,
      asset.url,
      group.primary.id,
      group.primary.url
    );
  }

  await prisma.mediaAsset.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await deleteStoredMediaFile(asset.url);

  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "Media",
    recordName: asset.originalName,
    recordId: asset.id,
    summary: `Archived duplicate media file "${asset.originalName}"`,
    details: { duplicateCleanup: true },
  });

  revalidateMedia();
  return { success: true };
}

export async function cleanupAllDuplicatesAction() {
  await requireAdmin();
  const { cleanupAllDuplicateMedia } = await import("./media-duplicates");
  const result = await cleanupAllDuplicateMedia();

  await auditContentAction({
    action: "CONTENT_DELETED",
    module: "Media",
    recordName: "Media Library",
    summary: `Removed ${result.removed} duplicate media file${result.removed === 1 ? "" : "s"}`,
    details: result,
  });

  revalidateMedia();
  return result;
}

export async function updateMediaAltText(id: string, altText: string, caption?: string) {
  await requireAdmin();

  const asset = await prisma.mediaAsset.update({
    where: { id },
    data: {
      altText: altText.trim() || null,
      caption: caption?.trim() || null,
    },
  });

  await auditContentAction({
    action: "CONTENT_UPDATED",
    module: "Media",
    recordName: asset.originalName,
    recordId: asset.id,
    summary: `Updated alt text for "${asset.originalName}"`,
  });

  revalidateMedia();
  return asset;
}

export type RemoveMediaAssetResult =
  | { ok: true; clearedReferences?: string[] }
  | {
      ok: false;
      error: string;
      usage?: MediaUsageRef[];
      missingOnDisk?: boolean;
      canForceRemove?: boolean;
    };

export async function removeMediaAssetAction(
  id: string,
  options?: { clearReferences?: boolean }
): Promise<RemoveMediaAssetResult> {
  await requireAdmin();

  const asset = await prisma.mediaAsset.findFirst({ where: { id, isDeleted: false } });
  if (!asset) {
    return { ok: false, error: "File not found. It may have already been deleted." };
  }

  const missingOnDisk = !(await isMediaFileOnDisk(asset));
  const usage = await getMediaUsage(id);

  if (usage.length > 0 && !options?.clearReferences) {
    return {
      ok: false,
      error: formatMediaUsageMessage(usage),
      usage,
      missingOnDisk,
      canForceRemove: missingOnDisk,
    };
  }

  if (options?.clearReferences) {
    if (!missingOnDisk) {
      return {
        ok: false,
        error: "Reference clearing is only available for files that are missing on the server.",
      };
    }

    const blocking = await getBlockingMediaUsage(id, asset.url);
    if (blocking.length > 0) {
      return {
        ok: false,
        error: `${formatMediaUsageMessage(blocking)} Update or delete those records manually, then try again.`,
        usage: blocking,
        missingOnDisk: true,
      };
    }
  }

  let clearedReferences: string[] | undefined;
  if (options?.clearReferences && usage.length > 0) {
    clearedReferences = await clearMediaReferences(asset.id, asset.url);
  } else if (usage.length > 0) {
    return {
      ok: false,
      error: formatMediaUsageMessage(usage),
      usage,
      missingOnDisk,
    };
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
    summary: missingOnDisk
      ? `Removed missing media library entry "${asset.originalName}"`
      : `Deleted file "${asset.originalName}" from the media library`,
    details: {
      changes: [
        `File type: ${asset.mimeType}`,
        missingOnDisk ? "File was already missing on disk" : `Removed from disk: ${asset.url}`,
        clearedReferences?.length
          ? `Cleared references: ${clearedReferences.join(", ")}`
          : null,
      ].filter(Boolean),
    },
  });

  revalidateMedia();
  return { ok: true, clearedReferences };
}
