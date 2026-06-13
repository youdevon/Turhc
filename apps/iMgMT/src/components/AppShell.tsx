import Link from "next/link";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  GitBranch,
  Home,
  Scale,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/leave", label: "My Leave", icon: CalendarDays, permission: "leave.submit" as const },
  { href: "/approvals", label: "Approvals", icon: ClipboardList, permission: "leave.approve" as const },
  { href: "/org/departments", label: "Departments", icon: Building2, permission: "org.manage" as const },
  { href: "/org/users", label: "Users", icon: Users, permission: "users.manage" as const },
  { href: "/org/reporting-lines", label: "Reporting Lines", icon: GitBranch, permission: "org.manage" as const },
  { href: "/org/chart", label: "Org Chart", icon: GitBranch, anyPermission: ["org.manage", "users.manage", "leave.view.team"] as const },
  { href: "/leave/balances", label: "Balances", icon: Scale, permission: "balances.adjust" as const },
];

export async function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const session = await getSession();
  const role = session?.user.role;

  const visibleNav = navItems.filter((item) => {
    if (!session) return item.href === "/";
    if (item.permission) return hasPermission(role, item.permission);
    if (item.anyPermission) return item.anyPermission.some((p) => hasPermission(role, p));
    return true;
  });

  return (
    <div className="min-h-dvh hero-gradient">
      <header className="border-b border-border/60 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link href="/" className="text-xs uppercase tracking-[0.2em] text-accent-light hover:text-accent">
              iMgMT
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          </div>
          {session && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-text-muted sm:inline">{session.user.name}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-gold">{session.user.role}</span>
            </div>
          )}
        </div>
        {session && (
          <nav className="border-t border-border/40">
            <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-text-muted transition hover:bg-surface-elevated hover:text-text"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
