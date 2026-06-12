"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuditLogListItem } from "@/lib/audit-helpers";
import {
  formatAuditAction,
  formatAuditTimestamp,
  getAuditActorEmail,
  getAuditActorName,
  getAuditChangeRows,
  getAuditTargetName,
  getAuditTargetType,
} from "@/lib/audit-helpers";
import { cn } from "@/lib/utils";
import { Eye, X } from "lucide-react";
import { AdminEmptyState } from "./AdminEmptyState";

type Props = {
  logs: AuditLogListItem[];
};

function OutcomeBadge({ outcome }: { outcome: string | null | undefined }) {
  const label = outcome?.trim() || "Success";
  const success = label === "Success";
  return (
    <span
      className={cn(
        "admin-badge",
        success ? "admin-badge-success" : "admin-badge-danger"
      )}
    >
      {label}
    </span>
  );
}

function ActionBadge({ action, displayAction }: { action: string; displayAction?: string | null }) {
  return (
    <span className="admin-badge admin-badge-neutral">
      {formatAuditAction(action, displayAction)}
    </span>
  );
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="audit-log-detail-field">
      <p className="admin-detail-label">{label}</p>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function AuditLogDetailModal({
  log,
  open,
  onClose,
}: {
  log: AuditLogListItem | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.classList.add("audit-log-modal-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("audit-log-modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !log) return null;

  let changeRows: ReturnType<typeof getAuditChangeRows> = [];
  try {
    changeRows = getAuditChangeRows(log);
  } catch (error) {
    console.error("Failed to render audit log changes:", error);
  }

  const actorName = getAuditActorName(log);
  const actorEmail = getAuditActorEmail(log);
  const targetType = getAuditTargetType(log);
  const targetName = getAuditTargetName(log);
  const actionLabel = formatAuditAction(log.action, log.displayAction);

  return (
    <div
      className="audit-log-modal fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-log-modal-title"
    >
      <button
        type="button"
        className="audit-log-modal__backdrop absolute inset-0 bg-black/60"
        aria-label="Close details"
        onClick={onClose}
      />

      <div className="audit-log-modal__panel relative z-10 flex w-full max-w-6xl max-h-[min(92vh,900px)] flex-col overflow-hidden border border-border bg-surface-elevated shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="admin-eyebrow mb-1">Audit entry details</p>
            <h2 id="audit-log-modal-title" className="admin-section-title text-lg sm:text-xl truncate">
              {actionLabel}
              {targetName ? ` — ${targetName}` : ""}
            </h2>
            <p className="text-sm text-muted mt-1">{formatAuditTimestamp(log.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn-icon admin-btn-quiet shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-8">
            <DetailField label="Name">{actorName}</DetailField>
            <DetailField label="Email">{actorEmail ?? "—"}</DetailField>
            <DetailField label="Role">{log.actorRole ?? "—"}</DetailField>
            <DetailField label="Action">
              <ActionBadge action={log.action} displayAction={log.displayAction} />
            </DetailField>
            <DetailField label="Area">{targetType ?? "—"}</DetailField>
            <DetailField label="Item">{targetName ?? "—"}</DetailField>
            <DetailField label="Outcome">
              <OutcomeBadge outcome={log.outcome} />
              {log.failReason && (
                <p className="mt-2 text-muted">
                  <span className="font-medium text-foreground">Reason:</span> {log.failReason}
                </p>
              )}
            </DetailField>
            <DetailField label="Time">{formatAuditTimestamp(log.createdAt)}</DetailField>
            <DetailField label="IP Address">
              <p className="break-all font-mono text-sm">{log.ipAddress ?? "—"}</p>
            </DetailField>
            <DetailField label="Browser / Device">
              <p className="break-all text-muted">{log.userAgent ?? "—"}</p>
            </DetailField>
          </div>

          <div className="mt-8">
            <p className="admin-detail-label mb-3">Changes</p>
            {changeRows.length === 0 ? (
              <p className="border border-border bg-surface px-4 py-6 text-sm text-muted">
                No field changes recorded for this action.
              </p>
            ) : (
              <div className="overflow-x-auto border border-border">
                <table className="audit-log-changes-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="text-left px-4 py-3 font-medium text-muted whitespace-nowrap">Field</th>
                      <th className="text-left px-4 py-3 font-medium text-muted min-w-[12rem]">Before</th>
                      <th className="text-left px-4 py-3 font-medium text-muted min-w-[12rem]">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeRows.map((row) => (
                      <tr key={row.field} className="border-b border-border/60 last:border-0 align-top">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{row.field}</td>
                        <td className="px-4 py-3 text-muted break-words">{row.before}</td>
                        <td className="px-4 py-3 break-words">{row.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border px-5 py-4 sm:px-6">
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuditLogViewer({ logs }: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLogListItem | null>(null);

  const rows = useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);
  const closeModal = useCallback(() => setSelectedLog(null), []);

  if (!rows.length) {
    return (
      <AdminEmptyState
        title="No audit events yet"
        description="Activity across the admin console will appear here once actions are recorded."
      />
    );
  }

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="admin-th normal-case tracking-normal">Time</th>
                <th className="admin-th normal-case tracking-normal">Who</th>
                <th className="admin-th normal-case tracking-normal">Action</th>
                <th className="admin-th normal-case tracking-normal whitespace-normal">Target</th>
                <th className="admin-th normal-case tracking-normal">Outcome</th>
                <th className="admin-th normal-case tracking-normal text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => {
                const actorName = getAuditActorName(log);
                const actorEmail = getAuditActorEmail(log);
                const targetType = getAuditTargetType(log);
                const targetName = getAuditTargetName(log);

                return (
                  <tr key={log.id} className="admin-tr align-top">
                    <td className="admin-td whitespace-nowrap text-muted">
                      {formatAuditTimestamp(log.createdAt)}
                    </td>
                    <td className="admin-td whitespace-nowrap">
                      <p className="font-medium">{actorName}</p>
                      {actorEmail && <p className="admin-meta mt-0.5">{actorEmail}</p>}
                    </td>
                    <td className="admin-td whitespace-nowrap">
                      <ActionBadge action={log.action} displayAction={log.displayAction} />
                    </td>
                    <td className="admin-td min-w-[200px]">
                      {targetType ? (
                        <>
                          <p className="font-medium">{targetType}</p>
                          {targetName && <p className="admin-meta mt-0.5">{targetName}</p>}
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="admin-td whitespace-nowrap">
                      <OutcomeBadge outcome={log.outcome} />
                    </td>
                    <td className="admin-td whitespace-nowrap text-right">
                      <button
                        type="button"
                        className="admin-btn-quiet inline-flex items-center gap-1.5"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AuditLogDetailModal log={selectedLog} open={selectedLog !== null} onClose={closeModal} />
    </>
  );
}
