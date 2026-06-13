"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { createDepartment, updateDepartment } from "@/lib/actions/departments";

type Department = {
  id: string;
  name: string;
  parentId: string | null;
  headUserId: string | null;
};

type UserOption = { id: string; firstName: string; lastName: string };

export function DepartmentForm({
  departments,
  users,
  editDepartment,
  onDone,
}: {
  departments: Department[];
  users: UserOption[];
  editDepartment?: Department | null;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const editing = editDepartment ?? null;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateDepartment(formData)
        : await createDepartment(formData);
      if (result.ok) {
        toast.success(editing ? "Department updated" : "Department created");
        onDone?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="card space-y-4 p-5">
      <h3 className="font-medium">{editing ? "Edit Department" : "New Department"}</h3>
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <div>
        <label className="mb-1 block text-sm text-text-muted">Name</label>
        <input name="name" defaultValue={editing?.name ?? ""} required className="input-field" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-muted">Parent Department</label>
        <select name="parentId" defaultValue={editing?.parentId ?? ""} className="input-field">
          <option value="">None (top level)</option>
          {departments
            .filter((d) => d.id !== editing?.id)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-muted">Department Head</label>
        <select name="headUserId" defaultValue={editing?.headUserId ?? ""} className="input-field">
          <option value="">None</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : editing ? "Update" : "Create"}
      </button>
    </form>
  );
}

type DepartmentRow = Department & { _count: { users: number }; headUser: UserOption | null };

export function DepartmentList({
  departments,
  onEdit,
}: {
  departments: DepartmentRow[];
  onEdit: (dept: Department) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Parent</th>
            <th>Head</th>
            <th>Staff</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => {
            const parent = departments.find((d) => d.id === dept.parentId);
            return (
              <tr key={dept.id}>
                <td>{dept.name}</td>
                <td className="text-text-muted">{parent?.name ?? "—"}</td>
                <td className="text-text-muted">
                  {dept.headUser ? `${dept.headUser.firstName} ${dept.headUser.lastName}` : "—"}
                </td>
                <td>{dept._count.users}</td>
                <td>
                  <button type="button" onClick={() => onEdit(dept)} className="text-sm text-accent-light hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
