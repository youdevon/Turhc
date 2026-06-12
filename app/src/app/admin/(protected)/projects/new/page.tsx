import { ProjectForm } from "@/components/admin/forms/ProjectForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function NewProjectPage() {
  return (
    <>
      <AdminHeader title="New Project" breadcrumbs={[{ label: "Projects", href: "/admin/projects" }, { label: "New" }]} />
      <ProjectForm />
    </>
  );
}
