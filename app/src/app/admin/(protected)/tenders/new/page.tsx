import { TenderForm } from "@/components/admin/forms/TenderForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function NewTenderPage() {
  return (
    <>
      <AdminHeader title="New Tender" breadcrumbs={[{ label: "Tenders", href: "/admin/tenders" }, { label: "New" }]} />
      <TenderForm />
    </>
  );
}
