"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { adjustBalance } from "@/lib/actions/leave";
import { availableBalance } from "@/lib/leave/balance-math";

type User = { id: string; firstName: string; lastName: string; employeeNumber: string | null };
type LeaveType = { id: string; name: string };
type Balance = {
  id: string;
  entitled: number;
  carriedOver: number;
  adjusted: number;
  used: number;
  pending: number;
  leaveType: LeaveType;
};

export function BalanceAdjustPanel({
  users,
  leaveTypes,
  selectedUserId,
  balances,
}: {
  users: User[];
  leaveTypes: LeaveType[];
  selectedUserId: string;
  balances: Balance[];
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await adjustBalance(formData);
      if (result.ok) toast.success("Balance adjusted");
      else toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={handleSubmit} className="card space-y-4 p-5">
        <h3 className="font-medium">Adjust Balance</h3>
        <input type="hidden" name="userId" value={selectedUserId} />
        <div>
          <label className="mb-1 block text-sm text-text-muted">Leave Type</label>
          <select name="leaveTypeId" required className="input-field">
            <option value="">Select type</option>
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Adjustment (+/- days)</label>
          <input name="adjustment" type="number" step="0.5" required className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Reason (required, audited)</label>
          <textarea name="reason" rows={3} required className="input-field" />
        </div>
        <button type="submit" disabled={pending || !selectedUserId} className="btn-primary">
          {pending ? "Saving…" : "Apply Adjustment"}
        </button>
      </form>

      <div className="card p-5">
        <h3 className="mb-4 font-medium">Current Balances</h3>
        {balances.length === 0 ? (
          <p className="text-sm text-text-muted">No balances for this user yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Available</th>
                <th>Used</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.id}>
                  <td>{b.leaveType.name}</td>
                  <td>{availableBalance(b)}</td>
                  <td>{b.used}</td>
                  <td>{b.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function UserSelector({
  users,
  selectedUserId,
  basePath,
}: {
  users: User[];
  selectedUserId: string;
  basePath: string;
}) {
  return (
    <form method="get" action={basePath} className="card p-4">
      <label className="mb-1 block text-sm text-text-muted">Select employee</label>
      <select
        name="userId"
        defaultValue={selectedUserId}
        onChange={(e) => e.target.form?.submit()}
        className="input-field"
      >
        <option value="">Choose…</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.firstName} {u.lastName}
            {u.employeeNumber ? ` (${u.employeeNumber})` : ""}
          </option>
        ))}
      </select>
    </form>
  );
}
