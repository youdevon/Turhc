import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TenderForm } from "@/components/admin/forms/TenderForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDeleteForm } from "@/components/admin/AdminDeleteForm";
import { deleteTender } from "@/lib/cms-actions";
import { mergeWithDraft } from "@/lib/content-draft";

type Props = { params: Promise<{ id: string }> };

export default async function EditTenderPage({ params }: Props) {
  const { id } = await params;
  const raw = await prisma.tender.findUnique({ where: { id } });
  if (!raw) notFound();

  const { hasDraft, ...tender } = mergeWithDraft(raw, raw.draftData);

  return (
    <>
      <AdminHeader
        title={tender.title}
        breadcrumbs={[{ label: "Tenders", href: "/admin/tenders" }, { label: tender.referenceNumber }]}
        actions={
          <AdminDeleteForm action={deleteTender.bind(null, id)} itemLabel={`"${tender.title}"`} />
        }
      />
      <TenderForm tender={tender} hasDraft={hasDraft} />
    </>
  );
}
