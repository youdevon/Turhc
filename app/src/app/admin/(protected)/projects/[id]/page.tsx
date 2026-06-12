import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectForm } from "@/components/admin/forms/ProjectForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDeleteForm } from "@/components/admin/AdminDeleteForm";
import { deleteProject } from "@/lib/cms-actions";
import { mergeWithDraft } from "@/lib/content-draft";

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const raw = await prisma.project.findUnique({ where: { id } });
  if (!raw) notFound();

  const { hasDraft, ...project } = mergeWithDraft(raw, raw.draftData);

  return (
    <>
      <AdminHeader
        title={project.title}
        breadcrumbs={[{ label: "Projects", href: "/admin/projects" }, { label: project.title }]}
        actions={
          <AdminDeleteForm action={deleteProject.bind(null, id)} itemLabel={`"${project.title}"`} />
        }
      />
      <ProjectForm project={project} hasDraft={hasDraft} />
    </>
  );
}
