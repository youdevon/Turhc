import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { ToastProvider } from "@/components/Providers";
import { UiSoundProvider } from "@/components/ui/UiSoundProvider";
import { resolveBrandDisplayText } from "@/lib/header-config";
import { getSiteSettings } from "@/lib/settings";
import { buildThemeInlineStyle, getAppearanceFromSettings, parseThemeMode } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const brand = resolveBrandDisplayText(settings);

  return {
    title: {
      default: settings.orgName,
      template: `%s | ${brand}`,
    },
    description: settings.orgTagline || "Government-owned infrastructure delivery for the nation.",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const appearance = getAppearanceFromSettings(settings);
  const theme = parseThemeMode(settings.activeTheme);
  const themeStyle = buildThemeInlineStyle(appearance);

  return (
    <html lang="en" data-theme={theme} style={themeStyle}>
      <body className={`${inter.variable} ${sourceSerif.variable} font-sans`}>
        {children}
        <UiSoundProvider />
        <ToastProvider />
      </body>
    </html>
  );
}
