"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Facebook, Instagram, Linkedin, Menu, Twitter, X, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type HeaderConfig,
  type SocialPlatform,
  resolveHeaderCompactLogo,
  resolveHeaderFullLogo,
  shouldShowHeaderBrandSubtitle,
  shouldShowHeaderBrandText,
  shouldShowHeaderLogo,
} from "@/lib/header-config";
import { getNavLinkColorClass } from "@/lib/nav-link-colors";
import { isPreviewNavLinkActive } from "@/lib/preview-paths";
import { HeaderBrandLogo } from "./HeaderBrandLogo";
import { PreviewAwareLink } from "./PreviewAwareLink";

type Props = {
  config: HeaderConfig;
};

const MOBILE_NAV_CLOSE_MS = 400;

/** Routes where the header overlaps the landing v2 hero/carousel (white logo over dark media). */
function isLandingV2Home(pathname: string): boolean {
  return pathname === "/" || pathname === "/preview/home";
}

type ObserveElementOptions = {
  /** Keep polling until the target appears (landing content mounts after client nav). */
  retryUntilFound?: boolean;
  onMissing: () => void;
  createObserver: (target: Element) => IntersectionObserver;
};

function observeElementWhenPresent(
  selector: string,
  { retryUntilFound = false, onMissing, createObserver }: ObserveElementOptions
): () => void {
  let cancelled = false;
  let rafId = 0;
  let observer: IntersectionObserver | null = null;

  const tryAttach = () => {
    if (cancelled) return;

    const target = document.querySelector(selector);
    if (!target) {
      if (retryUntilFound) {
        rafId = requestAnimationFrame(tryAttach);
        return;
      }
      onMissing();
      return;
    }

    observer = createObserver(target);
    observer.observe(target);
  };

  tryAttach();

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    observer?.disconnect();
  };
}

type ObserveElementsOptions = {
  retryUntilFound?: boolean;
  onMissing: () => void;
  createObserver: (targets: NodeListOf<Element>) => IntersectionObserver;
};

function observeElementsWhenPresent(
  selector: string,
  { retryUntilFound = false, onMissing, createObserver }: ObserveElementsOptions
): () => void {
  let cancelled = false;
  let rafId = 0;
  let observer: IntersectionObserver | null = null;

  const tryAttach = () => {
    if (cancelled) return;

    const targets = document.querySelectorAll(selector);
    if (!targets.length) {
      if (retryUntilFound) {
        rafId = requestAnimationFrame(tryAttach);
        return;
      }
      onMissing();
      return;
    }

    observer = createObserver(targets);
    targets.forEach((target) => observer?.observe(target));
  };

  tryAttach();

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    observer?.disconnect();
  };
}

const SOCIAL_META: Record<SocialPlatform, { label: string; Icon: typeof Facebook }> = {
  facebook: { label: "Facebook", Icon: Facebook },
  instagram: { label: "Instagram", Icon: Instagram },
  youtube: { label: "YouTube", Icon: Youtube },
  linkedin: { label: "LinkedIn", Icon: Linkedin },
  twitter: { label: "X (Twitter)", Icon: Twitter },
};

type FloatingAnchor = {
  top: number;
  right: number;
  width: number;
  height: number;
};

