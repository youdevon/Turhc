import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";

loadEnv();

function devOriginsFromEnv(): string[] {
  const origins = new Set<string>(["localhost", "127.0.0.1"]);
  for (const raw of [process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL]) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      // Next.js compares hostname only (not host:port) for allowedDevOrigins
      origins.add(url.hostname);
    } catch {
      // ignore malformed URLs
    }
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: devOriginsFromEnv(),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    unoptimized: process.env.NODE_ENV === "development",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  async redirects() {
    return [
      {
        source: "/landing-v2",
        destination: "/",
        permanent: true,
      },
      {
        source: "/landing-classic",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
