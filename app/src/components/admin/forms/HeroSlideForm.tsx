"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField } from "../FormField";
import { FramedImageField } from "../FramedImageField";
import { HeroImagePreview } from "../HeroImagePreview";
import { StatsRepeater } from "../StatsRepeater";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { friendlySaveError, notifyError, notifySuccess } from "@/lib/notify";
import { MEDIA_TYPE_OPTIONS, PUBLISHING_STATUS_OPTIONS } from "@/lib/admin-select-options";
import { saveHeroSlide } from "@/lib/cms-actions";
import type { HeroSlide } from "@prisma/client";

type Props = { slide?: HeroSlide };

export function HeroSlideForm({ slide }: Props) {
  const router = useRouter();
  const [mediaUrl, setMediaUrl] = useState(slide?.mediaUrl ?? "");

  async function handleSubmit(formData: FormData) {
    try {
      await saveHeroSlide(formData);
      router.refresh();
      notifySuccess(slide ? ALERT_MESSAGES.slideUpdated : ALERT_MESSAGES.slideCreated);
    } catch (error) {
      notifyError(friendlySaveError(error));
    }
  }

  return (
    <form action={handleSubmit} className="border border-border bg-surface-elevated p-6 space-y-6 max-w-3xl">
      {slide && <input type="hidden" name="id" value={slide.id} />}

      <section className="space-y-4">
        <h3 className="font-semibold">Basic Information</h3>
        <FormField label="Internal name" name="title" required defaultValue={slide?.title} help="For your reference in the admin panel only." />
        <FormField label="Eyebrow text" name="eyebrow" defaultValue={slide?.eyebrow ?? ""} help="Small label above the main heading." />
        <FormField label="Heading" name="heading" required defaultValue={slide?.heading} />
        <FormField label="Subheading" name="subheading" defaultValue={slide?.subheading ?? ""} />
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Buttons and Links</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Primary button label" name="primaryLabel" defaultValue={slide?.primaryLabel ?? ""} />
          <FormField label="Primary button link" name="primaryUrl" defaultValue={slide?.primaryUrl ?? ""} />
          <FormField label="Secondary button label" name="secondaryLabel" defaultValue={slide?.secondaryLabel ?? ""} />
          <FormField label="Secondary button link" name="secondaryUrl" defaultValue={slide?.secondaryUrl ?? ""} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Images and Media</h3>
        <FormField label="Background type" name="mediaType" defaultValue={slide?.mediaType ?? "IMAGE"}>
          <select name="mediaType" defaultValue={slide?.mediaType ?? "IMAGE"} className="admin-input">
            {MEDIA_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>
        <FramedImageField
          label="Background image or video"
          name="mediaUrl"
          value={mediaUrl}
          onChange={setMediaUrl}
          required
          preset="hero-contained"
          defaultFocusX={slide?.imageFocusX ?? 50}
          defaultFocusY={slide?.imageFocusY ?? 50}
          defaultZoom={slide?.imageZoom ?? 100}
        />
        {mediaUrl && <HeroImagePreview variant="hero" imageUrl={mediaUrl} title={slide?.heading ?? "Hero slide"} />}
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Display Settings</h3>
        <FormField label="Display order" name="sortOrder" type="number" defaultValue={slide?.sortOrder ?? 0} help="Lower numbers appear first." />
        <FormField label="Overlay darkness" name="overlayOpacity" type="number" defaultValue={slide?.overlayOpacity ?? 0.55} help="How dark the overlay appears over the background." />
        <StatsRepeater initialJson={slide?.statsJson} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="showStats" defaultChecked={slide?.showStats} /> Show highlight stats on this slide
        </label>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Publish Settings</h3>
        <FormField label="Publishing status" name="status" defaultValue={slide?.status ?? "DRAFT"}>
          <select name="status" defaultValue={slide?.status ?? "DRAFT"} className="admin-input">
            {PUBLISHING_STATUS_OPTIONS.filter((o) => o.value !== "ARCHIVED").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>
      </section>

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary">Save Slide</button>
      </div>
    </form>
  );
}
