"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminLayoutShell } from "./AdminLayoutShell";
import { AdminAuthLoading } from "./AdminAuthLoading";

type Props = {
  children: React.ReactNode;
  unreadEnquiries?: number;
  userRole?: string;
  userName?: string | null;
  userEmail?: string | null;
  logoUrl?: string | null;
};

export function AdminProtectedShell({
  children,
  unreadEnquiries = 0,
  userRole,
  userName,
  userEmail,
  logoUrl,
}: Props) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") return;

    const callbackUrl = encodeURIComponent(pathname || "/admin/dashboard");
    router.replace(`/admin/login?callbackUrl=${callbackUrl}`);
  }, [status, router, pathname]);

  if (status === "unauthenticated") {
    return <AdminAuthLoading />;
  }

  return (
    <AdminLayoutShell
      unreadEnquiries={unreadEnquiries}
      userRole={userRole}
      userName={userName}
      userEmail={userEmail}
      logoUrl={logoUrl}
    >
      {children}
    </AdminLayoutShell>
  );
}
