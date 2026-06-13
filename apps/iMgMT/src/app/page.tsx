import Link from "next/link";
import { CalendarDays, ClipboardList, LogIn, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-dvh hero-gradient">
      <header className="border-b border-border/60 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent-light">Internal Office App</p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">iMgMT</h1>
          </div>
          {session ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-text-muted sm:inline">{session.user.name}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-gold">{session.user.role}</span>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Leave & Employee Management
          </h2>
          <p className="mt-4 text-text-muted leading-relaxed">
            Manage leave requests, organizational structure, employee records, contracts, documents,
            and assets — with delegation-aware approvals and full audit logging.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "My Leave", desc: "Submit and track requests", icon: CalendarDays, href: "/leave", permission: "leave.submit" as const },
            { title: "Approvals", desc: "Action pending steps", icon: ClipboardList, href: "/approvals", permission: "leave.approve" as const },
            { title: "Users", desc: "Employee records", icon: Users, href: "/org/users", permission: "users.manage" as const },
            { title: "Org Chart", desc: "Reporting hierarchy", icon: Users, href: "/org/chart", anyPermission: ["org.manage", "users.manage", "leave.view.team"] as const },
          ].map((item) => {
            const visible =
              !session ||
              (item.permission && hasPermission(session.user.role, item.permission)) ||
              (item.anyPermission && item.anyPermission.some((p) => hasPermission(session.user.role, p)));

            if (!visible) return null;

            return (
              <Link key={item.title} href={item.href} className="card p-5 transition hover:border-accent/40">
                <item.icon className="h-5 w-5 text-accent-light" />
                <h3 className="mt-3 font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
              </Link>
            );
          })}
        </section>

        {!session && (
          <section className="mt-10 card p-6">
            <p className="text-sm text-text-muted">
              Sign in with your credentials to access the system. Default seed admin:{" "}
              <code className="text-accent-light">admin@imgmt.local</code>
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
