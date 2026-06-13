import { AdminHeader } from "@/components/admin/AdminHeader";
import { AboutPageEditor } from "@/components/admin/forms/AboutPageEditor";
import { getAboutPageContent } from "@/lib/about-page";

export default async function AdminAboutPage() {
  const content = await getAboutPageContent("admin");

  return (
    <>
      <AdminHeader
        title="About Page"
        description="Manage the public About page — hero, copy, vision & mission, images, statistics, and leadership intro."
        breadcrumbs={[{ label: "About Page" }]}
      />
      <AboutPageEditor initialContent={content} />
    </>
  );
}
