import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDeleteForm } from "@/components/admin/AdminDeleteForm";
import { LeadershipMemberForm } from "@/components/admin/forms/LeadershipMemberForm";
import { deleteLeadershipMember } from "@/lib/cms-actions";
import { mergeWithDraft } from "@/lib/content-draft";

type Props = { params: Promise<{ id: string }> };

export default async function EditLeadershipMemberPage({ params }: Props) {
  const { id } = await params;
  const raw = await prisma.leadershipMember.findUnique({
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
          { label: "Leadership", href: "/admin/leadership" },
          { label: member.name },
        ]}
        actions={
          <AdminDeleteForm
            action={deleteLeadershipMember.bind(null, id)}
            itemLabel={`leadership member "${member.name}"`}
          />
        }
      />
      <LeadershipMemberForm member={member} hasDraft={hasDraft} />
    </>
  );
}
