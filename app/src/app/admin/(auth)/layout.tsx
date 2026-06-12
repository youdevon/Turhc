import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="admin-root admin-auth-page min-h-screen flex items-center justify-center p-4 sm:p-6">
      {children}
    </div>
  );
}
