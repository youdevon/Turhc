"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuditLogListItem } from "@/lib/audit-helpers";
import {
  formatAuditTimestamp,
  formatAuditTimestampDetailed,
  getAuditActorEmail,
  getAuditActorName,
  getAuditCategory,
  getAuditCategoryBadgeClass,
  getAuditChangeRows,
  getAuditContextFields,
  getAuditPlainEnglishSummary,
  getAuditTargetName,
  getAuditTargetType,
  getAuditWhatHappened,
  parseUserAgentSummary,
} from "@/lib/audit-helpers";
import { cn } from "@/lib/utils";
import { ChevronRight, X } from "lucide-react";
import { AdminEmptyState } from "./AdminEmptyState";

type Props = {
  logs: AuditLogListItem[];
};

function OutcomeBadge({ outcome }: { outcome: string | null | undefined }) {
  const label = outcome?.trim() || "Success";
  const success = label === "Success";
  return (
    <span className={cn("admin-badge", success ? "admin-badge-success" : "admin-badge-danger")}>
      {success ? "Succeeded" : label}
    </span>
  );
}

function CategoryBadge({ log }: { log: AuditLogListItem }) {
  const category = getAuditCategory(log);
  return (
    <span className={cn("admin-badge", getAuditCategoryBadgeClass(category))}>{category}</span>
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

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="audit-log-detail-section">
      <h3 className="audit-log-detail-section__title">{title}</h3>
      <div className="audit-log-detail-section__body">{children}</div>
    </section>
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
  const summary = getAuditPlainEnglishSummary(log);
  const whatHappened = getAuditWhatHappened(log);
  const contextFields = getAuditContextFields(log);
  const deviceSummary = parseUserAgentSummary(log.userAgent);
  const category = getAuditCategory(log);

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
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <CategoryBadge log={log} />
              <OutcomeBadge outcome={log.outcome} />
            </div>
            <p className="admin-eyebrow mb-1">Activity details</p>
            <h2 id="audit-log-modal-title" className="admin-section-title text-lg sm:text-xl">
              {summary}
            </h2>
            <p className="text-sm text-muted mt-1">{formatAuditTimestampDetailed(log.createdAt)}</p>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-8">
          <DetailSection title="Who did this">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Person">{actorName}</DetailField>
              <DetailField label="Email">{actorEmail ?? "—"}</DetailField>
              <DetailField label="Role">{log.actorRole ?? "—"}</DetailField>
              {log.userId && <DetailField label="User ID">{log.userId}</DetailField>}
              {log.sessionId && (
                <DetailField label="Session">
                  <span className="font-mono text-xs break-all">{log.sessionId}</span>
                </DetailField>
              )}
              {log.actingOnBehalfOf && (
                <DetailField label="Acting on behalf of">{log.actingOnBehalfOf}</DetailField>
              )}
            </div>
          </DetailSection>

          <DetailSection title="What happened">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Plain summary">{summary}</DetailField>
              <DetailField label="Technical action">{whatHappened}</DetailField>
              <DetailField label="Area">{targetType ?? "—"}</DetailField>
              <DetailField label="Item affected">{targetName ?? "—"}</DetailField>
              {log.recordId && (
                <DetailField label="Record ID">
                  <span className="font-mono text-xs break-all">{log.recordId}</span>
                </DetailField>
              )}
              <DetailField label="Category">{category}</DetailField>
            </div>
          </DetailSection>

          <DetailSection title="When">
            <DetailField label="Timestamp">{formatAuditTimestampDetailed(log.createdAt)}</DetailField>
          </DetailSection>

          <DetailSection title="Where it came from">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="IP address">
                <span className="font-mono text-sm break-all">{log.ipAddress ?? "—"}</span>
              </DetailField>
              <DetailField label="Device">{deviceSummary}</DetailField>
              {(log.httpMethod || log.route) && (
                <DetailField label="Page / endpoint">
                  {[log.httpMethod, log.route].filter(Boolean).join(" ") || "—"}
                </DetailField>
              )}
              {log.userAgent && (
                <DetailField label="Full browser details">
                  <p className="break-all text-muted text-xs">{log.userAgent}</p>
                </DetailField>
              )}
            </div>
          </DetailSection>

          <DetailSection title="Outcome">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Result">
                <OutcomeBadge outcome={log.outcome} />
              </DetailField>
              {log.failReason && (
                <DetailField label="Why it failed">{log.failReason}</DetailField>
              )}
            </div>
          </DetailSection>

          {(contextFields.length > 0 || log.requestId) && (
            <DetailSection title="Extra context">
              <div className="grid gap-4 sm:grid-cols-2">
                {log.requestId && (
                  <DetailField label="Request reference">
                    <span className="font-mono text-xs break-all">{log.requestId}</span>
                  </DetailField>
                )}
                {contextFields.map((field) => (
                  <DetailField key={field.label} label={field.label}>
                    {field.value}
                  </DetailField>
                ))}
              </div>
            </DetailSection>
          )}

          <DetailSection title="What changed">
            {changeRows.length === 0 ? (
              <p className="border border-border bg-surface px-4 py-6 text-sm text-muted">
                No field changes were recorded for this activity.
              </p>
            ) : (
              <div className="overflow-x-auto border border-border">
                <table className="audit-log-changes-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="text-left px-4 py-3 font-medium text-muted whitespace-nowrap">
                        Field
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted min-w-[12rem]">
                        Before
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted min-w-[12rem]">
                        After
                      </th>
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
          </DetailSection>
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
  const openModal = useCallback((log: AuditLogListItem) => setSelectedLog(log), []);

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
          <table className="audit-log-table w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="admin-th normal-case tracking-normal">When</th>
                <th className="admin-th normal-case tracking-normal">Who</th>
                <th className="admin-th normal-case tracking-normal min-w-[16rem]">What happened</th>
                <th className="admin-th normal-case tracking-normal">Category</th>
                <th className="admin-th normal-case tracking-normal">Outcome</th>
                <th className="admin-th normal-case tracking-normal w-10" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => {
                const actorName = getAuditActorName(log);
                const actorEmail = getAuditActorEmail(log);
                const summary = getAuditPlainEnglishSummary(log);
                const isSelected = selectedLog?.id === log.id;

                return (
                  <tr
                    key={log.id}
                    className={cn(
                      "audit-log-row admin-tr align-top cursor-pointer transition-colors",
                      isSelected && "audit-log-row--selected"
                    )}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details: ${summary}`}
                    onClick={() => openModal(log)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openModal(log);
                      }
                    }}
                  >
                    <td className="admin-td whitespace-nowrap text-muted">
                      {formatAuditTimestamp(log.createdAt)}
                    </td>
                    <td className="admin-td whitespace-nowrap">
                      <p className="font-medium">{actorName}</p>
                      {actorEmail && <p className="admin-meta mt-0.5">{actorEmail}</p>}
                    </td>
                    <td className="admin-td min-w-[16rem]">
                      <p className="font-medium leading-snug">{summary}</p>
                      {log.failReason && log.outcome === "Failed" && (
                        <p className="admin-meta mt-1 text-red-600 dark:text-red-400">{log.failReason}</p>
                      )}
                    </td>
                    <td className="admin-td whitespace-nowrap">
                      <CategoryBadge log={log} />
                    </td>
                    <td className="admin-td whitespace-nowrap">
                      <OutcomeBadge outcome={log.outcome} />
                    </td>
                    <td className="admin-td whitespace-nowrap text-muted">
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-muted border-t border-border">
          Click any row to open full details. Entries are append-only and cannot be edited.
        </p>
      </div>

      <AuditLogDetailModal log={selectedLog} open={selectedLog !== null} onClose={closeModal} />
    </>
  );
}
