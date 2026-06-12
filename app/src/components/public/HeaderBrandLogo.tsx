"use client";

import { cn } from "@/lib/utils";
import type { ResolvedHeaderLogo } from "@/lib/header-logo";
import { shouldCrossfadeLogos } from "@/lib/header-logo";
import { HeaderLogo } from "./HeaderLogo";

type Props = {
  resolved: ResolvedHeaderLogo | null;
  alt: string;
  variant: "desktop" | "mobile" | "drawer";
  priority?: boolean;
};

export function HeaderBrandLogo({ resolved, alt, variant, priority = false }: Props) {
  if (!resolved?.asset) return null;

  const crossfade = shouldCrossfadeLogos(resolved);
  const { whiteAsset, coloredAsset, variant: activeVariant, renderAsDarkOnLight } = resolved;

  if (!crossfade) {
    return (
      <HeaderLogo
        src={resolved.asset.url}
        alt={alt}
        width={resolved.asset.width}
        height={resolved.asset.height}
        mimeType={resolved.asset.mimeType}
        variant={variant}
        priority={priority}
        renderAsDarkOnLight={renderAsDarkOnLight}
      />
    );
  }

  const whiteActive = activeVariant === "white";
  const coloredActive = activeVariant === "colored";

  return (
    <span className={cn("site-header__logo-stack", `site-header__logo-stack--${variant}`)}>
      {whiteAsset?.url && (
        <HeaderLogo
          src={whiteAsset.url}
          alt={alt}
          width={whiteAsset.width}
          height={whiteAsset.height}
          mimeType={whiteAsset.mimeType}
          variant={variant}
          priority={priority}
          stacked
          active={whiteActive}
          layerVariant="white"
        />
      )}
      {coloredAsset?.url && coloredAsset.url !== whiteAsset?.url && (
        <HeaderLogo
          src={coloredAsset.url}
          alt={alt}
          width={coloredAsset.width}
          height={coloredAsset.height}
          mimeType={coloredAsset.mimeType}
          variant={variant}
          priority={priority}
          stacked
          active={coloredActive}
          layerVariant="colored"
        />
      )}
    </span>
  );
}
