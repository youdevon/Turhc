"use client";

import { useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { MediaLibraryPickerModal } from "./MediaLibraryPickerModal";

type PreviewMode = "both" | "dark-only" | "light-only";

type Props = {
  name?: string;
  initialMediaId?: string;
  initialUrl?: string | null;
  /** Logo shown on dark header backgrounds (typically white). */
  darkPreviewUrl?: string | null;
  /** Logo shown on light header backgrounds (typically coloured). */
  lightPreviewUrl?: string | null;
  /** Highlights the preview matching the selected public site theme. */
  siteTheme?: "dark" | "light";
  previewMode?: PreviewMode;
  brandContext?: boolean;
  label?: string;
};

export function LogoUploader({
  name = "logoMediaId",
  initialMediaId = "",
  initialUrl = null,
  darkPreviewUrl,
  lightPreviewUrl,
  siteTheme = "dark",
  previewMode = "both",
  brandContext = false,
  label,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [mediaId, setMediaId] = useState(initialMediaId);
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const darkLogo = darkPreviewUrl ?? previewUrl;
  const lightLogo = lightPreviewUrl ?? previewUrl;

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      notifyError(ALERT_MESSAGES.uploadImageOnly);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadUrl = brandContext
        ? "/api/media/upload?context=brand"
        : "/api/media/upload";
      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMediaId(data.id);
      setPreviewUrl(data.url);
      notifySuccess(ALERT_MESSAGES.logoUploaded);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : ALERT_MESSAGES.uploadFailed);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleUpload(file);
  }

  function handleLibrarySelect(asset: { id: string; url: string }) {
    setMediaId(asset.id);
    setPreviewUrl(asset.url);
  }

  function handleRemove() {
    setMediaId("");
    setPreviewUrl(null);
  }

  const showDark = previewMode !== "light-only" && Boolean(darkLogo);
  const showLight = previewMode !== "dark-only" && Boolean(lightLogo);

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={mediaId} />

      {(showDark || showLight) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Current logo</p>
            <button
              type="button"
              onClick={handleRemove}
              className="admin-btn-icon admin-btn-quiet admin-btn-icon--danger"
              aria-label="Remove logo"
            >
              <X />
            </button>
          </div>
          <p className="text-xs text-muted">
            Preview how the logo appears on header backgrounds (transparency preserved):
          </p>
          <div
            className={cn(
              "grid gap-3",
              showDark && showLight ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            )}
          >
            {showDark && (
              <div className="space-y-1.5">
                <p className="admin-eyebrow">
                  On dark header
                </p>
                <div
                  className={cn(
                    "logo-preview-panel logo-preview-panel--dark",
                    siteTheme === "dark" && previewMode === "both" && "logo-preview-panel--active"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={darkLogo!}
                    alt="Logo on dark header"
                    className="h-10 w-auto max-w-[200px] object-contain"
                  />
                </div>
              </div>
            )}
            {showLight && (
              <div className="space-y-1.5">
                <p className="admin-eyebrow">
                  On light header
                </p>
                <div
                  className={cn(
                    "logo-preview-panel logo-preview-panel--light",
                    siteTheme === "light" && previewMode === "both" && "logo-preview-panel--active"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lightLogo!}
                    alt="Logo on light header"
                    className="h-10 w-auto max-w-[200px] object-contain"
                  />
                </div>
              </div>
            )}
          </div>
          {previewMode === "both" && (
            <p className="admin-meta">
              The highlighted preview matches your selected public site theme. Upload separate white and
              coloured logo variants in Developer Settings if one version is hard to see.
            </p>
          )}
        </div>
      )}

      <label
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <Upload className="w-5 h-5 text-muted" />
        <span className="text-sm text-muted">
          {uploading ? "Uploading..." : previewUrl ? "Replace logo" : label ?? "Upload header logo"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      <div className="admin-actions">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="admin-btn-secondary"
        >
          <Upload />
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="admin-btn-secondary"
        >
          <ImageIcon />
          Library
        </button>
      </div>

      <p className="text-xs text-muted">
        Use PNG or SVG with a transparent background. For light site themes, upload a coloured or dark logo
        variant so it remains visible on pale headers.
      </p>

      <MediaLibraryPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleLibrarySelect}
        selectedId={mediaId}
      />
    </div>
  );
}
