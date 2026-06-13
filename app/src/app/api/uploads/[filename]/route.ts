import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { sniffMimeType } from "@/lib/file-sniff";
import { getUploadPath } from "@/lib/uploads";

const EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function contentDisposition(filename: string, mime: string): string {
  const safe = filename.replace(/[^\w.\-() ]/g, "_");
  const inline =
    mime !== "image/svg+xml" &&
    (mime === "application/pdf" || mime.startsWith("image/") || mime.startsWith("video/"));
  return `${inline ? "inline" : "attachment"}; filename="${safe}"`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  try {
    const filepath = getUploadPath(filename);
    const fileStat = await stat(filepath);
    if (!fileStat.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const buffer = await readFile(filepath);
    const ext = path.extname(filename).toLowerCase();
    const sniffed = sniffMimeType(buffer);
    const contentType = sniffed ?? EXT_MIME[ext] ?? "application/octet-stream";

    const asset = await prisma.mediaAsset.findFirst({
      where: { filename: path.basename(filename), isDeleted: false },
      select: { originalName: true },
    });
    const downloadName = asset?.originalName ?? filename;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": contentDisposition(downloadName, contentType),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
