import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NewsForm } from "@/components/admin/forms/NewsForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDeleteForm } from "@/components/admin/AdminDeleteForm";
import { deleteNews } from "@/lib/cms-actions";
import { mergeWithDraft } from "@/lib/content-draft";

type Props = { params: Promise<{ id: string }> };

export default async function EditNewsPage({ params }: Props) {
  const { id } = await params;
  const raw = await prisma.newsPost.findUnique({
    where: { id },
    include: { featuredImage: { select: { url: true } } },
  });
  if (!raw) notFound();

  const { hasDraft, ...post } = mergeWithDraft(raw, raw.draftData);

  return (
    <>
      <AdminHeader
        title={post.title}
        breadcrumbs={[{ label: "News & Notices", href: "/admin/news" }, { label: post.title }]}
        actions={<AdminDeleteForm action={deleteNews.bind(null, id)} itemLabel={`"${post.title}"`} />}
      />
      <NewsForm post={post} hasDraft={hasDraft} />
    </>
  );
}
