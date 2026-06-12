import { formatStatus, getStatusColor } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`admin-badge ${getStatusColor(status)}`}>
      {formatStatus(status)}
    </span>
  );
}
