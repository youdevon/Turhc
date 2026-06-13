"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, FileText, Trash2 } from "lucide-react";
import { removeMediaAssetAction } from "@/lib/media-actions";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import {
  formatFileSize,
  formatDimensions,
  friendlyMediaType,
  isImageMime,
  isVideoMime,
  fileExtension,
  type MediaCategory,
} from "@/lib/media-utils";
import { AdminEmptyState } from "./AdminEmptyState";
import { SelectableUrlInput } from "@/components/admin/SelectableUrlInput";
import { MediaDetailModal } from "./MediaDetailModal";
import { formatShortDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type MediaLibraryItem = {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  fileHash: string | null;
  createdAt: string;
  altText: string | null;
  caption: string | null;
  isDuplicate?: boolean;
  fileMissing?: boolean;
};

type Props = {
  assets: MediaLibraryItem[];
  category: MediaCategory;
};

const EMPTY_COPY: Record<MediaCategory, { title: string; description: string }> = {
  all: {
    title: "No media files yet",
    description: "Upload images and documents using the uploader above. Files can be reused across pages and content.",
  },
  images: {
    title: "No images yet",
    description: "Upload JPEG, PNG, WebP, GIF, or SVG files for use on the website.",
  },
  videos: {
    title: "No videos yet",
    description: "Upload MP4 or WebM files when you need video content on the site.",
  },
  documents: {
    title: "No documents yet",
    description: "Upload PDF, Word, or Excel files for public download or reference.",
  },
};

function MediaPreview({ asset }: { asset: MediaLibraryItem }) {
  const [broken, setBroken] = useState(false);

  if (isImageMime(asset.mimeType)) {
    if (broken) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface p-3 text-center">
          <FileText className="w-8 h-8 text-amber-500/80" />
          <span className="text-xs text-muted leading-snug">File missing on server — re-upload this image</span>
        </div>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText ?? ""}
        className="w-full h-full object-cover"
        onError={() => setBroken(true)}
      />
    );
  }

  if (isVideoMime(asset.mimeType)) {
    return (
      <video
        src={asset.url}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface p-3">
      <FileText className="w-10 h-10 text-primary/70" />
      <span className="text-xs font-semibold text-muted uppercase tracking-wide">
        {fileExtension(asset.originalName)}
      </span>
    </div>
  );
}

export function MediaLibraryGrid({ assets, category }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailAsset, setDetailAsset] = useState<MediaLibraryItem | null>(null);

  const handleDelete = async (asset: MediaLibraryItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const ok = await confirm({
      ...ALERT_MESSAGES.confirmDeleteMedia(asset.originalName),
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(asset.id);
    startTransition(async () => {
      let result = await removeMediaAssetAction(asset.id);

      if (!result.ok && result.canForceRemove) {
        const forceOk = await confirm({
          ...ALERT_MESSAGES.confirmRemoveMissingMedia(asset.originalName),
          variant: "warning",
        });
        if (forceOk) {
          result = await removeMediaAssetAction(asset.id, { clearReferences: true });
        } else {
          setDeletingId(null);
          return;
        }
      }

      if (!result.ok) {
        notifyError(result.error);
        setDeletingId(null);
        return;
      }

      notifySuccess(
        result.clearedReferences?.length
          ? `${asset.originalName} removed. Cleared ${result.clearedReferences.length} broken link(s).`
          : ALERT_MESSAGES.mediaDeleted(asset.originalName)
      );
      router.refresh();
      setDeletingId(null);
    });
  };

  if (!assets.length) {
    const copy = EMPTY_COPY[category];
    return <AdminEmptyState title={copy.title} description={copy.description} />;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {assets.map((asset) => {
          const isDeleting = pending && deletingId === asset.id;

          return (
            <div
              key={asset.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetailAsset(asset)}
              onKeyDown={(e) => e.key === "Enter" && setDetailAsset(asset)}
              className={cn(
                "group admin-card overflow-hidden text-left transition-colors duration-150 hover:border-primary/30 cursor-pointer",
                asset.isDuplicate && "ring-1 ring-amber-500/40"
              )}
            >
              <div className="relative aspect-square bg-surface">
                <MediaPreview asset={asset} />

                {asset.isDuplicate && (
                  <span className="absolute top-2 left-2 admin-badge admin-badge-draft">
                    Duplicate
                  </span>
                )}

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailAsset(asset);
                    }}
                    className="admin-btn-icon admin-btn-quiet bg-surface border border-border shadow-sm"
                    aria-label="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(asset, e)}
                    disabled={isDeleting}
                    className="admin-btn-icon admin-btn-quiet admin-btn-icon--danger bg-surface border border-border shadow-sm disabled:opacity-50"
                    aria-label={`Delete ${asset.originalName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 space-y-1 min-w-0">
                <p className="text-sm font-medium truncate" title={asset.originalName}>
                  {asset.originalName}
                </p>
                <p className="text-xs text-muted">{friendlyMediaType(asset.mimeType)}</p>
                <p className="text-xs text-muted">
                  {formatFileSize(asset.size)}
                  {isImageMime(asset.mimeType) && asset.width && asset.height && (
                    <> · {formatDimensions(asset.width, asset.height)}</>
                  )}
                </p>
                <p className="admin-meta">Added {formatShortDate(new Date(asset.createdAt))}</p>
                {asset.altText && (
                  <p className="admin-meta truncate" title={asset.altText}>
                    Alt: {asset.altText}
                  </p>
                )}
                <div onClick={(e) => e.stopPropagation()}>
                  <SelectableUrlInput
                    value={asset.url}
                    className="admin-input mt-1 text-xs py-1.5"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {detailAsset && (
        <MediaDetailModal
          asset={detailAsset}
          open={Boolean(detailAsset)}
          onClose={() => setDetailAsset(null)}
          onUpdated={() => router.refresh()}
        />
      )}
    </>
  );
}
