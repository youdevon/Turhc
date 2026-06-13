import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TenderDetailView } from "@/components/public/TenderDetailView";
import { getTenderForPreview } from "@/lib/content-preview";
import { getSiteSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tender = await getTenderForPreview(slug);
  return { title: tender?.title ?? "Tender Preview" };
}

export default async function PreviewTenderDetailPage({ params }: Props) {
  const { slug } = await params;
  const [tender, settings] = await Promise.all([getTenderForPreview(slug), getSiteSettings()]);
  if (!tender) notFound();

  return <TenderDetailView tender={tender} settings={settings} />;
}
