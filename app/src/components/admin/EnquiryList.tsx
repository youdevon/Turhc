"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Mail, MailOpen, RotateCcw, Search, Trash2 } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  ENQUIRY_STATUS_FILTERS,
  formatEnquiryType,
  getEnquiryDisplayName,
  isEnquiryUnread,
} from "@/lib/enquiry-types";
import { deleteEnquiry, restoreEnquiry } from "@/lib/enquiry-actions";
import { DeleteEnquiryDialog } from "./DeleteEnquiryDialog";
import { AdminEmptyState } from "./AdminEmptyState";
import { StatusBadge } from "./StatusBadge";
import { formatShortDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Enquiry } from "@prisma/client";

type Props = {
  enquiries: Enquiry[];
  total: number;
  page: number;
  pageSize: number;
  filter: string;
  search: string;
};

function messagePreview(message?: string | null, max = 80): string {
  if (!message?.trim()) return "—";
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function EnquiryList({ enquiries: initial, total, page, pageSize, filter, search }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [enquiries, setEnquiries] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setEnquiries(initial);
  }, [initial]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isDeletedView = filter === "deleted";

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.push(`/admin/enquiries?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEnquiry(deleteTarget.id);
      setEnquiries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      notifySuccess(ALERT_MESSAGES.enquiryDeleted);
      setDeleteTarget(null);
      router.refresh();
    } catch {
      notifyError(ALERT_MESSAGES.enquiryDeleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  function handleRestore(id: string) {
    startTransition(async () => {
      try {
        await restoreEnquiry(id);
        setEnquiries((prev) => prev.filter((e) => e.id !== id));
        notifySuccess(ALERT_MESSAGES.enquiryRestored);
        router.refresh();
      } catch {
        notifyError(ALERT_MESSAGES.enquiryRestoreFailed);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="admin-btn-group">
          {ENQUIRY_STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => updateParams({ filter: item.value === "all" ? undefined : item.value, page: undefined })}
              className={cn(
                "admin-btn-toggle",
                filter === item.value && "admin-btn-toggle--active"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form
          className="admin-search-field lg:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            updateParams({ q: (formData.get("q") as string) || undefined, page: undefined });
          }}
        >
          <Search className="admin-search-field__icon" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search name, email, message…"
            className="admin-input"
          />
        </form>
      </div>

      {pending && <p className="text-sm text-muted">Updating…</p>}

      {!enquiries.length ? (
        <AdminEmptyState
          title="No enquiries found"
          description="No enquiries match your current filters. Try a different status or search term."
        />
      ) : (
        <div className="admin-table-wrap">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 admin-th normal-case tracking-normal" aria-label="Read status" />
                  <th className="admin-th normal-case tracking-normal">Sender</th>
                  <th className="admin-th normal-case tracking-normal hidden md:table-cell">Type</th>
                  <th className="admin-th normal-case tracking-normal hidden lg:table-cell">Message</th>
                  <th className="admin-th normal-case tracking-normal">Status</th>
                  <th className="admin-th normal-case tracking-normal hidden sm:table-cell">Date</th>
                  <th className="admin-th normal-case tracking-normal hidden xl:table-cell">Email sent</th>
                  <th className="w-12 admin-th" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enquiry) => {
                  const name = getEnquiryDisplayName(enquiry);
                  const unread = !isDeletedView && isEnquiryUnread(enquiry);
                  return (
                    <tr key={enquiry.id} className="group admin-tr">
                      <td className="admin-td">
                        {isDeletedView ? (
                          <span className="w-4 h-4 block" />
                        ) : unread ? (
                          <Mail className="w-4 h-4 text-primary" aria-label="Unread" />
                        ) : (
                          <MailOpen className="w-4 h-4 text-muted" aria-label="Read" />
                        )}
                      </td>
                      <td className="px-0 py-0">
                        <Link
                          href={`/admin/enquiries/${enquiry.id}`}
                          className={cn(
                            "block px-5 py-3.5 hover:bg-surface/80 transition-colors",
                            unread && "bg-primary/[0.04] font-medium"
                          )}
                        >
                          <p className={cn(unread && "text-foreground")}>{name}</p>
                          {enquiry.companyName && (
                            <p className="text-xs text-muted mt-0.5">{enquiry.companyName}</p>
                          )}
                          <p className="text-xs text-muted mt-0.5">{enquiry.email || "—"}</p>
                        </Link>
                      </td>
                      <td className="px-0 py-0 hidden md:table-cell">
                        <Link href={`/admin/enquiries/${enquiry.id}`} className="block px-5 py-3.5 hover:bg-surface/80">
                          {formatEnquiryType(enquiry.enquiryType)}
                        </Link>
                      </td>
                      <td className="px-0 py-0 hidden lg:table-cell max-w-xs">
                        <Link href={`/admin/enquiries/${enquiry.id}`} className="block px-5 py-3.5 hover:bg-surface/80 text-muted truncate">
                          {messagePreview(enquiry.message)}
                        </Link>
                      </td>
                      <td className="px-0 py-0">
                        <Link href={`/admin/enquiries/${enquiry.id}`} className="block px-5 py-3.5 hover:bg-surface/80">
                          <StatusBadge status={isDeletedView ? "DELETED" : enquiry.status} />
                        </Link>
                      </td>
                      <td className="px-0 py-0 hidden sm:table-cell whitespace-nowrap">
                        <Link href={`/admin/enquiries/${enquiry.id}`} className="block px-5 py-3.5 hover:bg-surface/80 text-muted">
                          {formatShortDate(enquiry.createdAt)}
                        </Link>
                      </td>
                      <td className="px-0 py-0 hidden xl:table-cell">
                        <Link href={`/admin/enquiries/${enquiry.id}`} className="block px-5 py-3.5 hover:bg-surface/80">
                          {enquiry.emailForwarded ? (
                            <span className="admin-badge admin-badge-success">Yes</span>
                          ) : (
                            <span
                              className="admin-badge admin-badge-draft"
                              title={enquiry.emailForwardError ?? undefined}
                            >
                              No
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-2 py-3.5">
                        {isDeletedView ? (
                          <button
                            type="button"
                            title="Restore enquiry"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRestore(enquiry.id);
                            }}
                            className="admin-btn-icon admin-btn-quiet"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Delete enquiry"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteTarget(enquiry);
                            }}
                            className="admin-btn-icon admin-btn-quiet admin-btn-icon--danger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4 pt-6" aria-label="Pagination">
          <p className="text-sm text-muted">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="admin-actions">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="admin-btn-secondary"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="admin-btn-secondary"
            >
              Next
            </button>
          </div>
        </nav>
      )}

      {deleteTarget && (
        <DeleteEnquiryDialog
          enquiry={deleteTarget}
          open={Boolean(deleteTarget)}
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