export function Header({ config }: Props) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const isLandingHome = isLandingV2Home(pathname);
  const [headerInView, setHeaderInView] = useState(true);
  const [floatingAnchor, setFloatingAnchor] = useState<FloatingAnchor | null>(null);
  const [overHero, setOverHero] = useState(isLandingHome);
  const [overPreHero, setOverPreHero] = useState(isLandingHome);
  const [overDarkSurface, setOverDarkSurface] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileNavMounted, setMobileNavMounted] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [liveConfig, setLiveConfig] = useState(config);

  useEffect(() => {
    setLiveConfig(config);
  }, [config]);

  const {
    brandDisplayText,
    brandSubtitle,
    headerStyle,
    navLinks,
    contactLabel,
    contactHref,
    contractorLabel,
    contractorHref,
    showContractorHeaderCta,
    showHamburgerDesktop,
    socialLinks,
    logoHeightDesktop,
    logoHeightMobile,
    logoMaxWidthDesktop,
    logoMaxWidthMobile,
    brandZoneWidthDesktop,
    logoAlt,
    brandLayoutMode,
  } = liveConfig;

  useLayoutEffect(() => {
    if (isLandingHome) {
      setOverPreHero(true);
      setOverHero(true);
      setOverDarkSurface(false);
      return;
    }

    setOverPreHero(false);
    setOverHero(false);
    setOverDarkSurface(false);
  }, [pathname, isLandingHome]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeaderInView(entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px 0px 0px" }
    );
    observer.observe(header);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    return observeElementWhenPresent("[data-page-hero]", {
      retryUntilFound: isLandingHome,
      onMissing: () => setOverHero(false),
      createObserver: (hero) =>
        new IntersectionObserver(
          ([entry]) => setOverHero(entry.isIntersecting),
          { threshold: 0, rootMargin: "0px 0px 0px 0px" }
        ),
    });
  }, [pathname, isLandingHome]);

  useEffect(() => {
    const headerHeightPx = headerRef.current?.offsetHeight || 84;

    return observeElementWhenPresent("[data-pre-hero]", {
      retryUntilFound: isLandingHome,
      onMissing: () => setOverPreHero(false),
      createObserver: (preHero) =>
        new IntersectionObserver(
          ([entry]) => setOverPreHero(entry.isIntersecting),
          { threshold: 0, rootMargin: `-${headerHeightPx}px 0px 0px 0px` }
        ),
    });
  }, [pathname, isLandingHome]);

  useEffect(() => {
    const headerHeightPx = headerRef.current?.offsetHeight || 84;

    return observeElementWhenPresent("[data-hero-under-header]", {
      retryUntilFound: isLandingHome,
      onMissing: () => undefined,
      createObserver: (heroBand) =>
        new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setOverPreHero(true);
              setOverHero(true);
              setOverDarkSurface(true);
            }
          },
          { threshold: 0, rootMargin: `-${headerHeightPx}px 0px 0px 0px` }
        ),
    });
  }, [pathname, isLandingHome]);

  useEffect(() => {
    const headerHeightPx = headerRef.current?.offsetHeight || 84;

    return observeElementsWhenPresent("[data-dark-header-surface]", {
      retryUntilFound: isLandingHome,
      onMissing: () => setOverDarkSurface(false),
      createObserver: (darkSurfaces) =>
        new IntersectionObserver(
          (entries) => setOverDarkSurface(entries.some((entry) => entry.isIntersecting)),
          { threshold: 0, rootMargin: `-${headerHeightPx}px 0px 0px 0px` }
        ),
    });
  }, [pathname, isLandingHome]);

  const closeMobileNav = useCallback(() => {
    setMobileOpen(false);
    setMobileNavVisible(false);
    window.setTimeout(() => {
      setMobileNavMounted(false);
    }, MOBILE_NAV_CLOSE_MS);
  }, []);

  const openMobileNav = useCallback(() => {
    setMobileOpen(true);
    setMobileNavMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileNavVisible(false);
    setMobileNavMounted(false);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!mobileNavMounted) {
      setMobileNavVisible(false);
      return;
    }

    document.body.classList.add("mobile-nav-open");

    const frame = requestAnimationFrame(() => {
      setMobileNavVisible(true);
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove("mobile-nav-open");
    };
  }, [mobileNavMounted]);

  useEffect(() => {
    if (!mobileNavMounted) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileNav();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavMounted, closeMobileNav]);

  const forceLightHeaderChrome = liveConfig.theme === "light" && !isLandingHome;

  const forceSolid = headerStyle === "solid";
  const isOverPreHero = !forceSolid && !forceLightHeaderChrome && overPreHero;
  const isOverHero = !forceSolid && !forceLightHeaderChrome && (overHero || overPreHero);
  const isSolid = forceSolid || forceLightHeaderChrome || (!overHero && !overPreHero);
  const showGlass =
    !forceLightHeaderChrome &&
    !overPreHero &&
    ((isOverHero && headerStyle === "glass") || headerStyle === "glass");

  const showMenuDesktop = showHamburgerDesktop;
  const showCenterNav = !showMenuDesktop;
  const showFloatingNav = !headerInView;

  const showLogo = shouldShowHeaderLogo(liveConfig);
  const showBrandText = shouldShowHeaderBrandText(liveConfig);
  const showBrandSub = shouldShowHeaderBrandSubtitle(liveConfig);

  const measureFloatingAnchor = useCallback(() => {
    const btn = menuBtnRef.current;
    const header = headerRef.current;
    if (!header) return;

    const headerRect = header.getBoundingClientRect();
    const btnRect = btn?.getBoundingClientRect();

    if (btnRect && btnRect.width > 0 && btnRect.height > 0) {
      setFloatingAnchor({
        top: btnRect.top - headerRect.top,
        right: window.innerWidth - btnRect.right,
        width: btnRect.width,
        height: btnRect.height,
      });
      return;
    }

    const actions = header.querySelector(".site-header__actions");
    const actionsRect = actions?.getBoundingClientRect();
    const fallbackSize = 40;

    if (actionsRect && actionsRect.width > 0 && actionsRect.height > 0) {
      setFloatingAnchor({
        top: actionsRect.top - headerRect.top,
        right: window.innerWidth - actionsRect.right,
        width: fallbackSize,
        height: fallbackSize,
      });
      return;
    }

    setFloatingAnchor({
      top: 22,
      right: 16,
      width: fallbackSize,
      height: fallbackSize,
    });
  }, []);

  useLayoutEffect(() => {
    measureFloatingAnchor();

    const onResize = () => measureFloatingAnchor();
    window.addEventListener("resize", onResize);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measureFloatingAnchor())
        : null;
    if (resizeObserver) {
      if (headerRef.current) resizeObserver.observe(headerRef.current);
      if (menuBtnRef.current) resizeObserver.observe(menuBtnRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
    };
  }, [
    measureFloatingAnchor,
    pathname,
    showMenuDesktop,
    socialLinks.length,
    showContractorHeaderCta,
    brandLayoutMode,
    showLogo,
    showBrandText,
  ]);

  const logoState = {
    isOverHero,
    isScrolled: isSolid,
    isOverDarkSurface: overDarkSurface,
    suppressDarkSurfaceWhiteLogo: forceLightHeaderChrome,
  };

  const desktopLogo = useMemo(
    () =>
      resolveHeaderFullLogo(
        liveConfig,
        logoState.isOverHero,
        logoState.isScrolled,
        logoState.isOverDarkSurface,
        logoState.suppressDarkSurfaceWhiteLogo
      ),
    [
      liveConfig,
      logoState.isOverHero,
      logoState.isScrolled,
      logoState.isOverDarkSurface,
      logoState.suppressDarkSurfaceWhiteLogo,
    ]
  );

  const mobileLogo = useMemo(
    () =>
      resolveHeaderCompactLogo(
        liveConfig,
        logoState.isOverHero,
        logoState.isScrolled,
        logoState.isOverDarkSurface,
        logoState.suppressDarkSurfaceWhiteLogo
      ),
    [
      liveConfig,
      logoState.isOverHero,
      logoState.isScrolled,
      logoState.isOverDarkSurface,
      logoState.suppressDarkSurfaceWhiteLogo,
    ]
  );

  const drawerLogo = mobileLogo ?? desktopLogo;

  const headerStyleVars = {
    "--header-brand-width": `${brandZoneWidthDesktop}px`,
    "--header-logo-height-desktop": `${logoHeightDesktop}px`,
    "--header-logo-height-mobile": `${logoHeightMobile}px`,
    "--header-logo-max-width-desktop": `${logoMaxWidthDesktop}px`,
    "--header-logo-max-width-mobile": `${logoMaxWidthMobile}px`,
  } as React.CSSProperties;

  const useCompactOnly = brandLayoutMode === "compact_logo";
  const useFullLogoEverywhere = brandLayoutMode === "full_logo";

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "site-header",
          isOverHero && "site-header--over-hero",
          isOverPreHero && "site-header--over-pre-hero",
          overDarkSurface && !forceLightHeaderChrome && "site-header--over-dark-surface",
          showGlass && "site-header--glass",
          isSolid && "site-header--solid",
          forceLightHeaderChrome && "site-header--inner-light-chrome",
          showLogo && !showBrandText && "site-header--logo-only",
          useFullLogoEverywhere && "site-header--full-logo"
        )}
        style={headerStyleVars}
      >
        <div className="container-header h-full">
          <div className="site-header__inner">
            <PreviewAwareLink
              href="/"
              className={cn(
                "site-header__brand",
                showLogo && !showBrandText && "site-header__brand--logo-only",
                useCompactOnly && "site-header__brand--compact-logo"
              )}
            >
              {showLogo && desktopLogo && !useCompactOnly && (
                <HeaderBrandLogo
                  resolved={desktopLogo}
                  alt={logoAlt}
                  variant="desktop"
                  priority
                />
              )}
              {showLogo && mobileLogo && !useFullLogoEverywhere && (
                <HeaderBrandLogo
                  resolved={mobileLogo}
                  alt={logoAlt}
                  variant="mobile"
                  priority
                />
              )}
              {showBrandText && (
                <div className="site-header__brand-text min-w-0 leading-none">
                  <p className="site-header__brand-name truncate">{brandDisplayText}</p>
                  {showBrandSub && (
                    <p className="site-header__brand-sub truncate">{brandSubtitle}</p>
                  )}
                </div>
              )}
            </PreviewAwareLink>

            {showCenterNav && (
              <nav className="site-header__nav" aria-label="Main navigation">
                {navLinks.map((link) => (
                  <PreviewAwareLink
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "site-header__nav-link",
                      isPreviewNavLinkActive(pathname, link.href) && "site-header__nav-link--active"
                    )}
                  >
                    {link.label}
                  </PreviewAwareLink>
                ))}
              </nav>
            )}

            <div className="site-header__actions">
              {socialLinks.length > 0 && (
                <div className="site-header__social" aria-label="Social media">
                  {socialLinks.map(({ platform, url }) => {
                    const { label, Icon } = SOCIAL_META[platform];
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "site-header__social-btn",
                          `site-header__social-btn--${platform}`
                        )}
                        aria-label={label}
                        title={label}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </a>
                    );
                  })}
                </div>
              )}

              {showContractorHeaderCta && (
                <div className="site-header__actions-group">
                  <PreviewAwareLink href={contractorHref} className="site-header__action-link hidden lg:inline">
                    {contractorLabel}
                  </PreviewAwareLink>
                </div>
              )}

              <span
                className="site-header__action-divider site-header__action-divider--menu"
                aria-hidden="true"
              />

              <button
                ref={menuBtnRef}
                type="button"
                className={cn(
                  "site-header__menu-btn site-header__menu-btn--mobile-only",
                  showMenuDesktop && "site-header__menu-btn--desktop site-header__menu-btn--visible"
                )}
                onClick={openMobileNav}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
              >
                <Menu className="h-5 w-5 xl:h-6 xl:w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <button
        type="button"
        className={cn(
          "site-floating-nav-btn",
          showFloatingNav && "site-floating-nav-btn--visible"
        )}
        style={
          floatingAnchor
            ? ({
                "--floating-nav-top": `${floatingAnchor.top}px`,
                "--floating-nav-right": `${floatingAnchor.right}px`,
                "--floating-nav-width": `${floatingAnchor.width}px`,
                "--floating-nav-height": `${floatingAnchor.height}px`,
              } as React.CSSProperties)
            : undefined
        }
        onClick={openMobileNav}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
      >
        <Menu
          className={cn("h-5 w-5", showMenuDesktop && "xl:h-6 xl:w-6")}
          aria-hidden="true"
        />
      </button>

      {mobileNavMounted && (
        <div
          className={cn("mobile-nav-overlay", mobileNavVisible && "mobile-nav-overlay--visible")}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label="Close menu"
            onClick={closeMobileNav}
          />
          <div
            id="mobile-navigation"
            className={cn("mobile-nav-panel", mobileNavVisible && "mobile-nav-panel--visible")}
            style={{ "--nav-item-count": navLinks.length } as React.CSSProperties}
          >
            <div className="mobile-nav-panel__header mobile-nav-panel__animate">
              <PreviewAwareLink
                href="/"
                className="min-w-0 flex-1"
                onClick={closeMobileNav}
                aria-label={showLogo && drawerLogo ? `Go to ${brandDisplayText} homepage` : undefined}
              >
                {showLogo && drawerLogo ? (
                  <HeaderBrandLogo resolved={drawerLogo} alt={logoAlt} variant="drawer" />
                ) : (
                  <>
                    <p className="site-header__brand-name text-foreground">{brandDisplayText}</p>
                    {showBrandSub && (
                      <p className="mt-1 text-xs text-muted">{brandSubtitle}</p>
                    )}
                  </>
                )}
              </PreviewAwareLink>
              <button
                type="button"
                className="mobile-nav-panel__close"
                onClick={closeMobileNav}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="mobile-nav-panel__nav" aria-label="Mobile navigation">
              <ul className="mobile-nav-panel__list">
                {navLinks.map((link, index) => {
                  const active = isPreviewNavLinkActive(pathname, link.href);
                  return (
                    <li
                      key={link.href}
                      className="mobile-nav-panel__item"
                      style={{ "--nav-item-index": index } as React.CSSProperties}
                    >
                      <PreviewAwareLink
                        href={link.href}
                        className={cn(
                          "mobile-nav-panel__link mobile-nav-panel__animate",
                          getNavLinkColorClass(link.href),
                          active && "mobile-nav-panel__link--active"
                        )}
                        onClick={closeMobileNav}
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="mobile-nav-panel__link-icon" aria-hidden="true" />
                      </PreviewAwareLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mobile-nav-panel__footer mobile-nav-panel__animate">
              {socialLinks.length > 0 && (
                <div className="mobile-nav-panel__social" aria-label="Social media">
                  {socialLinks.map(({ platform, url }) => {
                    const { label, Icon } = SOCIAL_META[platform];
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "site-header__social-btn",
                          `site-header__social-btn--${platform}`
                        )}
                        aria-label={label}
                        title={label}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </a>
                    );
                  })}
                </div>
              )}
              <PreviewAwareLink
                href={contactHref}
                className="mobile-nav-panel__cta mobile-nav-panel__cta--primary"
                onClick={closeMobileNav}
              >
                {contactLabel}
              </PreviewAwareLink>
              {showContractorHeaderCta && (
                <PreviewAwareLink
                  href={contractorHref}
                  className="mobile-nav-panel__cta mobile-nav-panel__cta--outline"
                  onClick={closeMobileNav}
                >
                  {contractorLabel}
                </PreviewAwareLink>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
