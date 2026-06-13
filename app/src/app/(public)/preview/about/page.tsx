import type { Metadata } from "next";
import { AboutPageView, generateAboutMetadata } from "../../about/page";

export async function generateMetadata(): Promise<Metadata> {
  return generateAboutMetadata("preview");
}

export default async function PreviewAboutPage() {
  return AboutPageView({ mode: "preview" });
}
