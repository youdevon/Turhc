export const ROLES = {
  ADMINISTRATOR: "Administrator",
  HR: "HR",
  MANAGER: "Manager",
  SUPERVISOR: "Supervisor",
  EMPLOYEE: "Employee",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

const ROLE_HIERARCHY: Record<RoleName, number> = {
  [ROLES.ADMINISTRATOR]: 100,
  [ROLES.HR]: 80,
  [ROLES.MANAGER]: 60,
  [ROLES.SUPERVISOR]: 40,
  [ROLES.EMPLOYEE]: 20,
};

export type Permission =
  | "org.manage"
  | "users.manage"
  | "leave.types.manage"
  | "holidays.manage"
  | "settings.manage"
  | "audit.view"
  | "balances.adjust"
  | "leave.view.all"
  | "leave.approve"
  | "leave.view.team"
  | "leave.submit"
  | "documents.manage"
  | "documents.view.sensitive"
  | "contracts.manage"
  | "assets.manage"
  | "delegations.manage";

const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  [ROLES.ADMINISTRATOR]: [
    "org.manage",
    "users.manage",
    "leave.types.manage",
    "holidays.manage",
    "settings.manage",
    "audit.view",
    "balances.adjust",
    "leave.view.all",
    "leave.approve",
    "leave.view.team",
    "leave.submit",
    "documents.manage",
    "documents.view.sensitive",
    "contracts.manage",
    "assets.manage",
    "delegations.manage",
  ],
  [ROLES.HR]: [
    "users.manage",
    "balances.adjust",
    "leave.view.all",
    "leave.approve",
    "leave.view.team",
    "leave.submit",
    "documents.manage",
    "documents.view.sensitive",
    "contracts.manage",
    "assets.manage",
    "delegations.manage",
  ],
  [ROLES.MANAGER]: [
    "leave.approve",
    "leave.view.team",
    "leave.submit",
    "delegations.manage",
  ],
  [ROLES.SUPERVISOR]: [
    "leave.approve",
    "leave.view.team",
    "leave.submit",
  ],
  [ROLES.EMPLOYEE]: ["leave.submit"],
};

export function isRoleName(value: string | undefined | null): value is RoleName {
  return Boolean(value && value in ROLE_PERMISSIONS);
}

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!isRoleName(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: string | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function roleAtLeast(role: string | undefined | null, minimum: RoleName): boolean {
  if (!isRoleName(role)) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}

export function canAccessRoute(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false;
  if (pathname.startsWith("/admin")) {
    return hasPermission(role, "settings.manage") || hasPermission(role, "leave.types.manage");
  }
  if (pathname.startsWith("/org/departments") || pathname.startsWith("/org/reporting-lines")) {
    return hasPermission(role, "org.manage");
  }
  if (pathname.startsWith("/org/users")) {
    return hasPermission(role, "users.manage");
  }
  if (pathname.startsWith("/org/chart")) {
    return hasAnyPermission(role, ["org.manage", "users.manage", "leave.view.team"]);
  }
  if (pathname.startsWith("/org")) {
    return hasAnyPermission(role, ["org.manage", "users.manage"]);
  }
  if (pathname.startsWith("/leave/balances")) {
    return hasPermission(role, "balances.adjust");
  }
  if (pathname.startsWith("/leave")) {
    return hasPermission(role, "leave.submit") || hasPermission(role, "leave.view.all");
  }
  if (pathname.startsWith("/approvals")) {
    return hasPermission(role, "leave.approve");
  }
  if (pathname.startsWith("/team")) {
    return hasPermission(role, "leave.view.team") || hasPermission(role, "leave.view.all");
  }
  if (pathname.startsWith("/employees")) {
    return hasAnyPermission(role, ["users.manage", "leave.view.all"]);
  }
  if (pathname.startsWith("/audit")) {
    return hasPermission(role, "audit.view");
  }
  return true;
}

export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requirePermission(role: string | undefined | null, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(`Missing permission: ${permission}`);
  }
}
