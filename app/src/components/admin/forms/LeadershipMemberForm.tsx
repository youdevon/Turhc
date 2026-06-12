"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "../FormField";
import { MemberPhotoField } from "../MemberPhotoField";
import {
  discardLeadershipMemberDraft,
  publishLeadershipMemberContent,
  saveLeadershipMemberDraft,
} from "@/lib/draft-actions";
import { ContentActionBar } from "../ContentActionBar";
import type { LeadershipMember, MediaAsset } from "@prisma/client";

type Props = {
  member?: LeadershipMember & { photo?: MediaAsset | null };
  hasDraft?: boolean;
};

export function LeadershipMemberForm({ member, hasDraft = false }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);

  function getFormData() {
    if (!formRef.current) throw new Error("Form not ready");
    return new FormData(formRef.current);
  }

  async function runAction(action: (fd: FormData) => Promise<void>) {
    setSaving(true);
    try {
      await action(getFormData());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} className="border border-border bg-surface-elevated p-6 space-y-4 max-w-2xl">
        {member && <input type="hidden" name="id" value={member.id} />}
        <FormField label="Name" name="name" required defaultValue={member?.name} />
        <FormField label="Title" name="title" required defaultValue={member?.title} />
        <FormField label="Department" name="department" defaultValue={member?.department ?? ""} />
        <FormField label="Bio" name="bio" rows={4} defaultValue={member?.bio ?? ""} />
      <FormField
        label="Display order"
        name="sortOrder"
        type="number"
        defaultValue={member?.sortOrder ?? 0}
        help="Lower numbers appear first on the leadership page."
      />
        <div>
          <p className="text-sm font-medium text-foreground-muted mb-2">Photo</p>
          <MemberPhotoField
            defaultPhotoId={member?.photoId ?? ""}
            defaultPhotoUrl={member?.photo?.url ?? null}
            defaultFocusX={member?.photoFocusX ?? 50}
            defaultFocusY={member?.photoFocusY ?? 50}
            defaultZoom={member?.photoZoom ?? 100}
          />
        </div>
      </form>
      <ContentActionBar
        hasDraft={hasDraft}
        isPublished={member?.status === "PUBLISHED"}
        liveUrl="/about"
        backUrl="/admin/leadership"
        saving={saving}
        onSaveDraft={() => runAction(saveLeadershipMemberDraft)}
        onPublish={() => runAction(publishLeadershipMemberContent)}
        onDiscardDraft={
          hasDraft && member
            ? async () => {
                setSaving(true);
                try {
                  await discardLeadershipMemberDraft(member.id, member.name);
                  router.refresh();
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
      />
    </div>
  );
}
