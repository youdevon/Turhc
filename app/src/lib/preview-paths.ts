export const PREVIEW_PREFIX = "/preview";

export function isPreviewPath(pathname: string): boolean {
  return pathname === PREVIEW_PREFIX || pathname.startsWith(`${PREVIEW_PREFIX}/`);
}

function splitHref(href: string): { path: string; suffix: string } {
  const hashIndex = href.indexOf("#");
  const withoutHash = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const queryIndex = withoutHash.indexOf("?");
  const path = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : withoutHash.slice(queryIndex);
  return { path, suffix: `${query}${hash}` };
}

/** Map a live site href to its preview equivalent while browsing /preview. */
export function toPreviewHref(href: string): string {
  const { path, suffix } = splitHref(href);

  if (
    !path.startsWith("/") ||
    path.startsWith(PREVIEW_PREFIX) ||
    path.startsWith("/admin") ||
    path.startsWith("/api")
  ) {
    return href;
  }

  if (path === "/" || path === "") {
    return `${PREVIEW_PREFIX}/home${suffix}`;
  }

  const detailMatchers: Array<{ prefix: string; previewBase: string }> = [
    { prefix: "/projects/", previewBase: `${PREVIEW_PREFIX}/projects/` },
    { prefix: "/tenders/", previewBase: `${PREVIEW_PREFIX}/tenders/` },
    { prefix: "/news/", previewBase: `${PREVIEW_PREFIX}/news/` },
  ];

  for (const { prefix, previewBase } of detailMatchers) {
    if (path.startsWith(prefix) && path.length > prefix.length) {
      return `${previewBase}${path.slice(prefix.length)}${suffix}`;
    }
  }

  return `${PREVIEW_PREFIX}${path}${suffix}`;
}

export function isPreviewNavLinkActive(pathname: string, href: string): boolean {
  if (!isPreviewPath(pathname)) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const previewHref = toPreviewHref(href);
  if (href === "/" || previewHref.startsWith(`${PREVIEW_PREFIX}/home`)) {
    return pathname === `${PREVIEW_PREFIX}/home`;
  }

  return pathname === previewHref || pathname.startsWith(`${previewHref}/`);
}
