"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { getSafeAdminCallbackUrl } from "@/lib/admin-callback-url";
import { AdminAuthLoading } from "@/components/admin/AdminAuthLoading";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeAdminCallbackUrl(searchParams.get("callbackUrl"));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      notifyError(ALERT_MESSAGES.loginInvalid);
      setLoading(false);
      return;
    }

    notifySuccess(ALERT_MESSAGES.loginSuccess);
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[26rem]">
      <div className="text-center mb-8">
        <div className="admin-login-mark" aria-hidden="true">
          <Building2 />
        </div>
        <h1 className="admin-page-title text-[1.75rem]">Admin Console</h1>
        <p className="admin-page-description mt-2">Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="admin-login-card">
        <div className="space-y-1.5">
          <label htmlFor="email" className="admin-label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="admin-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="admin-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="admin-input"
          />
        </div>

        <button type="submit" disabled={loading} className="admin-btn-primary w-full mt-2">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminAuthLoading />}>
      <AdminLoginForm />
    </Suspense>
  );
}
