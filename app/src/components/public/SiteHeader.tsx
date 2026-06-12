import { getHeaderConfig, type HeaderConfig } from "@/lib/header-config";
import type { SiteSettingsResolved } from "@/lib/settings";
import { Header } from "./Header";

function headerConfigKey(config: HeaderConfig): string {
  return [
    config.theme,
    config.brandLayoutMode,
    config.logoVariantMode,
    config.brandDisplayText,
    config.logoMain?.url,
    config.logoWhite?.url,
    config.logoColored?.url,
    config.logoCompact?.url,
    config.logoCompactWhite?.url,
    config.logoAlt,
    config.logoHeightDesktop,
    config.logoHeightMobile,
    config.logoMaxWidthDesktop,
    config.logoMaxWidthMobile,
    config.brandZoneWidthDesktop,
    config.showContractorHeaderCta,
    config.showHamburgerDesktop,
    JSON.stringify(config.navLinks),
  ].join("|");
}

type Props = {
  settings: SiteSettingsResolved;
};

export function SiteHeader({ settings }: Props) {
  const config = getHeaderConfig(settings);
  return <Header key={headerConfigKey(config)} config={config} />;
}
