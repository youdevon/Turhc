import { SiteHeader } from "@/components/public/SiteHeader";
import { Footer } from "@/components/public/Footer";
import { getLogoUrlForBackground } from "@/lib/header-config";
import { getSiteSettingsResolved } from "@/lib/settings";
import { parseThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettingsResolved();
  const isLightTheme = parseThemeMode(settings.activeTheme) === "light";
  const footerLogoUrl = getLogoUrlForBackground(settings, isLightTheme ? "light" : "dark");

  return (
    <>
      <SiteHeader settings={settings} />
      <main
        className={cn(
          "site-main site-canvas min-w-0 overflow-x-clip",
          isLightTheme && "site-texture"
        )}
      >
        {children}
      </main>
      <Footer
        orgName={settings.orgName}
        logoUrl={footerLogoUrl}
        footerText={settings.footerText}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        contactAddress={settings.contactAddress}
      />
    </>
  );
}
