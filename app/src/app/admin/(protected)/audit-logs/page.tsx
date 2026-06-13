import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AuditLogFilters } from "@/components/admin/AuditLogFilters";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { assertAdministratorPage } from "@/lib/admin-roles";
import { queryAuditLogs } from "@/lib/query-audit-logs";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    outcome?: string;
  }>;
};

export default async function AuditLogsPage({ searchParams }: Props) {
  await assertAdministratorPage();
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);

  const { logs, totalPages } = await queryAuditLogs({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    q: params.q,
    category: params.category,
    outcome: params.outcome,
  });

  return (
    <>
      <AdminHeader
        title="Audit Log"
        description="A plain-language history of who did what, when, and whether it succeeded. Click any row for full details."
        breadcrumbs={[{ label: "Audit Log" }]}
      />

      <div className="space-y-4">
        <Suspense
          fallback={
            <div className="border border-border bg-surface-elevated p-4 text-sm text-muted">
              Loading search…
            </div>
          }
        >
          <AuditLogFilters />
        </Suspense>

        <AuditLogViewer logs={logs} />

        <AdminPagination
          page={Number.isFinite(page) && page > 0 ? page : 1}
          totalPages={totalPages}
          basePath="/admin/audit-log"
          searchParams={{ q: params.q, category: params.category, outcome: params.outcome }}
        />
      </div>
    </>
  );
}
