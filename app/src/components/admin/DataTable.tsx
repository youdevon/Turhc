import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminEmptyState } from "./AdminEmptyState";

type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyTitle = "No records yet",
  emptyMessage = "Nothing has been added here yet.",
  emptyActionLabel,
  emptyActionHref,
}: Props<T>) {
  if (!data.length) {
    return (
      <AdminEmptyState
        title={emptyTitle}
        description={emptyMessage}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    );
  }

  return (
    <div className="admin-table-wrap">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th key={col.key} className={cn("admin-th", col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={String(row[keyField])} className="admin-tr">
                {columns.map((col) => (
                  <td key={col.key} className={cn("admin-td", col.className)}>
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminTableLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-primary hover:underline font-medium">
      {children}
    </Link>
  );
}
