/** Read intrinsic pixel dimensions from common image buffers (no external deps). */
export function getImageDimensions(
  buffer: Buffer,
  mimeType: string
): { width: number; height: number } | null {
  if (mimeType === "image/png" && buffer.length >= 24) {
    const sig = buffer.toString("ascii", 1, 4);
    if (sig === "PNG") {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
  }

  if ((mimeType === "image/jpeg" || mimeType === "image/jpg") && buffer.length > 4) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      const len = buffer.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }

  if (mimeType === "image/webp" && buffer.length >= 30) {
    const riff = buffer.toString("ascii", 0, 4);
    const webp = buffer.toString("ascii", 8, 12);
    if (riff === "RIFF" && webp === "WEBP") {
      const chunk = buffer.toString("ascii", 12, 16);
      if (chunk === "VP8 ") {
        return {
          width: buffer.readUInt16LE(26) & 0x3fff,
          height: buffer.readUInt16LE(28) & 0x3fff,
        };
      }
      if (chunk === "VP8L" && buffer.length >= 25) {
        const bits = buffer.readUInt32LE(21);
        return {
          width: (bits & 0x3fff) + 1,
          height: ((bits >> 14) & 0x3fff) + 1,
        };
      }
    }
  }

  return null;
}

export function isSvgMime(mimeType: string, url?: string): boolean {
  if (mimeType === "image/svg+xml") return true;
  return !!url?.toLowerCase().endsWith(".svg");
}
