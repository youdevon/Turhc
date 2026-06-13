"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { actionApprovalStep } from "@/lib/actions/leave";
import { formatDateOnly } from "@/lib/format";

type ApprovalItem = {
  id: string;
  level: number;
  leaveRequest: {
    id: string;
    startDate: Date;
    endDate: Date;
    calculatedDays: number;
    reason: string | null;
    certificateRequired: boolean;
    certificateOutstanding: boolean;
    user: { firstName: string; lastName: string };
    leaveType: { name: string; color: string };
  };
  assignedAuthority: { firstName: string; lastName: string };
};

export function ApprovalQueue({ items }: { items: ApprovalItem[] }) {
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState<Record<string, string>>({});

  function handleAction(stepId: string, decision: "approve" | "reject") {
    startTransition(async () => {
      const result = await actionApprovalStep(stepId, decision, comment[stepId]);
      if (result.ok) {
        toast.success(decision === "approve" ? "Approved" : "Rejected");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (items.length === 0) {
    return <div className="card p-5 text-sm text-text-muted">No pending approvals for you.</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {item.leaveRequest.user.firstName} {item.leaveRequest.user.lastName}
              </p>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full" style={{ background: item.leaveRequest.leaveType.color }} />
                {item.leaveRequest.leaveType.name}
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {formatDateOnly(item.leaveRequest.startDate)} → {formatDateOnly(item.leaveRequest.endDate)} ·{" "}
                {item.leaveRequest.calculatedDays} day(s)
              </p>
              {item.leaveRequest.reason && (
                <p className="mt-1 text-sm">{item.leaveRequest.reason}</p>
              )}
              <p className="mt-1 text-xs text-text-muted">
                Level {item.level} · Assigned: {item.assignedAuthority.firstName}{" "}
                {item.assignedAuthority.lastName}
              </p>
              {item.leaveRequest.certificateRequired && (
                <p className="mt-1 text-xs text-warning">
                  Certificate {item.leaveRequest.certificateOutstanding ? "outstanding" : "required"}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <textarea
              placeholder="Comment (optional)"
              value={comment[item.id] ?? ""}
              onChange={(e) => setComment((c) => ({ ...c, [item.id]: e.target.value }))}
              rows={2}
              className="input-field text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => handleAction(item.id, "approve")}
                className="btn-primary !bg-success/80"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleAction(item.id, "reject")}
                className="btn-secondary !border-danger !text-danger"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
