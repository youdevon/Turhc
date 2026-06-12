"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle, Copy, Mail, RotateCcw, Save, Trash2 } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { AlertBanner } from "@/components/ui/AlertBanner";
import {
  deleteEnquiry,
  markEnquiryRead,
  markEnquiryUnread,
  restoreEnquiry,
  saveEnquiryInternalNotes,
  updateEnquiryStatus,
} from "@/lib/enquiry-actions";
import { DeleteEnquiryDialog } from "./DeleteEnquiryDialog";
import { StatusBadge } from "./StatusBadge";
import {
  formatEnquiryType,
  getEnquiryDisplayName,
} from "@/lib/enquiry-types";
import { formatShortDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Enquiry } from "@prisma/client";

type Props = {
  enquiry: Enquiry;
};

export function EnquiryDetailPanel({ enquiry: initial }: Props) {
  const router = useRouter();
  const [enquiry, setEnquiry] = useState(initial);
  const [notes, setNotes] = useState(initial.internalNotes ?? "");
  const [pending, startTransition] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const name = getEnquiryDisplayName(enquiry);
  const isDeleted = enquiry.isDeleted;

  function runAction(action: () => Promise<Enquiry>, successMessage: string) {
    startTransition(async () => {
      try {
        const updated = await action();
        setEnquiry(updated);
        notifySuccess(successMessage);
      } catch {
        notifyError(ALERT_MESSAGES.enquiryActionFailed);
      }
    });
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(enquiry.email);
      notifySuccess(ALERT_MESSAGES.emailCopied);
    } catch {
      notifyError(ALERT_MESSAGES.copyFailed);
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteEnquiry(enquiry.id);
      notifySuccess(ALERT_MESSAGES.enquiryDeleted);
      setShowDelete(false);
      router.push("/admin/enquiries");
      router.refresh();
    } catch {
      notifyError(ALERT_MESSAGES.enquiryDeleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  function handleRestore() {
    startTransition(async () => {
      try {
        const updated = await restoreEnquiry(enquiry.id);
        setEnquiry(updated);
        notifySuccess(ALERT_MESSAGES.enquiryRestored);
        router.refresh();
      } catch {
        notifyError(ALERT_MESSAGES.enquiryRestoreFailed);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {isDeleted && (
        <AlertBanner variant="warning" title="This enquiry was deleted">
          {enquiry.deletedAt && (
            <p>
              Deleted {formatShortDate(enquiry.deletedAt)}
              {enquiry.deletedBy ? ` by ${enquiry.deletedBy}` : ""}
            </p>
          )}
        </AlertBanner>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {!isDeleted && !enquiry.isRead && <StatusBadge status="UNREAD" />}
            <StatusBadge status={isDeleted ? "DELETED" : enquiry.status} />
          </div>
          <h2 className="admin-page-title text-xl md:text-2xl">{name}</h2>
          {enquiry.companyName && <p className="text-muted mt-1">{enquiry.companyName}</p>}
        </div>
        <Link href="/admin/enquiries" className="admin-btn-quiet shrink-0">
          ← Back to enquiries
        </Link>
      </div>

      <div className="border border-border bg-surface-elevated p-6 space-y-5">
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-muted mb-0.5">Email</dt>
            <dd>
              <a href={`mailto:${enquiry.email}`} className="text-primary hover:underline">
                {enquiry.email}
              </a>
            </dd>
          </div>
          {enquiry.phone && (
            <div>
              <dt className="text-muted mb-0.5">Phone</dt>
              <dd>{enquiry.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted mb-0.5">Enquiry type</dt>
            <dd>{formatEnquiryType(enquiry.enquiryType)}</dd>
          </div>
          <div>
            <dt className="text-muted mb-0.5">Submitted</dt>
            <dd>{formatShortDate(enquiry.createdAt)}</dd>
          </div>
          {enquiry.subject && (
            <div className="sm:col-span-2">
              <dt className="text-muted mb-0.5">Subject</dt>
              <dd>{enquiry.subject}</dd>
            </div>
          )}
          {enquiry.relatedTenderRef && (
            <div>
              <dt className="text-muted mb-0.5">Tender reference</dt>
              <dd>{enquiry.relatedTenderRef}</dd>
            </div>
          )}
          {enquiry.relatedProjectRef && (
            <div>
              <dt className="text-muted mb-0.5">Project reference</dt>
              <dd>{enquiry.relatedProjectRef}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted mb-0.5">Read status</dt>
            <dd>{enquiry.isRead ? "Read" : "Unread"}</dd>
          </div>
          {enquiry.readAt && (
            <div>
              <dt className="text-muted mb-0.5">Read at</dt>
              <dd>
                {formatShortDate(enquiry.readAt)}
                {enquiry.readBy ? ` by ${enquiry.readBy}` : ""}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted mb-0.5">Email forwarded</dt>
            <dd>
              {enquiry.emailForwarded ? (
                <span className="admin-badge admin-badge-success">
                  Yes{enquiry.emailForwardedAt ? ` — ${formatShortDate(enquiry.emailForwardedAt)}` : ""}
                </span>
              ) : (
                <span className="admin-badge admin-badge-draft">No</span>
              )}
            </dd>
          </div>
        </dl>

        {enquiry.emailForwardError && (
          <AlertBanner variant="warning" title="SMTP forwarding error">
            <p>{enquiry.emailForwardError}</p>
          </AlertBanner>
        )}

        <div>
          <h3 className="admin-section-title text-sm mb-2">Message</h3>
          <div className="border border-border bg-background p-4 text-sm whitespace-pre-wrap leading-relaxed">
            {enquiry.message?.trim() || "—"}
          </div>
        </div>
      </div>

      {!isDeleted && (
        <div className="border border-border bg-surface-elevated p-6 space-y-4">
          <h3 className="admin-section-title">Internal notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Private notes for your team (not visible to the sender)…"
            className="admin-input resize-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              runAction(() => saveEnquiryInternalNotes(enquiry.id, notes), "Internal notes saved")
            }
            className="admin-btn-primary"
          >
            <Save />
            Save notes
          </button>
        </div>
      )}

      <div className="border border-border bg-surface-elevated p-6 space-y-4">
        <h3 className="admin-section-title">Actions</h3>
        <div className="admin-actions">
          {isDeleted ? (
            <button
              type="button"
              disabled={pending}
              onClick={handleRestore}
              className="admin-btn-secondary"
            >
              <RotateCcw />
              Restore enquiry
            </button>
          ) : (
            <>
          <ActionButton
            disabled={pending || enquiry.isRead}
            onClick={() => runAction(() => markEnquiryRead(enquiry.id), "Marked as read")}
            icon={CheckCircle}
            label="Mark as read"
          />
          <ActionButton
            disabled={pending || !enquiry.isRead}
            onClick={() => runAction(() => markEnquiryUnread(enquiry.id), "Marked as unread")}
            icon={RotateCcw}
            label="Mark as unread"
          />
          <ActionButton
            disabled={pending}
            onClick={() =>
              runAction(
                () => updateEnquiryStatus(enquiry.id, "IN_PROGRESS"),
                "Status updated to In Progress"
              )
            }
            icon={Mail}
            label="In progress"
            active={enquiry.status === "IN_PROGRESS"}
          />
          <ActionButton
            disabled={pending}
            onClick={() =>
              runAction(
                () => updateEnquiryStatus(enquiry.id, "RESPONDED"),
                "Status updated to Responded"
              )
            }
            icon={CheckCircle}
            label="Responded"
            active={enquiry.status === "RESPONDED"}
          />
          <ActionButton
            disabled={pending}
            onClick={() =>
              runAction(() => updateEnquiryStatus(enquiry.id, "ARCHIVED"), "Enquiry archived")
            }
            icon={Archive}
            label="Archive"
            active={enquiry.status === "ARCHIVED"}
          />
          <button
            type="button"
            onClick={copyEmail}
            className="admin-btn-secondary"
          >
            <Copy />
            Copy email
          </button>
          <a
            href={`mailto:${enquiry.email}?subject=Re: ${encodeURIComponent(enquiry.subject ?? "Your enquiry")}`}
            className="admin-btn-secondary"
          >
            <Mail />
            Reply via email
          </a>
            </>
          )}
        </div>
      </div>

      {!isDeleted && (
        <div className="admin-danger-zone">
          <h3 className="admin-danger-zone__title">Danger zone</h3>
          <p className="text-sm text-muted">
            Remove this enquiry from the active inbox. It can be restored from the Deleted filter.
          </p>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="admin-btn-danger"
          >
            <Trash2 />
            Delete enquiry
          </button>
        </div>
      )}

      <DeleteEnquiryDialog
        enquiry={enquiry}
        open={showDelete}
        loading={deleting}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  icon: Icon,
  label,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn("admin-btn-toggle", active && "admin-btn-toggle--active")}
    >
      <Icon />
      {label}
    </button>
  );
}
