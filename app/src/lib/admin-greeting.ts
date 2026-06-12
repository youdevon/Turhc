export type AdminGreetingPeriod = "morning" | "afternoon" | "evening";

export function getAdminGreetingPeriod(): AdminGreetingPeriod {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function getAdminGreeting(name?: string | null): string {
  const period = getAdminGreetingPeriod();
  const who = name?.trim() ? name.trim().split(/\s+/)[0] : "Administrator";
  return `Good ${period}, ${who}`;
}

export function formatAdminRole(role?: string | null): string {
  if (role === "Administrator") return "Administrator";
  if (role === "Editor") return "Content Editor";
  return role ?? "Staff";
}

export function getAdminRoleBadgeClass(role?: string | null): string {
  if (role === "Administrator") return "admin-role-badge admin-role-badge--administrator";
  if (role === "Editor") return "admin-role-badge admin-role-badge--editor";
  return "admin-role-badge admin-role-badge--staff";
}
