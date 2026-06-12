"use client";

import { useRouter } from "next/navigation";
import { MediaUploader } from "./MediaUploader";

export function MediaUploadPanel() {
  const router = useRouter();
  return (
    <div className="border border-border bg-surface-elevated p-6">
      <MediaUploader onUploaded={() => router.refresh()} enableLibrary={false} />
    </div>
  );
}
