"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { previewLeaveDays, submitLeaveRequest, cancelLeaveRequest } from "@/lib/actions/leave";
import { formatDateOnly } from "@/lib/format";
import { availableBalance } from "@/lib/leave/balance-math";

type LeaveType = {
  id: string;
  name: string;
  color: string;
  requiresCertificateAfterDays: number | null;
  drawsFromBalance: boolean;
};

type Balance = {
  entitled: number;
  carriedOver: number;
  adjusted: number;
  used: number;
  pending: number;
  leaveType: LeaveType;
};

type LeaveRequest = {
  id: string;
  startDate: Date;
  endDate: Date;
  calculatedDays: number;
  reason: string | null;
  status: string;
  certificateRequired: boolean;
  certificateOutstanding: boolean;
  leaveType: LeaveType;
  approvalSteps: Array<{
    level: number;
    status: string;
    assignedAuthority: { firstName: string; lastName: string };
    actedBy: { firstName: string; lastName: string } | null;
  }>;
};

export function LeaveBalancesPanel({ balances }: { balances: Balance[] }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-medium">My Balances ({new Date().getFullYear()})</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {balances.map((b) => {
          const available = availableBalance(b);
          return (
            <div key={b.leaveType.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: b.leaveType.color }} />
                <span className="font-medium">{b.leaveType.name}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">{available}</p>
              <p className="text-xs text-text-muted">
                Used {b.used} · Pending {b.pending} · Entitled {b.entitled + b.carriedOver + b.adjusted}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaveDayPreview({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [breakdown, setBreakdown] = useState<Awaited<ReturnType<typeof previewLeaveDays>> | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) {
      setBreakdown(null);
      return;
    }
    previewLeaveDays(startDate, endDate)
      .then(setBreakdown)
      .catch(() => setBreakdown(null));
  }, [startDate, endDate]);

  if (!breakdown) return null;

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
      <p className="font-medium text-accent-light">{breakdown.totalDays} day(s)</p>
      {breakdown.sandwichedNotes.length > 0 && (
        <ul className="mt-1 text-text-muted">
          {breakdown.sandwichedNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      {(breakdown.trimmedFromStart.length > 0 || breakdown.trimmedFromEnd.length > 0) && (
        <p className="mt-1 text-xs text-text-muted">
          Edge days excluded from count
        </p>
      )}
    </div>
  );
}

export function LeaveRequestForm({ leaveTypes }: { leaveTypes: LeaveType[] }) {
  const [pending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitLeaveRequest(formData);
      if (result.ok) {
        toast.success("Leave request submitted");
        setStartDate("");
        setEndDate("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="card space-y-4 p-5">
      <h3 className="font-medium">Request Leave</h3>
      <div>
        <label className="mb-1 block text-sm text-text-muted">Leave Type</label>
        <select name="leaveTypeId" required className="input-field">
          <option value="">Select type</option>
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.requiresCertificateAfterDays != null
                ? ` (cert required > ${t.requiresCertificateAfterDays} days)`
                : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-muted">Start Date</label>
          <input
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">End Date</label>
          <input
            name="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="input-field"
          />
        </div>
      </div>
      <LeaveDayPreview startDate={startDate} endDate={endDate} />
      <div>
        <label className="mb-1 block text-sm text-text-muted">Reason (optional)</label>
        <textarea name="reason" rows={3} className="input-field" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Submitting…" : "Submit Request"}
      </button>
    </form>
  );
}

export function LeaveRequestList({ requests }: { requests: LeaveRequest[] }) {
  const [pending, startTransition] = useTransition();

  function handleCancel(id: string) {
    if (!confirm("Cancel this leave request?")) return;
    startTransition(async () => {
      const result = await cancelLeaveRequest(id);
      if (result.ok) toast.success("Request cancelled");
      else toast.error(result.error);
    });
  }

  if (requests.length === 0) {
    return (
      <div className="card p-5 text-sm text-text-muted">No leave requests yet.</div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: req.leaveType.color }} />
                <span className="font-medium">{req.leaveType.name}</span>
                <span className={`status-badge status-${req.status.toLowerCase()}`}>{req.status}</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {formatDateOnly(req.startDate)} → {formatDateOnly(req.endDate)} · {req.calculatedDays} day(s)
              </p>
              {req.reason && <p className="mt-1 text-sm">{req.reason}</p>}
              {req.certificateRequired && (
                <p className="mt-1 text-xs text-warning">
                  Medical certificate {req.certificateOutstanding ? "outstanding" : "required"}
                </p>
              )}
            </div>
            {(req.status === "PENDING" || req.status === "APPROVED") && (
              <button
                type="button"
                onClick={() => handleCancel(req.id)}
                disabled={pending}
                className="text-sm text-danger hover:underline"
              >
                Cancel
              </button>
            )}
          </div>
          {req.approvalSteps.length > 0 && (
            <div className="mt-3 border-t border-border/60 pt-3">
              <p className="text-xs uppercase tracking-wide text-text-muted">Approval chain</p>
              <ul className="mt-2 space-y-1 text-sm">
                {req.approvalSteps.map((step, i) => (
                  <li key={i} className="text-text-muted">
                    L{step.level}: {step.assignedAuthority.firstName} {step.assignedAuthority.lastName} —{" "}
                    <span className={step.status === "APPROVED" ? "text-success" : step.status === "REJECTED" ? "text-danger" : ""}>
                      {step.status}
                    </span>
                    {step.actedBy && step.actedBy.firstName !== step.assignedAuthority.firstName && (
                      <span> (by {step.actedBy.firstName} {step.actedBy.lastName})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
