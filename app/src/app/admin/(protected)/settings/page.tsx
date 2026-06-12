import { AdminHeader } from "@/components/admin/AdminHeader";
import { SettingsForm } from "@/components/admin/forms/SettingsForm";
import { getSiteSettingsResolvedFresh } from "@/lib/settings";
import { assertAdministratorPage } from "@/lib/admin-roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSettingsPage() {
  await assertAdministratorPage();
  const rawSettings = await getSiteSettingsResolvedFresh();
  const smtpPasswordConfigured = Boolean(rawSettings.smtpPassword?.trim());
  const settings = { ...rawSettings, smtpPassword: "" };

  return (
    <>
      <AdminHeader
        title="Site Settings"
        description="Manage appearance, organisation details, and site-wide options."
        breadcrumbs={[{ label: "Site Settings" }]}
      />
      <SettingsForm
        settings={settings}
        isAdministrator
        smtpPasswordConfigured={smtpPasswordConfigured}
      />
    </>
  );
}
