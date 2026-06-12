import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { validateUploadContent } from "./file-sniff";
import { getImageDimensions } from "./image-dimensions";
import { computeFileHash } from "./media-hash";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MAX_SIZE = (parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? "100", 10) || 100) * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function saveUpload(file: File): Promise<{
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  width: number | null;
  height: number | null;
  fileHash: string;
  filePath: string;
}> {
  if (file.size > MAX_SIZE) {
    throw new Error(`File exceeds maximum size of ${MAX_SIZE / 1024 / 1024}MB`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = validateUploadContent(buffer, file.type, file.name);
  const fileHash = computeFileHash(buffer);
  const dims = getImageDimensions(buffer, mimeType);

  await writeFile(filepath, buffer);

  return {
    filename,
    originalName: file.name,
    mimeType,
    size: buffer.length,
    url: `/api/uploads/${filename}`,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    fileHash,
    filePath: filepath,
  };
}

export function getUploadPath(filename: string): string {
  const safe = path.basename(filename);
  return path.join(UPLOAD_DIR, safe);
}
