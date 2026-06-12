import Image from "next/image";
import { isSvgMime } from "@/lib/image-dimensions";
import { cn } from "@/lib/utils";

export type HeaderLogoProps = {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  variant: "desktop" | "mobile" | "drawer";
  priority?: boolean;
  /** Stacked crossfade layer (white + colored variants) */
  stacked?: boolean;
  active?: boolean;
  /** Force dark silhouette when only a white mark is available on a light header */
  renderAsDarkOnLight?: boolean;
  layerVariant?: "white" | "colored";
};

function variantClass(
  variant: HeaderLogoProps["variant"],
  stacked?: boolean,
  active?: boolean,
  renderAsDarkOnLight?: boolean,
  layerVariant?: "white" | "colored"
): string {
  const base =
    variant === "desktop"
      ? "header-logo header-logo--desktop"
      : variant === "mobile"
        ? "header-logo header-logo--mobile"
        : "header-logo header-logo--drawer";

  return cn(
    base,
    stacked && "header-logo--stacked",
    stacked && active && "header-logo--active",
    layerVariant === "white" && "header-logo--white-variant",
    layerVariant === "colored" && "header-logo--colored-variant",
    renderAsDarkOnLight && "header-logo--render-dark-on-light"
  );
}

/**
 * Crisp header logo — fixed CSS height, auto width, no filters or scale animations.
 * SVG and unknown dimensions use native img; raster uses unoptimized Image at source resolution.
 */
export function HeaderLogo({
  src,
  alt,
  width,
  height,
  mimeType,
  variant,
  priority = false,
  stacked = false,
  active = true,
  renderAsDarkOnLight = false,
  layerVariant,
}: HeaderLogoProps) {
  const className = variantClass(variant, stacked, active, renderAsDarkOnLight, layerVariant);
  const useNative =
    isSvgMime(mimeType ?? "", src) || !width || !height || width <= 0 || height <= 0;

  if (useNative) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} decoding="async" />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={100}
      unoptimized
      className={className}
    />
  );
}
