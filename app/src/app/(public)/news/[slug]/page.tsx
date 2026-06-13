import { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsDetailView } from "@/components/public/NewsDetailView";
import { getNewsBySlug } from "@/lib/data";
import { getSiteSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  return { title: post?.title ?? "News" };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getNewsBySlug(slug), getSiteSettings()]);
  if (!post) notFound();

  return <NewsDetailView post={post} settings={settings} />;
}
