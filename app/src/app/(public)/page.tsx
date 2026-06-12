import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { getLandingPageContent } from "@/lib/landing-page";
import { LandingPageV2View } from "@/components/public/LandingPageV2View";

export async function generateMetadata(): Promise<Metadata> {
  const landing = await getLandingPageContent();
  const settings = await getSiteSettings();

  return {
    title: landing.metaTitle ?? settings.orgName,
    description: landing.metaDescription ?? settings.orgTagline ?? undefined,
  };
}

export default async function HomePage() {
  return LandingPageV2View({ mode: "public" });
}
