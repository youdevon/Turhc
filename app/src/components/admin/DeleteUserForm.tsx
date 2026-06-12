"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteUser } from "@/lib/cms-actions";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { friendlySaveError, notifyError, notifySuccess } from "@/lib/notify";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { AlertBanner } from "@/components/ui/AlertBanner";

type Props = {
  userId: string;
  userName: string;
  isSelf: boolean;
  variant?: "panel" | "button";
  className?: string;
};

export function DeleteUserForm({
  userId,
  userName,
  isSelf,
  variant = "panel",
  className,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    const ok = await confirm({
      ...ALERT_MESSAGES.confirmDeleteUser(userName),
      variant: "danger",
    });
    if (!ok) return;

    setPending(true);
    try {
      await deleteUser(userId);
      notifySuccess(ALERT_MESSAGES.userDeleted(userName));
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      notifyError(friendlySaveError(error));
      setPending(false);
    }
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        className={cn("admin-btn-danger", className)}
        disabled={pending || isSelf}
        onClick={handleDelete}
        aria-label={isSelf ? "Cannot delete your own account" : `Delete ${userName}`}
        title={isSelf ? "You cannot delete your own account while signed in" : undefined}
      >
        <Trash2 />
        {pending ? "Deleting…" : "Delete"}
      </button>
    );
  }

  return (
    <div className={cn("admin-form-card max-w-2xl space-y-5", className)}>
      <AlertBanner variant="error" title="Delete user">
        <p>
          {isSelf
            ? "You cannot delete your own account while signed in. Ask another administrator or sign out first."
            : "Permanently remove this user account. They will no longer be able to sign in."}
        </p>
      </AlertBanner>

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn-danger"
          disabled={pending || isSelf}
          onClick={handleDelete}
        >
          {pending ? "Deleting…" : "Delete user"}
        </button>
      </div>
    </div>
  );
}
