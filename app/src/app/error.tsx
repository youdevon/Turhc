"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted">
            An unexpected error occurred. Please try again or return to the homepage.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="admin-btn-primary" onClick={() => reset()}>
              Try again
            </button>
            <Link href="/" className="admin-btn-secondary">
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
