"use client";

import { useState } from "react";
import { ExternalLink, Eye, Save, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type Props = {
  hasDraft?: boolean;
  isPublished?: boolean;
  liveUrl?: string;
  previewUrl?: string;
  backUrl?: string;
  saving?: boolean;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  onDiscardDraft?: () => Promise<void>;
  className?: string;
};

export function ContentActionBar({
  hasDraft = false,
  isPublished = true,
  liveUrl,
  previewUrl,
  backUrl,
  saving = false,
  onSaveDraft,
  onPublish,
  onDiscardDraft,
  className,
}: Props) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const pending = saving || busy;

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      notifySuccess(success);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : ALERT_MESSAGES.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    const ok = await confirm({
      ...ALERT_MESSAGES.confirmPublish,
      variant: "primary",
    });
    if (!ok) return;
    void run(onPublish, ALERT_MESSAGES.published);
  }

  async function handleDiscard() {
    if (!onDiscardDraft) return;
    const ok = await confirm({
      ...ALERT_MESSAGES.confirmDiscardDraft,
      variant: "warning",
    });
    if (!ok) return;
    void run(onDiscardDraft, ALERT_MESSAGES.draftDiscarded);
  }

  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 admin-card bg-surface/95 backdrop-blur px-5 py-4",
        className
      )}
    >
      <div className="admin-actions">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(onSaveDraft, ALERT_MESSAGES.draftSaved)}
          className="admin-btn-warning disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Save Draft
        </button>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-accent"
          >
            <Eye className="w-4 h-4" />
            Preview Page
          </a>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={handlePublish}
          className="admin-btn-primary disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Publish
        </button>
        {hasDraft && onDiscardDraft && (
          <button
            type="button"
            disabled={pending}
            onClick={handleDiscard}
            className="admin-btn-danger disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Discard Draft
          </button>
        )}
      </div>
      <div className="admin-actions">
        {liveUrl && isPublished && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-accent"
          >
            <ExternalLink className="w-4 h-4" />
            View Website
          </a>
        )}
        {backUrl && (
          <a href={backUrl} className="admin-btn-quiet">
            Back
          </a>
        )}
      </div>
    </div>
  );
}
