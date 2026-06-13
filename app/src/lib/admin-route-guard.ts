import { ADMINISTRATOR_ROLE } from "./admin-access";

const ADMIN_ONLY_PREFIXES = [
  "/admin/settings",
  "/admin/users",
  "/admin/audit-log",
  "/admin/audit-logs",
] as const;

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function canAccessAdminPath(role: string | undefined, pathname: string): boolean {
  if (!isAdminOnlyPath(pathname)) return true;
  return role === ADMINISTRATOR_ROLE;
}
