"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { AUDIT_CATEGORIES } from "@/lib/audit-helpers";

type Props = {
  basePath?: string;
};

const DEBOUNCE_MS = 300;
const OUTCOME_OPTIONS = ["Success", "Failed"] as const;

export function AuditLogFilters({ basePath = "/admin/audit-log" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlOutcome = searchParams.get("outcome") ?? "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value?.trim()) params.set(key, value.trim());
        else params.delete(key);
      }

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
      pushParams({ q: null });
      return;
    }

    const timer = window.setTimeout(() => {
      pushParams({ q: query });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, urlQuery, pushParams]);

  function handleClear() {
    setQuery("");
    pushParams({ q: null, category: null, outcome: null });
  }

  const hasFilters = Boolean(query || urlCategory || urlOutcome);

  return (
    <div className="admin-card p-4 space-y-3">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="admin-search-field flex-1">
          <Search className="admin-search-field__icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search person, item, action, or email"
            className="admin-input"
            aria-label="Search audit log"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="flex flex-col gap-1 text-sm min-w-[10rem]">
            <span className="text-muted">Category</span>
            <select
              className="admin-input"
              value={urlCategory}
              onChange={(event) => pushParams({ category: event.target.value || null })}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {AUDIT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm min-w-[10rem]">
            <span className="text-muted">Outcome</span>
            <select
              className="admin-input"
              value={urlOutcome}
              onChange={(event) => pushParams({ outcome: event.target.value || null })}
              aria-label="Filter by outcome"
            >
              <option value="">All outcomes</option>
              {OUTCOME_OPTIONS.map((outcome) => (
                <option key={outcome} value={outcome}>
                  {outcome === "Success" ? "Succeeded" : outcome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasFilters && (
          <button
            type="button"
            className="admin-btn-secondary shrink-0 self-start lg:self-end"
            onClick={handleClear}
            disabled={isPending}
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {isPending && <p className="text-sm text-muted">Updating…</p>}
    </div>
  );
}
