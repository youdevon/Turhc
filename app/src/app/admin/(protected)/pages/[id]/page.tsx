import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageForm } from "@/components/admin/forms/PageForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { mergeWithDraft } from "@/lib/content-draft";

type Props = { params: Promise<{ id: string }> };

export default async function EditPagePage({ params }: Props) {
  const { id } = await params;
  const raw = await prisma.page.findUnique({ where: { id } });
  if (!raw) notFound();
  const { hasDraft, ...page } = mergeWithDraft(raw, raw.draftData);

  return (
    <>
      <AdminHeader
        title={page.title}
        breadcrumbs={[{ label: "Pages", href: "/admin/pages" }, { label: page.title }]}
      />
      <PageForm page={page} hasDraft={hasDraft} />
    </>
  );
}
