import { PageForm } from "@/components/admin/forms/PageForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function NewPagePage() {
  return (
    <>
      <AdminHeader title="New Page" breadcrumbs={[{ label: "Pages", href: "/admin/pages" }, { label: "New" }]} />
      <PageForm />
    </>
  );
}
