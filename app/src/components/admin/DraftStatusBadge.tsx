import { getWorkflowStatus, workflowStatusLabel, type DraftableRecord } from "@/lib/content-draft";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

type Props = {
  record: DraftableRecord;
  className?: string;
};

export function DraftStatusBadge({ record, className }: Props) {
  const workflow = getWorkflowStatus(record);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <StatusBadge status={workflow === "UNPUBLISHED_CHANGES" ? "PUBLISHED" : workflow} />
      {workflow === "UNPUBLISHED_CHANGES" && (
        <span className="admin-badge admin-badge-draft">Unpublished changes</span>
      )}
      {workflow === "DRAFT_ONLY" && (
        <span className="admin-meta">{workflowStatusLabel(workflow)}</span>
      )}
    </div>
  );
}
