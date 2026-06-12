"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ImageIcon, Upload, X } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { MediaLibraryPickerModal } from "./MediaLibraryPickerModal";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  name?: string;
  help?: string;
  required?: boolean;
  className?: string;
};

export function MediaUrlField({
  label,
  value,
  onChange,
  name,
  help = "Upload a new image or choose one from the media library.",
  required,
  className,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      notifyError(ALERT_MESSAGES.uploadImageOnly);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
      notifySuccess(ALERT_MESSAGES.mediaSelectFromLibrary(data.originalName));
    } catch (error) {
      notifyError(error instanceof Error ? error.message : ALERT_MESSAGES.uploadFailed);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2 min-w-0", className)}>
      <label className="block text-sm font-medium text-foreground-muted">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="space-y-2">
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder="/api/uploads/... or paste a URL"
          title={value || undefined}
          className="w-full min-w-0 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
        />
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
          <button type="button" onClick={() => setPickerOpen(true)} className="admin-btn-secondary">
            <ImageIcon />
            Library
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
        }}
      />

      {help && (
        <p className="text-xs text-muted">
          {help}{" "}
          <Link href="/admin/media" target="_blank" className="text-primary hover:underline">
            Open media library
          </Link>
        </p>
      )}

      {value && value.startsWith("/") && (
        <div className="relative w-full max-w-xs aspect-video overflow-hidden border border-border bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-black/55 text-white hover:bg-red-600 transition-colors"
            aria-label="Clear image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <MediaLibraryPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => onChange(asset.url)}
        selectedUrl={value}
      />
    </div>
  );
}
