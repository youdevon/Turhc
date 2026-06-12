"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { isImageMime } from "@/lib/media-utils";

export type MediaPickerAsset = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaPickerAsset) => void;
  /** When true, only image assets are shown. Default true. */
  imagesOnly?: boolean;
  /** Highlight the asset whose URL matches (optional). */
  selectedUrl?: string;
  /** Highlight the asset whose ID matches (optional). */
  selectedId?: string;
};

export function MediaLibraryPickerModal({
  open,
  onClose,
  onSelect,
  imagesOnly = true,
  selectedUrl,
  selectedId,
}: Props) {
  const [assets, setAssets] = useState<MediaPickerAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoadingAssets(true);
    fetch("/api/media")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load media library");
        setAssets(data);
      })
      .catch((error) => {
        notifyError(error instanceof Error ? error.message : ALERT_MESSAGES.loadFailed);
      })
      .finally(() => setLoadingAssets(false));
  }, [open]);

  if (!open) return null;

  const filteredAssets = imagesOnly
    ? assets.filter((asset) => isImageMime(asset.mimeType))
    : assets;

  function handleSelect(asset: MediaPickerAsset) {
    onSelect(asset);
    onClose();
    notifySuccess(ALERT_MESSAGES.mediaSelectFromLibrary(asset.originalName));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close media library"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] overflow-hidden border border-border bg-surface-elevated shadow-2xl flex flex-col">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold">Choose from media library</h3>
            <p className="text-sm text-muted mt-0.5">
              {imagesOnly
                ? "Select an uploaded image to use here."
                : "Select an uploaded file to use here."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {loadingAssets ? (
            <p className="text-sm text-muted text-center py-12">Loading media library...</p>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-muted">
                {imagesOnly ? "No images in the library yet." : "No files in the library yet."}
              </p>
              <Link
                href="/admin/media"
                target="_blank"
                className="inline-flex text-sm text-primary hover:underline"
              >
                Upload files in Media Library
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected =
                  (selectedId && asset.id === selectedId) ||
                  (selectedUrl && asset.url === selectedUrl);

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelect(asset)}
                    className={cn(
                      "border border-border overflow-hidden text-left hover:border-primary transition-colors",
                      isSelected && "border-primary ring-2 ring-primary/30"
                    )}
                  >
                    {isImageMime(asset.mimeType) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.url}
                        alt={asset.originalName}
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center bg-background text-xs text-muted px-2 text-center">
                        {asset.originalName}
                      </div>
                    )}
                    <p className="px-2 py-1.5 text-xs truncate" title={asset.originalName}>
                      {asset.originalName}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
