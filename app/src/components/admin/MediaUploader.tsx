"use client";

import { useRef, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import { DUPLICATE_UPLOAD_MESSAGE } from "@/lib/media-dedup";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { MediaLibraryPickerModal } from "./MediaLibraryPickerModal";

type UploadResult = {
  uploaded: number;
  duplicates: number;
};

type Props = {
  onUploaded?: (asset: { id: string; url: string; originalName: string }) => void;
  onBatchComplete?: (result: UploadResult) => void;
  name?: string;
  multiple?: boolean;
  defaultValue?: string;
  /** Show browse-from-library button. Default true. */
  enableLibrary?: boolean;
  /** When true, library picker only shows images. Default true. */
  imagesOnly?: boolean;
  help?: string;
};

export function MediaUploader({
  onUploaded,
  onBatchComplete,
  name = "mediaId",
  multiple = true,
  defaultValue = "",
  enableLibrary = true,
  imagesOnly = true,
  help,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState(defaultValue);
  const [progress, setProgress] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function selectAsset(asset: { id: string; url: string; originalName: string }) {
    setSelectedId(asset.id);
    onUploaded?.(asset);
  }

  async function uploadFile(file: File): Promise<"ok" | "duplicate" | "error"> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/media/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (res.status === 409 && data.error === "duplicate") {
      notifyError(
        `${DUPLICATE_UPLOAD_MESSAGE} (${data.existing?.originalName ?? file.name})`,
        { duration: 5000 }
      );
      return "duplicate";
    }

    if (!res.ok) throw new Error(data.message ?? data.error ?? "Upload failed");

    setSelectedId(data.id);
    onUploaded?.(data);
    return "ok";
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    let uploaded = 0;
    let duplicates = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(files.length > 1 ? `Uploading ${i + 1} of ${files.length}…` : "Uploading…");
        try {
          const result = await uploadFile(files[i]);
          if (result === "ok") uploaded += 1;
          if (result === "duplicate") duplicates += 1;
        } catch (err) {
          notifyError(
            err instanceof Error ? err.message : `Failed to upload ${files[i].name}`
          );
        }
      }

      if (files.length === 1 && uploaded === 1) {
        notifySuccess(ALERT_MESSAGES.mediaUploaded(files[0].name));
      } else if (uploaded > 0 || duplicates > 0) {
        const parts: string[] = [];
        if (uploaded > 0) parts.push(`${uploaded} file${uploaded === 1 ? "" : "s"} uploaded`);
        if (duplicates > 0) parts.push(`${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped`);
        notifySuccess(parts.join(". ") + ".");
      }

      onBatchComplete?.({ uploaded, duplicates });
    } finally {
      setUploading(false);
      setProgress("");
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selectedId} />
      <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-muted" />
          <span className="text-sm text-muted">
            {uploading ? progress || "Uploading..." : "Click to upload files"}
          </span>
        </div>
        {multiple && !uploading && (
          <span className="text-xs text-muted">Multiple files supported · duplicates are skipped</span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>

      {enableLibrary && (
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
      )}

      {help && <p className="text-xs text-muted">{help}</p>}

      <MediaLibraryPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={selectAsset}
        imagesOnly={imagesOnly}
        selectedId={selectedId}
      />
    </div>
  );
}
