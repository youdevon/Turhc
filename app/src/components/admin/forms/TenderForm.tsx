"use client";

import { useState } from "react";
import { FormField } from "../FormField";
import { SlugUrlField } from "../SlugUrlField";
import { HeroImagePreview } from "../HeroImagePreview";
import { FramedImageField } from "../FramedImageField";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { friendlySaveError, notifyError, notifySuccess } from "@/lib/notify";
import { PUBLISHING_STATUS_OPTIONS, TENDER_STATUS_OPTIONS } from "@/lib/admin-select-options";
import { saveTender } from "@/lib/cms-actions";
import type { Tender } from "@prisma/client";

type Props = { tender?: Tender };

export function TenderForm({ tender }: Props) {
  const [heroImageUrl, setHeroImageUrl] = useState(tender?.heroImageUrl ?? "");

  async function handleSubmit(formData: FormData) {
    try {
      await saveTender(formData);
      notifySuccess(tender ? ALERT_MESSAGES.tenderUpdated : ALERT_MESSAGES.tenderCreated);
    } catch (error) {
      notifyError(friendlySaveError(error));
    }
  }

  return (
    <form action={handleSubmit} className="border border-border bg-surface-elevated p-6 space-y-6 max-w-3xl">
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
        <h3 className="font-semibold">Status</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Tender status" name="tenderStatus" defaultValue={tender?.status ?? "OPEN"}>
            <select name="tenderStatus" defaultValue={tender?.status ?? "OPEN"} className="admin-input">
              {TENDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Publishing status" name="status" defaultValue={tender?.statusContent ?? "DRAFT"}>
            <select name="status" defaultValue={tender?.statusContent ?? "DRAFT"} className="admin-input">
              {PUBLISHING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
        </div>
        <p className="text-xs text-muted">Tender status describes procurement progress. Publishing status controls whether the page is visible on the website.</p>
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

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary">Save Tender</button>
      </div>
    </form>
  );
}
