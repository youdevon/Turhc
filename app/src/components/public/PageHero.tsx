import { PreviewAwareLink } from "./PreviewAwareLink";
import { ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FramedImage } from "./FramedImage";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlt?: string;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  overlayStrength?: number;
  breadcrumbs?: BreadcrumbItem[];
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  subtitle,
  imageUrl,
  imageAlt = "",
  imageFocusX,
  imageFocusY,
  imageZoom,
  overlayStrength = 0.55,
  breadcrumbs,
  ctaLabel,
  ctaHref,
  className,
}: Props) {
  const overlay = Math.min(0.9, Math.max(0.2, overlayStrength));

  return (
    <section
      data-page-hero
      data-dark-header-surface
      className={cn(
        "page-hero relative w-full overflow-hidden",
        "min-h-[220px] sm:min-h-[280px] lg:min-h-[340px]",
        className
      )}
      aria-label={title}
    >
      <FramedImage
        src={imageUrl}
        alt={imageAlt || title}
        className="page-hero__image absolute inset-0 w-full h-full object-cover"
        loading="eager"
        imageFocusX={imageFocusX}
        imageFocusY={imageFocusY}
        imageZoom={imageZoom}
      />
      <div
        className="page-hero__overlay absolute inset-0"
        style={{
          background: `linear-gradient(
            to top,
            rgba(0, 0, 0, ${overlay + 0.15}) 0%,
            rgba(0, 0, 0, ${overlay}) 45%,
            rgba(0, 0, 0, ${overlay * 0.65}) 100%
          )`,
        }}
      />
      <div className="relative z-10 flex min-h-[inherit] flex-col justify-end container-wide px-4 md:px-6 pb-8 md:pb-10 pt-8 md:pt-10">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-white/70">
            {breadcrumbs.map((item, i) => (
              <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                {item.href ? (
                  <PreviewAwareLink href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </PreviewAwareLink>
                ) : (
                  <span className="text-white/90">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="public-hero-eyebrow">{eyebrow}</p>}
        <h1 className="public-page-hero-title text-white max-w-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-sm sm:text-[0.9375rem] text-white/85 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {ctaLabel && ctaHref && (
          <PreviewAwareLink
            href={ctaHref}
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </PreviewAwareLink>
        )}
      </div>
    </section>
  );
}
