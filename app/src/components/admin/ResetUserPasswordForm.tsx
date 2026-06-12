"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { FormField } from "./FormField";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { friendlySaveError, notifyError, notifySuccess } from "@/lib/notify";
import { resetUserPassword } from "@/lib/cms-actions";

type Props = {
  userId: string;
  userName: string;
};

export function ResetUserPasswordForm({ userId, userName }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await resetUserPassword(formData);
      notifySuccess(ALERT_MESSAGES.passwordReset(userName));
      router.refresh();
      (document.getElementById("reset-password-form") as HTMLFormElement | null)?.reset();
    } catch (error) {
      notifyError(friendlySaveError(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      id="reset-password-form"
      action={handleSubmit}
      className="admin-form-card max-w-2xl space-y-5"
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Reset password</h2>
          <p className="text-sm text-muted leading-relaxed">
            Set a new password for this user. They will need it the next time they sign in.
          </p>
        </div>
      </div>

      <FormField
        label="New password"
        name="newPassword"
        type="password"
        required
        autoComplete="new-password"
        help="At least 8 characters."
      />
      <FormField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        required
        autoComplete="new-password"
      />

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary" disabled={pending}>
          {pending ? "Resetting…" : "Reset password"}
        </button>
      </div>
    </form>
  );
}
