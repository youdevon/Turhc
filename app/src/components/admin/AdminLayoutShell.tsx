"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ExternalLink } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { formatAdminRole } from "@/lib/admin-greeting";

type Props = {
  children: React.ReactNode;
  unreadEnquiries?: number;
  userRole?: string;
  userName?: string | null;
  userEmail?: string | null;
  logoUrl?: string | null;
};

export function AdminLayoutShell({
  children,
  unreadEnquiries = 0,
  userRole,
  userName,
  userEmail,
  logoUrl,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = userName?.trim() || userEmail?.split("@")[0] || "Staff";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="admin-root min-h-screen flex">
      <AdminSidebar
        unreadEnquiries={unreadEnquiries}
        userRole={userRole}
        logoUrl={logoUrl}
        className="hidden md:flex"
      />

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <AdminSidebar
            unreadEnquiries={unreadEnquiries}
            userRole={userRole}
            logoUrl={logoUrl}
            className="fixed inset-y-0 left-0 z-50 md:hidden shadow-2xl"
            onNavigate={() => setMobileOpen(false)}
          />
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-auto admin-layout-main site-texture">
        <header
          className="admin-topbar sticky top-0 z-30 flex items-center justify-between gap-4 h-14 px-4 md:px-6 border-b border-border shrink-0"
          style={{ background: "var(--admin-topbar-bg)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-foreground hover:bg-surface-elevated transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 md:hidden">
              <p className="font-semibold text-sm truncate">Admin Console</p>
            </div>
          </div>

          <div className="admin-actions shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-secondary admin-btn-live"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Live website
            </Link>
            <div
              className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-border"
              title={userEmail ?? undefined}
            >
              <div className="w-8 h-8 rounded-md bg-background border border-border text-foreground text-xs font-medium flex items-center justify-center">
                {initials}
              </div>
              <div className="hidden lg:block min-w-0 text-right">
                <p className="text-sm font-medium truncate max-w-[10rem]">{displayName}</p>
                <p className="admin-meta">{formatAdminRole(userRole)}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-shell flex-1">{children}</main>
      </div>
    </div>
  );
}
