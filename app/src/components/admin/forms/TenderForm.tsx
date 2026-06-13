"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "../FormField";
import { SlugUrlField } from "../SlugUrlField";
import { HeroImagePreview } from "../HeroImagePreview";
import { FramedImageField } from "../FramedImageField";
import { ContentActionBar } from "../ContentActionBar";
import { TENDER_STATUS_OPTIONS } from "@/lib/admin-select-options";
import {
  discardTenderDraft,
  publishTenderContent,
  saveTenderDraft,
} from "@/lib/draft-actions";
import type { Tender } from "@prisma/client";

type Props = {
  tender?: Tender;
  hasDraft?: boolean;
};

export function TenderForm({ tender, hasDraft = false }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [heroImageUrl, setHeroImageUrl] = useState(tender?.heroImageUrl ?? "");
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

  const isPublished = tender?.statusContent === "PUBLISHED";

  return (
    <div className="space-y-6">
      <form ref={formRef} className="border border-border bg-surface-elevated p-6 space-y-6 max-w-3xl">
        {tender && <input type="hidden" name="id" value={tender.id} />}

        <section className="space-y-4">
          <h3 className="font-semibold">Basic Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Reference number" name="referenceNumber" required defaultValue={tender?.referenceNumber} />
            <SlugUrlField prefix="/tenders/" defaultValue={tender?.slug} help="The web address for this tender page. Leave blank to generate from the title." />
          </div>
          <FormField label="Title" name="title" required defaultValue={tender?.title} />
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Category" name="category" required defaultValue={tender?.category} />
            <FormField label="Department / ministry" name="department" required defaultValue={tender?.department} />
          </div>
          <FormField label="Description" name="description" rows={6} required defaultValue={tender?.description} />
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold">Dates and Value</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Opening date" name="openingDate" type="date" required defaultValue={tender?.openingDate?.toISOString().split("T")[0]} />
            <FormField label="Closing date" name="closingDate" type="date" required defaultValue={tender?.closingDate?.toISOString().split("T")[0]} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Estimated value" name="estimatedValue" type="number" defaultValue={tender?.estimatedValue?.toString() ?? ""} />
            <FormField label="Successful bidder" name="successfulBidder" defaultValue={tender?.successfulBidder ?? ""} />
          </div>
          <FormField label="Award information" name="awardInfo" rows={3} defaultValue={tender?.awardInfo ?? ""} />
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold">Procurement Status</h3>
          <FormField label="Tender status" name="tenderStatus" defaultValue={tender?.status ?? "OPEN"}>
            <select name="tenderStatus" defaultValue={tender?.status ?? "OPEN"} className="admin-input">
              {TENDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <p className="text-xs text-muted">Procurement progress shown on the public tender page. Use Save Draft / Publish below to control website visibility.</p>
        </section>

        <section className="border border-border bg-background p-5 space-y-4">
          <h3 className="font-semibold">Images and Media</h3>
          <FramedImageField
            label="Hero banner image"
            name="heroImageUrl"
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            help="Optional. Uses the default tenders banner if left empty."
            preset="page-hero"
            fieldPrefix="heroImage"
            defaultFocusX={tender?.heroImageFocusX ?? 50}
            defaultFocusY={tender?.heroImageFocusY ?? 50}
            defaultZoom={tender?.heroImageZoom ?? 100}
          />
          <FormField label="Image description (for accessibility)" name="heroImageAlt" defaultValue={tender?.heroImageAlt ?? ""} />
          <HeroImagePreview imageUrl={heroImageUrl} title={tender?.title ?? "Tender hero"} />
        </section>
      </form>

      <ContentActionBar
        hasDraft={hasDraft}
        isPublished={isPublished}
        liveUrl={tender?.slug ? `/tenders/${tender.slug}` : undefined}
        previewUrl={tender?.slug ? `/preview/tenders/${tender.slug}` : undefined}
        backUrl="/admin/tenders"
        saving={saving}
        onSaveDraft={() => runAction(saveTenderDraft)}
        onPublish={() => runAction(publishTenderContent)}
        onDiscardDraft={
          hasDraft && tender
            ? async () => {
                setSaving(true);
                try {
                  await discardTenderDraft(tender.id, tender.title);
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
