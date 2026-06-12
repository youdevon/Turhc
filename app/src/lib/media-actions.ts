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
  deleteStoredMediaFile,
  getMediaUsage,
  reassignMediaReferences,
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
