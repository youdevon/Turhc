"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FramedImage } from "./FramedImage";
import type { HeroSlide } from "@/data/hero-slides";
import type { LandingHeroLayout } from "@/lib/landing-page";

const DEFAULT_SLIDE_INTERVAL_MS = 5000;
const DEFAULT_FADE_DURATION_MS = 1400;
const DEFAULT_ZOOM_DURATION_MS = 10000;

type Props = {
  slides: HeroSlide[];
  layout?: LandingHeroLayout;
  heroOverlayDarkness?: number;
  slideIntervalMs?: number;
  fadeDurationMs?: number;
  zoomDurationMs?: number;
  enabled?: boolean;
  /** Media slideshow only — no slide copy, CTAs, or dots (for pre-hero overlay scenes). */
  backgroundOnly?: boolean;
  /** Full-width hero extends behind the site header; add top padding for nav clearance. */
  underHeader?: boolean;
};

function heroOverlayBackground(opacity: number): string {
  return [
    `linear-gradient(to bottom, rgba(0,0,0,${opacity * 0.32}) 0%, transparent 42%)`,
    `linear-gradient(105deg, rgba(0,0,0,${Math.min(opacity + 0.18, 0.9)}) 0%, rgba(0,0,0,${opacity * 0.72}) 38%, rgba(0,0,0,${opacity * 0.38}) 72%, rgba(0,0,0,${opacity * 0.28}) 100%)`,
  ].join(", ");
}

