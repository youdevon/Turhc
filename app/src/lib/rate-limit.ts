import { prisma } from "./db";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 10;

export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export async function checkRateLimit(
  key: string,
  options?: { maxRequests?: number; windowMs?: number }
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const maxRequests = options?.maxRequests ?? MAX_REQUESTS;
  const windowMs = options?.windowMs ?? WINDOW_MS;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });

    if (!existing || existing.resetAt <= now) {
      await prisma.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { allowed: true };
    }

    if (existing.count >= maxRequests) {
      return { allowed: false, retryAfterMs: existing.resetAt.getTime() - now.getTime() };
    }

    await prisma.rateLimitBucket.update({
      where: { key },
      data: { count: existing.count + 1 },
    });

    return { allowed: true };
  } catch (error) {
    console.error("Rate limit check failed, allowing request:", error);
    return { allowed: true };
  }
}

/** Remove expired buckets (optional maintenance). */
export async function pruneRateLimitBuckets(): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: new Date() } },
  });
}
