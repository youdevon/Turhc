import { NewsForm } from "@/components/admin/forms/NewsForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function NewNewsPage() {
  return (
    <>
      <AdminHeader
        title="New Post"
        breadcrumbs={[{ label: "News & Notices", href: "/admin/news" }, { label: "New" }]}
      />
      <NewsForm />
    </>
  );
}
