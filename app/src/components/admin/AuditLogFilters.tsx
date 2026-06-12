"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

type Props = {
  basePath?: string;
};

const DEBOUNCE_MS = 300;

export function AuditLogFilters({ basePath = "/admin/audit-log" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const pushQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();

      if (trimmed) params.set("q", trimmed);
      else params.delete("q");

      params.delete("page");

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${basePath}?${qs}` : basePath);
      });
    },
    [basePath, router, searchParams]
  );

  useEffect(() => {
    if (query === urlQuery) return;

    if (!query.trim()) {
      pushQuery("");
      return;
    }

    const timer = window.setTimeout(() => {
      pushQuery(query);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, urlQuery, pushQuery]);

  function handleClear() {
    setQuery("");
  }

  return (
    <div className="admin-card p-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="admin-search-field flex-1">
          <Search className="admin-search-field__icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, target, or action"
            className="admin-input"
            aria-label="Search audit log"
          />
        </div>
        {query.length > 0 && (
          <button
            type="button"
            className="admin-btn-secondary shrink-0"
            onClick={handleClear}
            disabled={isPending}
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
      {isPending && <p className="text-sm text-muted mt-2">Updating…</p>}
    </div>
  );
}
