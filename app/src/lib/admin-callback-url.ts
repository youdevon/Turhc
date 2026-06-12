export function getSafeAdminCallbackUrl(url: string | null | undefined): string {
  if (!url) return "/admin/dashboard";
  if (!url.startsWith("/admin") || url.startsWith("/admin/login")) {
    return "/admin/dashboard";
  }
  return url;
}
