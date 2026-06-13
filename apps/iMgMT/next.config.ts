import type { NextConfig } from "next";

function devOriginsFromEnv(): string[] {
  const origins = new Set<string>(["localhost", "127.0.0.1"]);
  for (const raw of [process.env.IMGMT_URL, process.env.NEXTAUTH_URL]) {
    if (!raw) continue;
    try {
      origins.add(new URL(raw).hostname);
    } catch {
      // ignore malformed URLs
    }
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: devOriginsFromEnv(),
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
