import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDeleteForm } from "@/components/admin/AdminDeleteForm";
import { BoardMemberForm } from "@/components/admin/forms/BoardMemberForm";
import { deleteBoardMember } from "@/lib/cms-actions";
import { mergeWithDraft } from "@/lib/content-draft";

type Props = { params: Promise<{ id: string }> };

export default async function EditBoardMemberPage({ params }: Props) {
  const { id } = await params;
  const raw = await prisma.boardMember.findUnique({
    where: { id },
    include: { photo: true },
  });
  if (!raw) notFound();
  const { hasDraft, ...member } = mergeWithDraft(raw, raw.draftData);

  return (
    <>
      <AdminHeader
        title={member.name}
        breadcrumbs={[
          { label: "Board", href: "/admin/board" },
          { label: member.name },
        ]}
        actions={
          <AdminDeleteForm
            action={deleteBoardMember.bind(null, id)}
            itemLabel={`board member "${member.name}"`}
          />
        }
      />
      <BoardMemberForm member={member} hasDraft={hasDraft} />
    </>
  );
}
