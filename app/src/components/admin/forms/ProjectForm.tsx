"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "../FormField";
import { SlugUrlField } from "../SlugUrlField";
import { FramedImageField } from "../FramedImageField";
import { PROJECT_STATUS_OPTIONS } from "@/lib/admin-select-options";
import { ProjectCard } from "@/components/public/ProjectCard";
import { DEFAULT_PROJECT_CARD_IMAGE } from "@/data/stock-images";
import { getProjectImageUrl } from "@/lib/images";
import {
  discardProjectDraft,
  publishProject,
  saveProjectDraft,
} from "@/lib/draft-actions";
import { ContentActionBar } from "../ContentActionBar";
import type { Project } from "@prisma/client";

type Props = {
  project?: Project;
  hasDraft?: boolean;
};

export function ProjectForm({ project, hasDraft = false }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(project?.featuredImageUrl ?? "");
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

  const isPublished = project?.statusContent === "PUBLISHED";

  return (
    <div className="space-y-6">
      <form ref={formRef} className="border border-border bg-surface-elevated p-6 space-y-6 max-w-3xl">
        {project && <input type="hidden" name="id" value={project.id} />}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Title" name="title" required defaultValue={project?.title} />
          <SlugUrlField prefix="/projects/" defaultValue={project?.slug} help="The web address for this project page. Leave blank to generate from the title." />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Sector" name="sector" required defaultValue={project?.sector} />
          <FormField label="Location" name="location" required defaultValue={project?.location} />
        </div>
        <FormField label="Description" name="description" rows={6} required defaultValue={project?.description} />
        <FormField
          label="Card Summary"
          name="cardSummary"
          rows={3}
          defaultValue={project?.cardSummary ?? ""}
          help="Short summary shown on homepage and project listing cards"
        />
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Project status" name="projectStatus" defaultValue={project?.status ?? "PLANNED"}>
            <select
              name="projectStatus"
              defaultValue={project?.status ?? "PLANNED"}
              className="admin-input"
            >
              {PROJECT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Progress %" name="progressPercent" type="number" defaultValue={project?.progressPercent ?? 0} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Contractor" name="contractor" defaultValue={project?.contractor ?? ""} />
          <FormField
            label="Contract Value"
            name="contractValue"
            type="number"
            defaultValue={project?.contractValue?.toString() ?? ""}
          />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            label="Start Date"
            name="startDate"
            type="date"
            defaultValue={project?.startDate?.toISOString().split("T")[0] ?? ""}
          />
          <FormField
            label="Expected Completion"
            name="expectedCompletion"
            type="date"
            defaultValue={project?.expectedCompletion?.toISOString().split("T")[0] ?? ""}
          />
          <FormField
            label="Actual Completion"
            name="actualCompletion"
            type="date"
            defaultValue={project?.actualCompletion?.toISOString().split("T")[0] ?? ""}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={project?.featured} className="rounded" />
            Show in homepage Infrastructure section
          </label>
        </div>

        <section className="border border-border bg-background p-5 space-y-4">
          <h3 className="font-semibold">Featured Image</h3>
          <FramedImageField
            label="Featured image"
            name="featuredImageUrl"
            value={featuredImageUrl}
            onChange={setFeaturedImageUrl}
            preset="16x9"
            defaultFocusX={project?.imageFocusX ?? 50}
            defaultFocusY={project?.imageFocusY ?? 50}
            defaultZoom={project?.imageZoom ?? 100}
          />
          <FormField label="Featured Image Alt Text" name="featuredImageAlt" defaultValue={project?.featuredImageAlt ?? ""} />
          {project?.featuredImageId && (
            <input type="hidden" name="featuredImageId" value={project.featuredImageId} />
          )}
          <div>
            <p className="text-sm font-medium text-foreground-muted mb-2">Homepage Card Preview</p>
            <div className="max-w-sm pointer-events-none">
              <ProjectCard
                slug={project?.slug ?? "preview"}
                title={project?.title ?? "Project Title"}
                sector={project?.sector ?? "Sector"}
                location={project?.location ?? "Location"}
                status={project?.status ?? "IN_PROGRESS"}
                progressPercent={project?.progressPercent ?? 0}
                imageUrl={getProjectImageUrl(
                  {
                    featuredImageUrl: featuredImageUrl || null,
                    title: project?.title ?? "Project Title",
                    sector: project?.sector,
                  },
                  DEFAULT_PROJECT_CARD_IMAGE
                )}
                imageAlt={project?.featuredImageAlt ?? project?.title ?? "Project card preview"}
                summary={project?.cardSummary ?? "Card summary preview"}
                contractor={project?.contractor}
                contractValue={project?.contractValue?.toString()}
              />
            </div>
          </div>
        </section>
      </form>

      <ContentActionBar
        hasDraft={hasDraft}
        isPublished={isPublished}
        liveUrl={project?.slug ? `/projects/${project.slug}` : undefined}
        previewUrl={project?.slug ? `/preview/projects/${project.slug}` : undefined}
        backUrl="/admin/projects"
        saving={saving}
        onSaveDraft={() => runAction(saveProjectDraft)}
        onPublish={() => runAction(publishProject)}
        onDiscardDraft={
          hasDraft && project
            ? async () => {
                setSaving(true);
                try {
                  await discardProjectDraft(project.id, project.title);
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
