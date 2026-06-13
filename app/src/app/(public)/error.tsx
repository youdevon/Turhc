"use client";

import Link from "next/link";
import { AdminLoadError } from "@/components/admin/AdminLoadError";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-shell py-20">
      <AdminLoadError
        title="This page could not be loaded"
        message={error.message || "An unexpected error occurred while loading this page."}
        onRetry={reset}
      />
      <p className="text-center mt-6">
        <Link href="/" className="text-accent hover:underline">
          Return to homepage
        </Link>
      </p>
    </div>
  );
}
