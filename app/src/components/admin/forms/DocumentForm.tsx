"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "../FormField";
import { SlugUrlField } from "../SlugUrlField";
import { MediaUploader } from "../MediaUploader";
import { ContentActionBar } from "../ContentActionBar";
import { DOCUMENT_CATEGORY_OPTIONS, getFrontendPathForCategory } from "@/lib/document-categories";
import {
  discardDocumentDraft,
  publishDocumentContent,
  saveDocumentDraft,
} from "@/lib/draft-actions";
import type { Document } from "@prisma/client";

type Props = {
  document?: Document;
  hasDraft?: boolean;
};

export function DocumentForm({ document, hasDraft = false }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState(document?.category ?? "PUBLIC_DOCUMENT");
  const [saving, setSaving] = useState(false);
  const selectedCategory = DOCUMENT_CATEGORY_OPTIONS.find((o) => o.value === category);

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

  const isPublished = document?.status === "PUBLISHED";
  const liveUrl = isPublished ? getFrontendPathForCategory(category) ?? undefined : undefined;

  return (
    <div className="space-y-6">
      <form ref={formRef} className="admin-form-card max-w-3xl">
        {document && <input type="hidden" name="id" value={document.id} />}
        <FormField label="Title" name="title" required defaultValue={document?.title} />
        <SlugUrlField prefix="/documents/" defaultValue={document?.slug} help="The download link identifier. Leave blank to generate from the title." />
        <FormField label="Description" name="description" defaultValue={document?.description ?? ""} />
        <FormField label="Category" name="category">
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="admin-input"
          >
            {DOCUMENT_CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <p className="text-xs text-muted mt-2">
              Appears on the public site at{" "}
              <span className="font-medium text-foreground">{selectedCategory.frontendPath}</span> when
              published.
            </p>
          )}
        </FormField>
        <FormField label="Year" name="year" type="number" defaultValue={document?.year ?? ""} />
        <div>
          <p className="text-sm font-medium text-foreground-muted mb-2">File</p>
          <MediaUploader
            name="mediaId"
            multiple={false}
            defaultValue={document?.mediaId ?? ""}
            imagesOnly={false}
            help="Upload a new file or choose one already in the media library."
          />
        </div>
      </form>

      <ContentActionBar
        hasDraft={hasDraft}
        isPublished={isPublished}
        liveUrl={liveUrl}
        backUrl="/admin/documents"
        saving={saving}
        onSaveDraft={() => runAction(saveDocumentDraft)}
        onPublish={() => runAction(publishDocumentContent)}
        onDiscardDraft={
          hasDraft && document
            ? async () => {
                setSaving(true);
                try {
                  await discardDocumentDraft(document.id, document.title);
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
