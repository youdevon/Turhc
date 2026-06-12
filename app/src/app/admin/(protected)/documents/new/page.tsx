import { AdminHeader } from "@/components/admin/AdminHeader";
import { DocumentForm } from "@/components/admin/forms/DocumentForm";

export default function NewDocumentPage() {
  return (
    <>
      <AdminHeader
        title="New Document"
        breadcrumbs={[
          { label: "Documents", href: "/admin/documents" },
          { label: "New" },
        ]}
      />
      <DocumentForm />
    </>
  );
}
