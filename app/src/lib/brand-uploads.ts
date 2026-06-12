import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getImageDimensions } from "./image-dimensions";
import { computeFileHash } from "./media-hash";

const BRAND_DIR = path.join(process.cwd(), "public", "uploads", "brand");
const MAX_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export async function saveBrandLogo(file: File): Promise<{
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  width: number | null;
  height: number | null;
  fileHash: string;
}> {
  if (file.size > MAX_SIZE) {
    throw new Error("Logo exceeds maximum size of 20MB");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Logo type ${file.type} is not allowed. Use PNG, SVG, JPG, or WebP.`);
  }

  await mkdir(BRAND_DIR, { recursive: true });

  const ext = path.extname(file.name).toLowerCase() || ".png";
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(BRAND_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const dims = getImageDimensions(buffer, file.type);

  return {
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: buffer.length,
    url: `/uploads/brand/${filename}`,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    fileHash: computeFileHash(buffer),
  };
}
