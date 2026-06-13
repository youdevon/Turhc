import { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsDetailView } from "@/components/public/NewsDetailView";
import { getNewsForPreview } from "@/lib/content-preview";
import { getSiteSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsForPreview(slug);
  return { title: post?.title ?? "News Preview" };
}

export default async function PreviewNewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getNewsForPreview(slug), getSiteSettings()]);
  if (!post) notFound();

  return <NewsDetailView post={post} settings={settings} />;
}
