import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TenderForm } from "@/components/admin/forms/TenderForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDeleteForm } from "@/components/admin/AdminDeleteForm";
import { deleteTender } from "@/lib/cms-actions";

type Props = { params: Promise<{ id: string }> };

export default async function EditTenderPage({ params }: Props) {
  const { id } = await params;
  const tender = await prisma.tender.findUnique({ where: { id } });
  if (!tender) notFound();

  return (
    <>
      <AdminHeader
        title={tender.title}
        breadcrumbs={[{ label: "Tenders", href: "/admin/tenders" }, { label: tender.referenceNumber }]}
        actions={
          <AdminDeleteForm action={deleteTender.bind(null, id)} itemLabel={`"${tender.title}"`} />
        }
      />
      <TenderForm tender={tender} />
    </>
  );
}
