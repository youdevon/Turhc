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
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.unsplash.com" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
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
      {
        source: "/admin/hero-slides",
        destination: "/admin/landing-page-v2",
        permanent: false,
      },
      {
        source: "/admin/hero-slides/:path*",
        destination: "/admin/landing-page-v2",
        permanent: false,
      },
      {
        source: "/admin/landing-page",
        destination: "/admin/landing-page-v2",
        permanent: false,
      },
      {
        source: "/admin/audit-logs",
        destination: "/admin/audit-log",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
