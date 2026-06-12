export type NavLinkColorCategory =
  | "about"
  | "services"
  | "projects"
  | "tenders"
  | "news"
  | "governance"
  | "contact";

/** Semantic color bucket for a public nav href (supports CMS custom paths). */
export function getNavLinkColorCategory(href: string): NavLinkColorCategory | null {
  const path = href.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";

  if (path === "/about" || path.startsWith("/about/")) return "about";
  if (
    path === "/contractors" ||
    path.startsWith("/contractors/") ||
    path.includes("/services") ||
    path.endsWith("services")
  ) {
    return "services";
  }
  if (
    path === "/projects" ||
    path.startsWith("/projects/") ||
    path.includes("infrastructure")
  ) {
    return "projects";
  }
  if (
    path === "/tenders" ||
    path.startsWith("/tenders/") ||
    path.includes("procurement")
  ) {
    return "tenders";
  }
  if (
    path === "/news" ||
    path.startsWith("/news/") ||
    path.includes("insight")
  ) {
    return "news";
  }
  if (path === "/governance" || path.startsWith("/governance/")) return "governance";
  if (path === "/contact" || path.startsWith("/contact/")) return "contact";

  return null;
}

/** CSS modifier for mobile nav panel links; empty string when no semantic match. */
export function getNavLinkColorClass(href: string): string {
  const category = getNavLinkColorCategory(href);
  return category ? `mobile-nav-panel__link--${category}` : "";
}
