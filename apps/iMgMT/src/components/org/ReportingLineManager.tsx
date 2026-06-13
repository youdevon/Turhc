"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { createReportingLine, closeReportingLine } from "@/lib/actions/reporting-lines";
import { formatDateOnly } from "@/lib/format";

type UserOption = { id: string; firstName: string; lastName: string; jobTitle: string | null };
type ReportingLine = {
  id: string;
  level: number;
  isPrimary: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  employee: UserOption;
  authority: UserOption;
};

export function ReportingLineForm({ users }: { users: UserOption[] }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createReportingLine(formData);
      if (result.ok) {
        toast.success("Reporting line created");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="card space-y-4 p-5">
      <h3 className="font-medium">Assign Reporting Line</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-muted">Employee</label>
          <select name="employeeId" required className="input-field">
            <option value="">Select employee</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Authority (supervisor/manager)</label>
          <select name="authorityId" required className="input-field">
            <option value="">Select authority</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
                {u.jobTitle ? ` — ${u.jobTitle}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Level (1 = first approver)</label>
          <input name="level" type="number" min={1} defaultValue={1} required className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Effective From</label>
          <input name="effectiveFrom" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="input-field" />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <input name="isPrimary" type="checkbox" id="isPrimary" className="h-4 w-4" />
          <label htmlFor="isPrimary" className="text-sm text-text-muted">
            Primary (default escalation path)
          </label>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Create"}
      </button>
    </form>
  );
}

function CloseLineForm({ lineId }: { lineId: string }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await closeReportingLine(formData);
      if (result.ok) toast.success("Reporting line closed");
      else toast.error(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={lineId} />
      <input
        name="effectiveTo"
        type="date"
        defaultValue={new Date().toISOString().slice(0, 10)}
        className="input-field !w-auto py-1 text-xs"
        required
      />
      <button type="submit" disabled={pending} className="text-xs text-warning hover:underline">
        Close
      </button>
    </form>
  );
}

export function ReportingLineList({ lines }: { lines: ReportingLine[] }) {
  return (
    <div className="card overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Authority</th>
            <th>Level</th>
            <th>Primary</th>
            <th>From</th>
            <th>To</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td>
                {line.employee.firstName} {line.employee.lastName}
              </td>
              <td>
                {line.authority.firstName} {line.authority.lastName}
              </td>
              <td>{line.level}</td>
              <td>{line.isPrimary ? "Yes" : "—"}</td>
              <td className="text-text-muted">{formatDateOnly(line.effectiveFrom)}</td>
              <td className="text-text-muted">{formatDateOnly(line.effectiveTo)}</td>
              <td>{!line.effectiveTo && <CloseLineForm lineId={line.id} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
