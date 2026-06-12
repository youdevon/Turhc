export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDimensions(
  width: number | null | undefined,
  height: number | null | undefined
): string {
  if (width == null || height == null) return "—";
  return `${width} × ${height} px`;
}

export function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

export function isDocumentMime(mimeType: string): boolean {
  return !isImageMime(mimeType) && !isVideoMime(mimeType);
}

export type MediaCategory = "all" | "images" | "videos" | "documents";

export const MEDIA_CATEGORY_TABS: { id: MediaCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "images", label: "Images" },
  { id: "videos", label: "Videos" },
  { id: "documents", label: "Documents" },
];

export function friendlyMediaType(mimeType: string): string {
  if (isImageMime(mimeType)) return "Image";
  if (isVideoMime(mimeType)) return "Video";
  if (mimeType.includes("pdf")) return "PDF document";
  if (mimeType.includes("word") || mimeType.includes("document")) return "Word document";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "Spreadsheet";
  return "Document";
}

export function classifyMediaMime(mimeType: string): Exclude<MediaCategory, "all"> {
  if (isImageMime(mimeType)) return "images";
  if (isVideoMime(mimeType)) return "videos";
  return "documents";
}

export function parseMediaCategory(value: string | undefined): MediaCategory {
  if (value === "images" || value === "videos" || value === "documents") return value;
  return "all";
}

export function mediaCategoryFilter(category: MediaCategory) {
  const base = { isDeleted: false } as const;

  if (category === "images") {
    return { ...base, mimeType: { startsWith: "image/" } };
  }
  if (category === "videos") {
    return { ...base, mimeType: { startsWith: "video/" } };
  }
  if (category === "documents") {
    return {
      ...base,
      NOT: {
        OR: [{ mimeType: { startsWith: "image/" } }, { mimeType: { startsWith: "video/" } }],
      },
    };
  }
  return base;
}

export function fileExtension(name: string): string {
  const ext = name.split(".").pop()?.toUpperCase();
  return ext && ext.length <= 6 ? ext : "FILE";
}
