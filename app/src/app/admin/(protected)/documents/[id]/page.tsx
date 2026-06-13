import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDeleteForm } from "@/components/admin/AdminDeleteForm";
import { DocumentForm } from "@/components/admin/forms/DocumentForm";
import { deleteDocument } from "@/lib/cms-actions";
import { mergeWithDraft } from "@/lib/content-draft";

type Props = { params: Promise<{ id: string }> };

export default async function EditDocumentPage({ params }: Props) {
  const { id } = await params;
  const raw = await prisma.document.findUnique({ where: { id } });
  if (!raw) notFound();

  const { hasDraft, ...document } = mergeWithDraft(raw, raw.draftData);

  return (
    <>
      <AdminHeader
        title={document.title}
        breadcrumbs={[
          { label: "Documents", href: "/admin/documents" },
          { label: document.title },
        ]}
        actions={
          <AdminDeleteForm action={deleteDocument.bind(null, id)} itemLabel={`"${document.title}"`} />
        }
      />
      <DocumentForm document={document} hasDraft={hasDraft} />
    </>
  );
}
