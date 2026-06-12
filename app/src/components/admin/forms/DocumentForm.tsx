"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "../FormField";
import { SlugUrlField } from "../SlugUrlField";
import { MediaUploader } from "../MediaUploader";
import { DOCUMENT_CATEGORY_OPTIONS } from "@/lib/document-categories";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { friendlySaveError, notifyError, notifySuccess } from "@/lib/notify";
import { saveDocument } from "@/lib/cms-actions";
import type { Document } from "@prisma/client";

type Props = { document?: Document };

export function DocumentForm({ document }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState(document?.category ?? "PUBLIC_DOCUMENT");
  const [saving, setSaving] = useState(false);
  const selectedCategory = DOCUMENT_CATEGORY_OPTIONS.find((o) => o.value === category);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      const result = await saveDocument(formData);
      notifySuccess(document ? ALERT_MESSAGES.documentUpdated : ALERT_MESSAGES.documentCreated);
      if (!document) {
        router.push(`/admin/documents/${result.id}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      notifyError(friendlySaveError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={handleSubmit} className="admin-form-card max-w-3xl">
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
            status is Published.
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
      <FormField label="Publishing status" name="status">
        <select
          name="status"
          defaultValue={document?.status ?? "DRAFT"}
          className="admin-input"
        >
          <option value="DRAFT">Draft — not visible on the website</option>
          <option value="PUBLISHED">Published — available for download</option>
        </select>
      </FormField>
      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary" disabled={saving}>
          {saving ? "Saving…" : document ? "Save Document" : "Create Document"}
        </button>
      </div>
    </form>
  );
}
