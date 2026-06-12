"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  itemLabel?: string;
  confirmMessage?: string;
  className?: string;
};

export function AdminDeleteForm({
  action,
  itemLabel = "this item",
  confirmMessage,
  className,
}: Props) {
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const copy = confirmMessage
      ? { title: confirmMessage, description: undefined, confirmLabel: "Delete" as const }
      : ALERT_MESSAGES.confirmDelete(itemLabel);

    const ok = await confirm({
      title: copy.title,
      description: copy.description,
      confirmLabel: copy.confirmLabel ?? "Delete",
      variant: "danger",
    });
    if (!ok) return;

    setPending(true);
    try {
      await action(new FormData(e.currentTarget));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={pending} className={cn("admin-btn-danger", className)}>
        {pending ? "Deleting…" : "Delete"}
      </button>
    </form>
  );
}
