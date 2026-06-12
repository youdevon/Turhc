"use client";

import { formatShortDate } from "@/lib/utils";
import { getEnquiryDisplayName } from "@/lib/enquiry-types";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Enquiry } from "@prisma/client";

type Props = {
  enquiry: Enquiry;
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteEnquiryDialog({ enquiry, open, loading, onCancel, onConfirm }: Props) {
  const name = getEnquiryDisplayName(enquiry);

  return (
    <ConfirmDialog
      open={open}
      title={ALERT_MESSAGES.confirmDeleteRestorable.title}
      description={ALERT_MESSAGES.confirmDeleteRestorable.description}
      confirmLabel={ALERT_MESSAGES.confirmDeleteRestorable.confirmLabel}
      variant="danger"
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="border border-border bg-background/60 px-4 py-3 text-sm space-y-1">
        <p>
          <span className="text-muted">From:</span> {name}
        </p>
        <p>
          <span className="text-muted">Email:</span> {enquiry.email || "—"}
        </p>
        <p>
          <span className="text-muted">Submitted:</span> {formatShortDate(enquiry.createdAt)}
        </p>
      </div>
    </ConfirmDialog>
  );
}
