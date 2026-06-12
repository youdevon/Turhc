"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, Wrench } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import {
  getMediaDuplicateReport,
  rebuildMediaMetadataAction,
  softDeleteDuplicateMedia,
} from "@/lib/media-actions";
import { formatDimensions, formatFileSize } from "@/lib/media-utils";
import { formatShortDate } from "@/lib/utils";
import type { MediaDuplicateGroupWithUsage } from "@/lib/media-duplicates";

type Props = {
  initialGroups: MediaDuplicateGroupWithUsage[];
};

export function MediaDuplicatesPanel({ initialGroups }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState(initialGroups);
  const [pending, startTransition] = useTransition();

  const totalDuplicates = groups.reduce((sum, g) => sum + g.duplicates.length, 0);

  function refreshReport() {
    startTransition(async () => {
      try {
        const report = await getMediaDuplicateReport();
        setGroups(report);
      } catch {
        notifyError(ALERT_MESSAGES.loadFailed);
      }
    });
  }

  function rebuildMetadata() {
    startTransition(async () => {
      try {
        const result = await rebuildMediaMetadataAction();
        notifySuccess(
          ALERT_MESSAGES.metadataRebuilt(result.updated, result.missingOnDisk.length)
        );
        refreshReport();
        router.refresh();
      } catch {
        notifyError(ALERT_MESSAGES.actionFailed);
      }
    });
  }

  async function removeDuplicate(id: string, name: string) {
    const ok = await confirm({
      ...ALERT_MESSAGES.confirmRemoveDuplicate(name),
      variant: "warning",
    });
    if (!ok) return;

    startTransition(async () => {
      try {
        await softDeleteDuplicateMedia(id);
        notifySuccess(ALERT_MESSAGES.duplicateRemoved(name));
        refreshReport();
        router.refresh();
      } catch (error) {
        notifyError(error instanceof Error ? error.message : ALERT_MESSAGES.deleteFailed);
      }
    });
  }

  return (
    <div className="border border-border bg-surface-elevated p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold">Library maintenance</h2>
          <p className="text-sm text-muted mt-1">
            Rebuild metadata for duplicate detection, or review and remove duplicate files.
          </p>
        </div>
        <div className="admin-actions">
          <button
            type="button"
            disabled={pending}
            onClick={rebuildMetadata}
            className="admin-btn-secondary"
          >
            <Wrench />
            Rebuild metadata
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setOpen((v) => !v);
              if (!open) refreshReport();
            }}
            className="admin-btn-secondary"
          >
            <RefreshCw />
            Review duplicates{totalDuplicates > 0 ? ` (${totalDuplicates})` : ""}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 pt-2 border-t border-border">
          {groups.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">No duplicate groups found.</p>
          ) : (
            groups.map((group) => (
              <div key={group.groupKey} className="border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">
                      {group.originalName} — {formatFileSize(group.size)} —{" "}
                      {formatDimensions(group.width, group.height)}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {group.duplicates.length + 1} copies · Primary: {group.primary.id.slice(0, 8)}…
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pl-7">
                  <p className="text-xs font-medium text-muted">Keeper (oldest)</p>
                  <div className="text-xs rounded-md border border-border bg-background px-3 py-2">
                    {group.primary.originalName} · {formatShortDate(group.primary.createdAt)}
                  </div>

                  {group.duplicates.map((dup) => {
                    const usage = group.duplicateUsage[dup.id] ?? [];
                    const inUse = usage.length > 0;
                    return (
                      <div
                        key={dup.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs rounded-md border border-border bg-background px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{dup.originalName}</p>
                          <p className="text-muted">
                            {dup.id.slice(0, 12)}… · {formatShortDate(dup.createdAt)}
                          </p>
                          {inUse && (
                            <p className="text-amber-600 mt-1">
                              In use ({usage.map((u) => u.label).join(", ")}) — cannot remove
                            </p>
                          )}
                        </div>
                        {!inUse && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => removeDuplicate(dup.id, dup.originalName)}
                            className="admin-btn-danger shrink-0"
                          >
                            Remove duplicate
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
