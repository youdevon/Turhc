export const ADMINISTRATOR_ROLE = "Administrator";
export const EDITOR_ROLE = "Editor";

export function isAdministrator(role?: string | null): boolean {
  return role === ADMINISTRATOR_ROLE;
}

export function canAccessAdminRoute(role: string | undefined, href: string): boolean {
  if (isAdministrator(role)) return true;
  const adminOnly = [
    "/admin/settings",
    "/admin/users",
    "/admin/audit-logs",
    "/admin/audit-log",
  ];
  return !adminOnly.some((path) => href === path || href.startsWith(`${path}/`));
}
