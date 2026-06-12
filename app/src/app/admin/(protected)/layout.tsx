import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminProtectedShell } from "@/components/admin/AdminProtectedShell";
import { AdminAuthLoading } from "@/components/admin/AdminAuthLoading";
import { getUnreadEnquiryCount } from "@/lib/enquiry-service";
import { getSiteSettingsResolved } from "@/lib/settings";
import { getLogoUrlForBackground } from "@/lib/header-config";
import { parseThemeMode } from "@/lib/theme";

export const dynamic = "force-dynamic";

async function ProtectedAdminShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/admin/login");
  }

  const [unreadEnquiries, settings] = await Promise.all([
    getUnreadEnquiryCount().catch(() => 0),
    getSiteSettingsResolved().catch(() => null),
  ]);

  const siteTheme = parseThemeMode(settings?.activeTheme);
  const logoUrl = settings
    ? getLogoUrlForBackground(settings, siteTheme === "light" ? "light" : "dark")
    : null;

  return (
    <AdminProtectedShell
      unreadEnquiries={unreadEnquiries}
      userRole={session.user.role}
      userName={session.user.name}
      userEmail={session.user.email}
      logoUrl={logoUrl}
    >
      {children}
    </AdminProtectedShell>
  );
}

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminAuthLoading />}>
      <ProtectedAdminShell>{children}</ProtectedAdminShell>
    </Suspense>
  );
}
