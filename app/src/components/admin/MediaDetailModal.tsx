"use client";

import { useState, useTransition } from "react";
import { Copy, X } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { updateMediaAltText } from "@/lib/media-actions";
import { formatFileSize, formatDimensions } from "@/lib/media-utils";
import { formatShortDate } from "@/lib/utils";
import { SelectableUrlInput } from "./SelectableUrlInput";
import type { MediaLibraryItem } from "./MediaLibraryGrid";

type Props = {
  asset: MediaLibraryItem;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

export function MediaDetailModal({ asset, open, onClose, onUpdated }: Props) {
  const [altText, setAltText] = useState(asset.altText ?? "");
  const [caption, setCaption] = useState(asset.caption ?? "");
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(asset.url);
      notifySuccess(ALERT_MESSAGES.mediaUrlCopied);
    } catch {
      notifyError(ALERT_MESSAGES.copyFailed);
    }
  }

  function saveMeta() {
    startTransition(async () => {
      try {
        await updateMediaAltText(asset.id, altText, caption);
        notifySuccess(ALERT_MESSAGES.mediaDetailsSaved);
        onUpdated?.();
      } catch {
        notifyError(ALERT_MESSAGES.saveFailed);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border bg-surface-elevated shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border sticky top-0 bg-surface-elevated z-10">
          <h2 className="font-semibold truncate">{asset.originalName}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="border border-border overflow-hidden bg-surface aspect-video max-h-72 flex items-center justify-center">
            {asset.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.url} alt={asset.altText ?? ""} className="max-w-full max-h-72 object-contain" />
            ) : (
              <p className="text-sm text-muted p-4">{asset.mimeType}</p>
            )}
          </div>

          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-muted">Original file name</dt>
              <dd className="font-medium break-all">{asset.originalName}</dd>
            </div>
            <div>
              <dt className="text-muted">Stored file name</dt>
              <dd className="break-all">{asset.filename}</dd>
            </div>
            <div>
              <dt className="text-muted">MIME type</dt>
              <dd>{asset.mimeType}</dd>
            </div>
            <div>
              <dt className="text-muted">File size</dt>
              <dd>{formatFileSize(asset.size)}</dd>
            </div>
            <div>
              <dt className="text-muted">Dimensions</dt>
              <dd>{formatDimensions(asset.width, asset.height)}</dd>
            </div>
            <div>
              <dt className="text-muted">Uploaded</dt>
              <dd>{formatShortDate(new Date(asset.createdAt))}</dd>
            </div>
            {asset.fileHash && (
              <div className="sm:col-span-2">
                <dt className="text-muted">File hash (SHA-256)</dt>
                <dd className="font-mono text-xs break-all">{asset.fileHash}</dd>
              </div>
            )}
          </dl>

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-1">URL</label>
            <div className="flex gap-2">
              <SelectableUrlInput value={asset.url} className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-2" />
              <button
                type="button"
                onClick={copyUrl}
                className="admin-btn-secondary"
              >
                <Copy />
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground-muted">Alt text</label>
            <input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="admin-input"
            />
            <label className="block text-sm font-medium text-foreground-muted">Caption</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="admin-input"
            />
            <button
              type="button"
              disabled={pending}
              onClick={saveMeta}
              className="admin-btn-primary"
            >
              Save alt text / caption
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
