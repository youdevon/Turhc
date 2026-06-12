"use client";

import { FormField } from "../FormField";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { friendlySaveError, notifyError, notifySuccess } from "@/lib/notify";
import { saveUser } from "@/lib/cms-actions";
import type { Role, User } from "@prisma/client";

function roleLabel(name: string): string {
  if (name === "Editor") return "Content Editor";
  if (name === "Administrator") return "Administrator";
  return name;
}

type Props = { user?: User; roles: Role[] };

export function UserForm({ user, roles }: Props) {
  async function handleSubmit(formData: FormData) {
    try {
      await saveUser(formData);
      notifySuccess(user ? ALERT_MESSAGES.userUpdated : ALERT_MESSAGES.userCreated);
    } catch (error) {
      notifyError(friendlySaveError(error));
    }
  }

  return (
    <form action={handleSubmit} className="admin-form-card space-y-5 max-w-2xl">
      {user && <input type="hidden" name="id" value={user.id} />}
      <FormField label="Full name" name="name" required defaultValue={user?.name} />
      <FormField label="Email address" name="email" type="email" required defaultValue={user?.email} />
      {!user && (
        <FormField
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          help="At least 8 characters. Required for new users."
        />
      )}
      <FormField label="Access level" name="roleId" defaultValue={user?.roleId}>
        <select
          name="roleId"
          defaultValue={user?.roleId ?? roles[0]?.id}
          className="admin-input"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {roleLabel(r.name)}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Account status" name="userStatus" defaultValue={user?.status ?? "ACTIVE"}>
        <select
          name="userStatus"
          defaultValue={user?.status ?? "ACTIVE"}
          className="admin-input"
        >
          <option value="ACTIVE">Active — can sign in</option>
          <option value="INACTIVE">Inactive — cannot sign in</option>
        </select>
      </FormField>
      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary">
          {user ? "Save changes" : "Create user"}
        </button>
      </div>
    </form>
  );
}
