import type { AuditLog, User } from "@prisma/client";
import { AdminEmptyState } from "./AdminEmptyState";
import {
  formatAuditAction,
  getAuditActorEmail,
  getAuditActorName,
  getAuditChangeList,
  getAuditEventDescription,
} from "@/lib/audit-helpers";

type AuditLogRow = AuditLog & { user: Pick<User, "name" | "email"> | null };

type Props = {
  logs: AuditLogRow[];
};

export function AuditLogList({ logs }: Props) {
  if (!logs.length) {
    return (
      <AdminEmptyState
        title="No audit events yet"
        description="Activity across the admin console will appear here once actions are recorded."
      />
    );
  }

  return (
    <div className="admin-table-wrap">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="admin-th normal-case tracking-normal">When</th>
              <th className="admin-th normal-case tracking-normal">Who</th>
              <th className="admin-th normal-case tracking-normal">Event</th>
              <th className="admin-th normal-case tracking-normal whitespace-normal">What happened</th>
              <th className="admin-th normal-case tracking-normal">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const actorName = getAuditActorName(log);
              const actorEmail = getAuditActorEmail(log);
              const changes = getAuditChangeList(log);

              return (
                <tr key={log.id} className="admin-tr align-top">
                  <td className="admin-td whitespace-nowrap text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="admin-td whitespace-nowrap">
                    <p className="font-medium">{actorName}</p>
                    {actorEmail && <p className="admin-meta mt-0.5">{actorEmail}</p>}
                  </td>
                  <td className="admin-td whitespace-nowrap">
                    <p className="font-medium">{formatAuditAction(log.action)}</p>
                    <p className="admin-meta mt-0.5">{log.module}</p>
                  </td>
                  <td className="admin-td min-w-[280px]">
                    <p className="leading-relaxed">{getAuditEventDescription(log)}</p>
                    {changes.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-muted">
                        {changes.map((change) => (
                          <li key={change} className="flex gap-2">
                            <span className="text-primary shrink-0">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="admin-td whitespace-nowrap text-muted admin-meta">
                    {log.ipAddress ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
