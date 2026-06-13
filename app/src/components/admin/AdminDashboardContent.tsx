import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  formatAdminRole,
  getAdminGreeting,
  getAdminGreetingPeriod,
  getAdminRoleBadgeClass,
} from "@/lib/admin-greeting";
import { isAdministrator } from "@/lib/admin-access";
import { getDashboardStats } from "@/lib/dashboard-stats";
import {
  LayoutDashboard,
  Home,
  Plus,
  ExternalLink,
  Mail,
  FileEdit,
  ShieldAlert,
  ScrollText,
} from "lucide-react";

export async function AdminDashboardContent() {
  const session = await getServerSession(authOptions);
  const greeting = getAdminGreeting(session?.user?.name);
  const greetingPeriod = getAdminGreetingPeriod();
  const roleLabel = formatAdminRole(session?.user?.role);
  const roleBadgeClass = getAdminRoleBadgeClass(session?.user?.role);
  const stats = await getDashboardStats();
  const isAdmin = isAdministrator(session?.user?.role);

  const quickActions = [
    {
      label: "Homepage",
      href: "/admin/landing-page-v2",
      icon: Home,
      className: "admin-btn-content",
    },
    {
      label: "New Project",
      href: "/admin/projects/new",
      icon: Plus,
      className: "admin-btn-people",
    },
    {
      label: "New Tender",
      href: "/admin/tenders/new",
      icon: Plus,
      className: "admin-btn-warning",
    },
    {
      label: "View Website",
      href: "/",
      icon: ExternalLink,
      external: true,
      className: "admin-btn-accent",
    },
  ];

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="admin-welcome-panel">
      <div className="space-y-8">
        <div className="flex items-start gap-5 min-w-0">
          <div className="admin-icon-mark hidden sm:flex">
            <LayoutDashboard aria-hidden="true" />
          </div>
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="admin-eyebrow admin-eyebrow--accent">Admin Console</p>
              <span className="hidden sm:inline text-border">·</span>
              <p className="admin-meta">{today}</p>
            </div>
            <h1
              className={`admin-page-title admin-dashboard-greeting admin-dashboard-greeting--${greetingPeriod}`}
            >
              {greeting}
            </h1>
            <p className="admin-page-description max-w-2xl">
              Manage website content, public notices, projects, tenders, and enquiries from one
              secure dashboard.
            </p>
            <p className="admin-meta flex flex-wrap items-center gap-2">
              <span>Signed in as</span>
              <span className={roleBadgeClass}>{roleLabel}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/enquiries" className="admin-card p-4 hover:border-accent/40 transition-colors">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
              <div>
                <p className="text-2xl font-semibold">{stats.unreadEnquiries}</p>
                <p className="text-sm text-muted">Unread enquiries</p>
              </div>
            </div>
          </Link>
          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <FileEdit className="h-5 w-5 text-accent" aria-hidden="true" />
              <div>
                <p className="text-2xl font-semibold">{stats.draftContentCount}</p>
                <p className="text-sm text-muted">Draft projects, tenders & news</p>
              </div>
            </div>
          </div>
          {isAdmin && (
            <>
              <div className="admin-card p-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-red-500" aria-hidden="true" />
                  <div>
                    <p className="text-2xl font-semibold">{stats.failedLogins24h}</p>
                    <p className="text-sm text-muted">Failed logins (24h)</p>
                  </div>
                </div>
              </div>
              <Link href="/admin/audit-log" className="admin-card p-4 hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-3">
                  <ScrollText className="h-5 w-5 text-accent" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">Audit log</p>
                    <p className="text-sm text-muted">Review recent activity</p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>

        <div className="admin-actions admin-actions--nowrap admin-dashboard-actions pt-1 border-t border-border">
          {quickActions.map((action) => {
            const className = action.className;
            if (action.external) {
              return (
                <a
                  key={action.label}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  <action.icon aria-hidden="true" />
                  {action.label}
                </a>
              );
            }
            return (
              <Link key={action.label} href={action.href} className={className}>
                <action.icon aria-hidden="true" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
