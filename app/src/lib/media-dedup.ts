import type { MediaAsset } from "@prisma/client";
import { prisma } from "./db";

export type DuplicateMatchKind = "hash" | "metadata";

export type DuplicateCheckResult = {
  kind: DuplicateMatchKind;
  asset: MediaAsset;
};

const activeWhere = { isDeleted: false } as const;

export async function findExistingDuplicate(params: {
  fileHash: string;
  originalName: string;
  size: number;
  width: number | null;
  height: number | null;
}): Promise<DuplicateCheckResult | null> {
  const byHash = await prisma.mediaAsset.findFirst({
    where: { ...activeWhere, fileHash: params.fileHash },
    orderBy: { createdAt: "asc" },
  });
  if (byHash) return { kind: "hash", asset: byHash };

  const byMeta = await prisma.mediaAsset.findFirst({
    where: {
      ...activeWhere,
      originalName: params.originalName,
      size: params.size,
      width: params.width,
      height: params.height,
    },
    orderBy: { createdAt: "asc" },
  });
  if (byMeta) return { kind: "metadata", asset: byMeta };

  return null;
}

export const DUPLICATE_UPLOAD_MESSAGE = "This image already exists in the media library.";
