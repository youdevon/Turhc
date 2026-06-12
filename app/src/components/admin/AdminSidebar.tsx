"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  FileText,
  FolderKanban,
  Gavel,
  Newspaper,
  Files,
  ImageIcon,
  Users,
  UserCog,
  Settings,
  ScrollText,
  Building2,
  LogOut,
  Mail,
  ExternalLink,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { canAccessAdminRoute } from "@/lib/admin-access";
import { logLogoutAction } from "@/lib/logout-action";
import { cn } from "@/lib/utils";

type NavSection = "content" | "public" | "people" | "system";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "enquiries";
  adminOnly?: boolean;
};

const navGroups: { label: string; section: NavSection; items: NavItem[] }[] = [
  {
    label: "Content",
    section: "content",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/landing-page-v2", label: "Homepage", icon: Home },
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/news", label: "News & Notices", icon: Newspaper },
    ],
  },
  {
    label: "Public Information",
    section: "public",
    items: [
      { href: "/admin/tenders", label: "Tenders", icon: Gavel },
      { href: "/admin/enquiries", label: "Enquiries", icon: Mail, badgeKey: "enquiries" },
    ],
  },
  {
    label: "People & Governance",
    section: "people",
    items: [
      { href: "/admin/board", label: "Board", icon: Building2 },
      { href: "/admin/leadership", label: "Leadership", icon: UserCog },
      { href: "/admin/documents", label: "Governance Documents", icon: Files },
    ],
  },
  {
    label: "System",
    section: "system",
    items: [
      { href: "/admin/media", label: "Media Library", icon: ImageIcon },
      { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
      { href: "/admin/settings", label: "Site Settings", icon: Settings, adminOnly: true },
      { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText, adminOnly: true },
    ],
  },
];

type Props = {
  unreadEnquiries?: number;
  userRole?: string;
  logoUrl?: string | null;
  className?: string;
  onNavigate?: () => void;
};

function isNavActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href === "/admin/dashboard" && pathname === "/admin") ||
    (href !== "/admin/dashboard" && pathname.startsWith(href))
  );
}

export function AdminSidebar({ unreadEnquiries = 0, userRole, logoUrl, className, onNavigate }: Props) {
  const pathname = usePathname();

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessAdminRoute(userRole, item.href)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "admin-sidebar w-[17.5rem] shrink-0 border-r flex flex-col h-screen sticky top-0",
        className
      )}
      style={{ background: "var(--admin-sidebar-bg)" }}
    >
      <div className="px-4 py-4 border-b border-border/80">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5 min-w-0"
          onClick={onNavigate}
          aria-label="Admin Console dashboard"
        >
          <div className="admin-brand-logo-frame shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-5 h-5" />
            )}
          </div>
          <span className="font-semibold text-sm text-foreground truncate">Admin Console</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.label} className={cn("admin-nav-section", `admin-nav-section--${group.section}`)}>
            <p className="admin-eyebrow px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn("admin-nav-item", active && "admin-nav-item--active")}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badgeKey === "enquiries" && unreadEnquiries > 0 && (
                      <span
                        className="admin-count-badge admin-count-badge--alert"
                        aria-label={`${unreadEnquiries} unread enquiries`}
                      >
                        {unreadEnquiries > 99 ? "99+" : unreadEnquiries}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border/80 space-y-0.5">
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="admin-nav-item admin-nav-item--accent"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          View Website
        </Link>
        <button
          type="button"
          onClick={async () => {
            await logLogoutAction();
            await signOut({ callbackUrl: "/admin/login" });
          }}
          className="admin-nav-item admin-nav-sign-out w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
