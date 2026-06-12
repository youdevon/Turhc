import { AdminHeader } from "@/components/admin/AdminHeader";
import { HomepageEditor } from "@/components/admin/forms/LandingPageEditor";
import { getLandingPageContent } from "@/lib/landing-page";
import { getLandingV2PageContent } from "@/lib/landing-page-v2";

export default async function HomepageAdmin() {
  const [content, v2Content] = await Promise.all([
    getLandingPageContent("admin"),
    getLandingV2PageContent("admin"),
  ]);

  return (
    <>
      <AdminHeader
        title="Homepage"
        description="Manage the live homepage — pre-hero, hero slides, section copy, statistics, and calls-to-action."
        breadcrumbs={[{ label: "Homepage" }]}
      />
      <HomepageEditor initialContent={content} initialV2Content={v2Content} />
    </>
  );
}
