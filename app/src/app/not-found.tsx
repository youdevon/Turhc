import Link from "next/link";
import { SiteHeader } from "@/components/public/SiteHeader";
import { Footer } from "@/components/public/Footer";
import { getLogoUrlForBackground } from "@/lib/header-config";
import { getSiteSettingsResolvedFresh } from "@/lib/settings";
import { parseThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default async function NotFound() {
  const settings = await getSiteSettingsResolvedFresh();
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
        <section className="section-padding min-h-[50vh] flex items-center blueprint-grid">
          <div className="container-wide max-w-xl mx-auto text-center">
            <p className="public-section-heading__eyebrow justify-center">
              <span className="public-section-heading__eyebrow-line" aria-hidden="true" />
              <span className="public-section-heading__eyebrow-text">404</span>
            </p>
            <h1 className="public-page-hero-title mb-4">Page not found</h1>
            <p className="public-body-text mb-8">
              The page you are looking for may have moved or no longer exists.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
            >
              Return to homepage
            </Link>
          </div>
        </section>
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
