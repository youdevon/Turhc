"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "../FormField";
import { SlugUrlField } from "../SlugUrlField";
import { FramedMediaUploadField } from "../FramedMediaUploadField";
import { ContentActionBar } from "../ContentActionBar";
import {
  discardNewsDraft,
  publishNewsContent,
  saveNewsDraft,
} from "@/lib/draft-actions";
import type { NewsPost } from "@prisma/client";

type Props = {
  post?: NewsPost & { featuredImage?: { url: string } | null };
  hasDraft?: boolean;
};

export function NewsForm({ post, hasDraft = false }: Props) {
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

  const isPublished = post?.status === "PUBLISHED";

  return (
    <div className="space-y-6">
      <form ref={formRef} className="border border-border bg-surface-elevated p-6 space-y-6 max-w-3xl">
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
      </form>

      <ContentActionBar
        hasDraft={hasDraft}
        isPublished={isPublished}
        liveUrl={post?.slug ? `/news/${post.slug}` : undefined}
        previewUrl={post?.slug ? `/preview/news/${post.slug}` : undefined}
        backUrl="/admin/news"
        saving={saving}
        onSaveDraft={() => runAction(saveNewsDraft)}
        onPublish={() => runAction(publishNewsContent)}
        onDiscardDraft={
          hasDraft && post
            ? async () => {
                setSaving(true);
                try {
                  await discardNewsDraft(post.id, post.title);
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
