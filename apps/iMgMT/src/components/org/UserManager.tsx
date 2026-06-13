"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { createUser, updateUser } from "@/lib/actions/users";
import { formatDateOnly } from "@/lib/format";

type Role = { id: string; name: string };
type Department = { id: string; name: string };
type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  employeeNumber: string | null;
  jobTitle: string | null;
  employmentType: string;
  status: string;
  dateOfEmployment: Date;
  roleId: string;
  departmentId: string | null;
  role: Role;
  department: Department | null;
};

export function UserForm({
  roles,
  departments,
  editUser,
  onDone,
}: {
  roles: Role[];
  departments: Department[];
  editUser?: User | null;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const editing = editUser ?? null;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing ? await updateUser(formData) : await createUser(formData);
      if (result.ok) {
        toast.success(editing ? "User updated" : "User created");
        onDone?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  const employmentDate = editing
    ? editing.dateOfEmployment.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return (
    <form action={handleSubmit} className="card space-y-4 p-5">
      <h3 className="font-medium">{editing ? "Edit User" : "New User"}</h3>
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-muted">First Name</label>
          <input name="firstName" defaultValue={editing?.firstName ?? ""} required className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Last Name</label>
          <input name="lastName" defaultValue={editing?.lastName ?? ""} required className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Email</label>
          <input name="email" type="email" defaultValue={editing?.email ?? ""} required className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Employee #</label>
          <input name="employeeNumber" defaultValue={editing?.employeeNumber ?? ""} className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Phone</label>
          <input name="phone" defaultValue={editing?.phone ?? ""} className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Job Title</label>
          <input name="jobTitle" defaultValue={editing?.jobTitle ?? ""} className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Role</label>
          <select name="roleId" defaultValue={editing?.roleId ?? ""} required className="input-field">
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Department</label>
          <select name="departmentId" defaultValue={editing?.departmentId ?? ""} className="input-field">
            <option value="">None</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Employment Type</label>
          <select name="employmentType" defaultValue={editing?.employmentType ?? "PERMANENT"} className="input-field">
            <option value="PERMANENT">Permanent</option>
            <option value="CONTRACT">Contract</option>
            <option value="TEMPORARY">Temporary</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Status</label>
          <select name="status" defaultValue={editing?.status ?? "ACTIVE"} className="input-field">
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="EXITED">Exited</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">Date of Employment</label>
          <input name="dateOfEmployment" type="date" defaultValue={employmentDate} required className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-muted">
            {editing ? "New Password (optional)" : "Password"}
          </label>
          <input
            name={editing ? "newPassword" : "password"}
            type="password"
            required={!editing}
            minLength={8}
            className="input-field"
          />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : editing ? "Update" : "Create"}
      </button>
    </form>
  );
}

export function UserList({ users, onEdit }: { users: User[]; onEdit: (user: User) => void }) {
  return (
    <div className="card overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Employed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                {user.firstName} {user.lastName}
                {user.employeeNumber && (
                  <span className="ml-1 text-xs text-text-muted">({user.employeeNumber})</span>
                )}
              </td>
              <td className="text-text-muted">{user.email}</td>
              <td>{user.role.name}</td>
              <td className="text-text-muted">{user.department?.name ?? "—"}</td>
              <td>
                <span className={`status-badge status-${user.status.toLowerCase()}`}>{user.status}</span>
              </td>
              <td className="text-text-muted">{formatDateOnly(user.dateOfEmployment)}</td>
              <td>
                <button type="button" onClick={() => onEdit(user)} className="text-sm text-accent-light hover:underline">
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
