"use client";

import { AdminLoadError } from "@/components/admin/AdminLoadError";

export default function AdminProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="admin-page-shell py-12">
      <AdminLoadError
        title="Admin page error"
        message={error.message || "Something went wrong in the admin console."}
        onRetry={reset}
      />
    </div>
  );
}
