"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "../FormField";
import { FormSection } from "../FormSection";
import { SlugUrlField } from "../SlugUrlField";
import { HeroImagePreview } from "../HeroImagePreview";
import { FramedImageField } from "../FramedImageField";
import { discardPageDraft, publishPageContent, savePageDraft } from "@/lib/draft-actions";
import { ContentActionBar } from "../ContentActionBar";
import type { Page } from "@prisma/client";

type Props = { page?: Page; hasDraft?: boolean };

export function PageForm({ page, hasDraft = false }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [heroImageUrl, setHeroImageUrl] = useState(page?.heroImageUrl ?? "");
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

  const livePath = page?.slug && page.slug !== "home" ? `/${page.slug}` : undefined;

  return (
    <div className="space-y-6 max-w-3xl">
      <form ref={formRef} className="space-y-6">
        {page && <input type="hidden" name="id" value={page.id} />}

        <FormSection
          title="Basic Information"
          description="The page title and website link visitors will use to find this content."
        >
          <div className="admin-field-grid">
            <FormField label="Page title" name="title" required defaultValue={page?.title} />
            <SlugUrlField
              prefix="/"
              defaultValue={page?.slug}
              help="The web address for this page, e.g. about for /about. Leave blank to generate from the title."
            />
          </div>
          <FormField
            label="Short summary"
            name="summary"
            rows={2}
            defaultValue={page?.summary ?? ""}
            help="A brief introduction shown where this page is listed or previewed."
          />
        </FormSection>

        <FormSection
          title="Page Content"
          description="The main body text displayed on the public page."
        >
          <FormField label="Content" name="content" rows={10} required defaultValue={page?.content ?? ""} />
        </FormSection>

        <FormSection
          title="Images and Media"
          description="Optional banner image and supporting visuals at the top of the page."
        >
          <div className="admin-field-grid">
            <FormField label="Banner eyebrow" name="heroEyebrow" defaultValue={page?.heroEyebrow ?? ""} />
            <FormField
              label="Overlay strength"
              name="heroOverlayStrength"
              type="number"
              defaultValue={page?.heroOverlayStrength?.toString() ?? "0.55"}
              help="How dark the banner overlay appears. Use a value between 0.2 and 0.9."
            />
          </div>
          <FormField label="Banner title" name="heroTitle" defaultValue={page?.heroTitle ?? ""} />
          <FormField label="Banner subtitle" name="heroSubtitle" rows={2} defaultValue={page?.heroSubtitle ?? ""} />
          <FramedImageField
            label="Banner background image"
            name="heroImageUrl"
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            preset="page-hero"
            fieldPrefix="heroImage"
            defaultFocusX={page?.heroImageFocusX ?? 50}
            defaultFocusY={page?.heroImageFocusY ?? 50}
            defaultZoom={page?.heroImageZoom ?? 100}
          />
          <FormField
            label="Image description (alt text)"
            name="heroImageAlt"
            defaultValue={page?.heroImageAlt ?? ""}
            help="Describes the banner image for accessibility and search engines."
          />
          <HeroImagePreview imageUrl={heroImageUrl} title={page?.heroTitle ?? page?.title ?? "Page hero"} />
        </FormSection>

        <FormSection
          title="Buttons and Links"
          description="Optional call-to-action shown on the page banner."
        >
          <div className="admin-field-grid">
            <FormField label="Button label" name="heroCtaLabel" defaultValue={page?.heroCtaLabel ?? ""} />
            <FormField label="Button link" name="heroCtaHref" defaultValue={page?.heroCtaHref ?? ""} />
          </div>
        </FormSection>

        <FormSection
          title="SEO / Search Preview"
          description="How this page may appear in search engine results."
        >
          <div className="admin-field-grid">
            <FormField
              label="Search title"
              name="metaTitle"
              defaultValue={page?.metaTitle ?? ""}
              help="Optional title shown in search engine results."
            />
            <FormField
              label="Search description"
              name="metaDescription"
              rows={2}
              defaultValue={page?.metaDescription ?? ""}
              help="Short summary shown in search engine results."
            />
          </div>
        </FormSection>
      </form>

      <ContentActionBar
        hasDraft={hasDraft}
        isPublished={page?.status === "PUBLISHED"}
        liveUrl={livePath}
        previewUrl={page?.slug ? `/preview/pages/${page.slug}` : undefined}
        backUrl="/admin/pages"
        saving={saving}
        onSaveDraft={() => runAction(savePageDraft)}
        onPublish={() => runAction(publishPageContent)}
        onDiscardDraft={
          hasDraft && page
            ? async () => {
                setSaving(true);
                try {
                  await discardPageDraft(page.id, page.title);
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
