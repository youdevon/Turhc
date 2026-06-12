"use client";

import { FormField } from "../FormField";
import { SlugUrlField } from "../SlugUrlField";
import { FramedMediaUploadField } from "../FramedMediaUploadField";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { friendlySaveError, notifyError, notifySuccess } from "@/lib/notify";
import { PUBLISHING_STATUS_OPTIONS } from "@/lib/admin-select-options";
import { saveNews } from "@/lib/cms-actions";
import type { NewsPost } from "@prisma/client";

type Props = {
  post?: NewsPost & { featuredImage?: { url: string } | null };
};

export function NewsForm({ post }: Props) {
  async function handleSubmit(formData: FormData) {
    try {
      await saveNews(formData);
      notifySuccess(post ? ALERT_MESSAGES.newsUpdated : ALERT_MESSAGES.newsCreated);
    } catch (error) {
      notifyError(friendlySaveError(error));
    }
  }

  return (
    <form action={handleSubmit} className="border border-border bg-surface-elevated p-6 space-y-6 max-w-3xl">
      {post && <input type="hidden" name="id" value={post.id} />}

      <section className="space-y-4">
        <h3 className="font-semibold">Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Title" name="title" required defaultValue={post?.title} />
          <SlugUrlField prefix="/news/" defaultValue={post?.slug} help="The web address for this article. Leave blank to generate from the title." />
        </div>
        <FormField label="Category" name="category" required defaultValue={post?.category ?? "News"} />
        <FormField label="Summary" name="summary" required defaultValue={post?.summary} help="Short introduction shown on listing pages." />
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Page Content</h3>
        <FormField label="Article body" name="body" rows={10} required defaultValue={post?.body} />
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Images and Media</h3>
        <div>
          <p className="text-sm font-medium text-foreground-muted mb-2">Featured image</p>
          <FramedMediaUploadField
            uploadName="featuredImageId"
            defaultMediaId={post?.featuredImageId ?? ""}
            defaultPhotoUrl={post?.featuredImage?.url ?? null}
            defaultFocusX={post?.imageFocusX ?? 50}
            defaultFocusY={post?.imageFocusY ?? 50}
            defaultZoom={post?.imageZoom ?? 100}
            preset="16x9"
          />
          {post?.featuredImageId && <input type="hidden" name="featuredImageId" value={post.featuredImageId} />}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Publish Settings</h3>
        <FormField label="Publishing status" name="status" defaultValue={post?.status ?? "DRAFT"}>
          <select name="status" defaultValue={post?.status ?? "DRAFT"} className="admin-input">
            {PUBLISHING_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>
      </section>

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary">Save</button>
      </div>
    </form>
  );
}
