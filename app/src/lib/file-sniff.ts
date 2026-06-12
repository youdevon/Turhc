/** Detect MIME type from file magic bytes (not from browser/extension). */
export function sniffMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.subarray(0, 8).toString("ascii") === "\x89PNG\r\n\x1a\n") {
    return "image/png";
  }
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a") {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.subarray(0, 4).toString("ascii").startsWith("<svg") || buffer.subarray(0, 5).toString("utf8").includes("<svg")) {
    return "image/svg+xml";
  }
  if (buffer.subarray(0, 2).toString("ascii") === "MZ") {
    return "application/x-msdownload";
  }
  if (buffer.length >= 8 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    return "video/mp4";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBM") {
    return "video/webm";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "PK\x03\x04") {
    // ZIP-based Office Open XML or generic zip
    const head = buffer.subarray(0, Math.min(buffer.length, 512)).toString("utf8");
    if (head.includes("word/")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (head.includes("xl/")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    return "application/zip";
  }
  if (buffer.subarray(0, 8).toString("hex") === "d0cf11e0a1b11ae1") {
    return "application/msword";
  }

  return null;
}

const COMPATIBLE_MIMES: Record<string, string[]> = {
  "application/pdf": ["application/pdf"],
  "image/jpeg": ["image/jpeg", "image/jpg"],
  "image/png": ["image/png"],
  "image/webp": ["image/webp"],
  "image/gif": ["image/gif"],
  "image/svg+xml": ["image/svg+xml", "text/xml", "application/xml"],
  "video/mp4": ["video/mp4"],
  "video/webm": ["video/webm"],
  "application/msword": ["application/msword"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
  ],
  "application/vnd.ms-excel": ["application/vnd.ms-excel"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
  ],
};

export function validateUploadContent(buffer: Buffer, claimedMime: string, filename: string): string {
  const sniffed = sniffMimeType(buffer);

  if (sniffed === "application/x-msdownload") {
    throw new Error(
      `"${filename}" is a Windows program (.exe), not a document. Upload a real PDF or Office file.`
    );
  }

  if (claimedMime === "application/pdf" && sniffed !== "application/pdf") {
    throw new Error(
      `"${filename}" is not a valid PDF. Upload a real PDF file (must start with %PDF).`
    );
  }

  if (!sniffed) {
    return claimedMime;
  }

  const allowed = COMPATIBLE_MIMES[claimedMime];
  if (allowed && !allowed.includes(sniffed) && sniffed !== claimedMime) {
    const ext = filename.split(".").pop()?.toLowerCase();
    throw new Error(
      `"${filename}" does not match its file type (detected ${sniffed}, expected ${claimedMime}). ` +
        `A .${ext} file must contain valid ${claimedMime} data.`
    );
  }

  return sniffed;
}
