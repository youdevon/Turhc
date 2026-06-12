import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
};

export function AdminPagination({ page, totalPages, basePath, searchParams = {} }: Props) {
  if (totalPages <= 1) return null;

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav className="flex items-center justify-between gap-4 pt-6" aria-label="Pagination">
      <p className="text-sm text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="admin-actions">
        <Link
          href={hrefFor(page - 1)}
          aria-disabled={page <= 1}
          className={cn("admin-btn-secondary", page <= 1 && "pointer-events-none opacity-40")}
        >
          Previous
        </Link>
        <Link
          href={hrefFor(page + 1)}
          aria-disabled={page >= totalPages}
          className={cn("admin-btn-secondary", page >= totalPages && "pointer-events-none opacity-40")}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
