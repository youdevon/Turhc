import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TenderDetailView } from "@/components/public/TenderDetailView";
import { getTenderBySlug } from "@/lib/data";
import { getSiteSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tender = await getTenderBySlug(slug);
  return { title: tender?.title ?? "Tender" };
}

export default async function TenderDetailPage({ params }: Props) {
  const { slug } = await params;
  const [tender, settings] = await Promise.all([getTenderBySlug(slug), getSiteSettings()]);
  if (!tender) notFound();

  return <TenderDetailView tender={tender} settings={settings} />;
}