export function HeroCarousel({
  slides,
  layout = "contained",
  heroOverlayDarkness = 0.55,
  slideIntervalMs = DEFAULT_SLIDE_INTERVAL_MS,
  fadeDurationMs = DEFAULT_FADE_DURATION_MS,
  zoomDurationMs = DEFAULT_ZOOM_DURATION_MS,
  enabled = true,
  backgroundOnly = false,
  underHeader = false,
}: Props) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const zoomRefs = useRef<(HTMLDivElement | null)[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRef = useRef(0);

  const isContained = layout !== "full_width";
  const overlayOpacity = Math.min(1, Math.max(0.25, heroOverlayDarkness));

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const kenBurnsDurationMs = Math.max(zoomDurationMs, slideIntervalMs + fadeDurationMs);

  const restartZoom = useCallback(
    (index: number) => {
      if (reducedMotion) return;
      const el = zoomRefs.current[index];
      if (!el) return;
      el.style.setProperty("--hero-ken-burns-duration", `${kenBurnsDurationMs}ms`);
      el.classList.remove("hero-ken-burns");
      void el.offsetWidth;
      el.classList.add("hero-ken-burns");
    },
    [reducedMotion, kenBurnsDurationMs]
  );

  const transitionTo = useCallback(
    (nextIndex: number) => {
      if (slides.length === 0) return;
      const normalized = ((nextIndex % slides.length) + slides.length) % slides.length;
      if (normalized === currentRef.current) return;

      const outgoing = currentRef.current;
      setPrev(outgoing);
      setCurrent(normalized);

      requestAnimationFrame(() => restartZoom(normalized));

      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => setPrev(null), fadeDurationMs);
    },
    [slides.length, restartZoom, fadeDurationMs]
  );

  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!enabled || slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      transitionTo(currentRef.current + 1);
    }, slideIntervalMs);
  }, [slides.length, transitionTo, enabled, slideIntervalMs]);

  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [resetInterval]);

  const goTo = useCallback(
    (index: number) => {
      transitionTo(index);
      resetInterval();
    },
    [transitionTo, resetInterval]
  );

  useEffect(() => {
    if (!reducedMotion) restartZoom(0);
  }, [reducedMotion, restartZoom]);

  if (!slides.length) {
    return (
      <section
        data-page-hero
        data-dark-header-surface
        className={cn(
          isContained ? "hero-section" : "hero-section hero-section--full public-media-16x9 w-full",
          "hero-empty-bg flex items-center justify-center"
        )}
      >
        <div className={cn(isContained && "hero-section__wrap w-full", !isContained && "absolute inset-0 flex items-center justify-center")}>
          <div
            className={cn(
              isContained && "hero-contained hero-contained--empty",
              !isContained && "w-full"
            )}
          >
            <div className="text-center px-6 sm:px-8 max-w-3xl mx-auto text-[var(--header-text-over-hero)]">
              <p className="text-accent text-sm uppercase tracking-widest mb-4">State Enterprise</p>
              <h1 className="public-hero-title mb-4">Building National Infrastructure</h1>
              <p className="text-base max-w-2xl mx-auto opacity-90">
                Delivering critical public infrastructure with transparency and excellence.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  const mediaLayer = (
    <div className="hero-contained__media" aria-hidden="true">
      {slides.map((s, i) => {
        const isCurrent = i === current;
        const isPrev = i === prev;
        const isVisible = isCurrent || isPrev;

        if (!isVisible) return null;

        return (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 overflow-hidden ease-in-out",
              isCurrent && "opacity-100 z-[2]",
              isPrev && "opacity-0 z-[1]"
            )}
            style={{ transition: `opacity ${fadeDurationMs}ms ease-in-out` }}
          >
            <div
              ref={(el) => {
                zoomRefs.current[i] = el;
              }}
              className={cn(
                "absolute inset-0 overflow-hidden",
                !reducedMotion && "hero-ken-burns"
              )}
              style={
                !reducedMotion
                  ? ({ "--hero-ken-burns-duration": `${kenBurnsDurationMs}ms` } as CSSProperties)
                  : undefined
              }
            >
              <FramedImage
                src={s.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                imageFocusX={s.imageFocusX}
                imageFocusY={s.imageFocusY}
                imageZoom={s.imageZoom}
              />
            </div>
          </div>
        );
      })}

      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{ background: heroOverlayBackground(overlayOpacity) }}
      />
      <div className="absolute inset-0 z-[3] bg-primary/10 mix-blend-multiply pointer-events-none" />
    </div>
  );

  const contentBlock = (
    <div className="hero-contained__content">
      <div key={`content-${slide.id}`} className="max-w-3xl">
        <p className="text-xs sm:text-sm uppercase tracking-[0.18em] mb-3 sm:mb-4 font-medium" style={{ color: "var(--gold)" }}>
          {slide.eyebrow}
        </p>
        <h1 className="public-hero-title text-white mb-4 sm:mb-5">
          {slide.title}
        </h1>
        <p className="text-sm sm:text-[0.9375rem] text-white/85 mb-6 sm:mb-8 max-w-2xl leading-relaxed text-pretty">
          {slide.subtitle}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={slide.primaryButtonUrl}
            className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors"
          >
            {slide.primaryButtonLabel}
          </Link>
          <Link
            href={slide.secondaryButtonUrl}
            className="px-6 py-3 rounded-lg border border-white/35 hover:border-[var(--gold)] text-white hover:text-[var(--gold)] text-sm font-medium transition-colors"
          >
            {slide.secondaryButtonLabel}
          </Link>
        </div>
      </div>
    </div>
  );

  const indicatorButtons = slides.map((s, i) => (
    <button
      key={s.id}
      type="button"
      onClick={() => goTo(i)}
      className={cn(
        "h-2 rounded-full transition-all duration-300",
        i === current ? "hero-dot-active w-8" : "hero-dot-inactive w-2"
      )}
      aria-label={`Go to slide ${i + 1}: ${s.title}`}
      aria-current={i === current ? "true" : undefined}
    />
  ));

  if (!isContained) {
    return (
      <section
        data-page-hero
        data-dark-header-surface
        className={cn(
          "hero-section hero-section--full public-media-16x9 relative w-full overflow-hidden bg-background",
          backgroundOnly && "hero-section--background-only"
        )}
      >
        <div className="absolute inset-0">{mediaLayer}</div>
        {!backgroundOnly && (
          <>
            <div
              className={cn(
                "absolute inset-0 z-10 flex flex-col justify-center container-wide px-4 sm:px-5 md:px-6 pb-12 sm:pb-16 md:pb-20",
                underHeader
                  ? "pt-[calc(var(--header-height)+2.5rem)] sm:pt-[calc(var(--header-height)+3rem)] md:pt-[calc(var(--header-height)+3.5rem)]"
                  : "pt-10 sm:pt-12 md:pt-14"
              )}
            >
              <div key={`content-${slide.id}`} className="max-w-3xl">
                <p className="text-xs sm:text-sm uppercase tracking-[0.18em] mb-3 sm:mb-4 font-medium" style={{ color: "var(--gold)" }}>
                  {slide.eyebrow}
                </p>
                <h1 className="public-hero-title text-white mb-4 sm:mb-6">
                  {slide.title}
                </h1>
                <p className="text-sm sm:text-[0.9375rem] text-white/85 mb-6 sm:mb-8 max-w-2xl leading-relaxed text-pretty">
                  {slide.subtitle}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={slide.primaryButtonUrl}
                    className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors"
                  >
                    {slide.primaryButtonLabel}
                  </Link>
                  <Link
                    href={slide.secondaryButtonUrl}
                    className="px-6 py-3 rounded-lg border border-white/35 hover:border-[var(--gold)] text-white hover:text-[var(--gold)] text-sm font-medium transition-colors"
                  >
                    {slide.secondaryButtonLabel}
                  </Link>
                </div>
              </div>
            </div>
            {slides.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {indicatorButtons}
              </div>
            )}
          </>
        )}
      </section>
    );
  }

  return (
    <section
      data-page-hero
      data-dark-header-surface
      className={cn("hero-section", backgroundOnly && "hero-section--background-only")}
    >
      <div className="hero-section__wrap">
        <div className={cn("hero-contained", backgroundOnly && "hero-contained--background-only")}>
          {mediaLayer}
          {!backgroundOnly && (
            <>
              {contentBlock}
              {slides.length > 1 && <div className="hero-contained__dots">{indicatorButtons}</div>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
