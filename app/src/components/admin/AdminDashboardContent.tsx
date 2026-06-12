import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  formatAdminRole,
  getAdminGreeting,
  getAdminGreetingPeriod,
  getAdminRoleBadgeClass,
} from "@/lib/admin-greeting";
import {
  LayoutDashboard,
  Home,
  Plus,
  ExternalLink,
} from "lucide-react";

export async function AdminDashboardContent() {
  const session = await getServerSession(authOptions);
  const greeting = getAdminGreeting(session?.user?.name);
  const greetingPeriod = getAdminGreetingPeriod();
  const roleLabel = formatAdminRole(session?.user?.role);
  const roleBadgeClass = getAdminRoleBadgeClass(session?.user?.role);

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
