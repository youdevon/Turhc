"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FramedImageField } from "../FramedImageField";
import { FormSection } from "../FormSection";
import { ContentActionBar } from "../ContentActionBar";
import { LandingSectionHeadingFields } from "./LandingSectionHeadingFields";
import {
  discardAboutPageDraft,
  publishAboutPage,
  saveAboutPageDraft,
} from "@/lib/draft-actions";
import {
  ABOUT_SECTION_KEYS,
  type AboutPageContent,
  type AboutPageContentWithMeta,
  type AboutStatItem,
} from "@/lib/about-page";
import type { LandingSectionContent } from "@/lib/landing-page";

type Props = {
  initialContent: AboutPageContentWithMeta;
};

const TABS = [
  { id: "hero", label: "Hero" },
  { id: "content", label: "Who We Are" },
  { id: "vision", label: "Vision & Mission" },
  { id: "images", label: "Images" },
  { id: "stats", label: "Statistics" },
  { id: "leadership", label: "Leadership Intro" },
  { id: "seo", label: "SEO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function withEditableStats(content: AboutPageContentWithMeta): AboutPageContentWithMeta {
  const statItems = [...content.statItems];
  while (statItems.length < 3) {
    statItems.push({
      label: "",
      value: "",
      prefix: null,
      suffix: null,
      icon: null,
      displayOrder: statItems.length,
      isActive: false,
    });
  }
  return { ...content, statItems: statItems.slice(0, 3) };
}

export function AboutPageEditor({ initialContent }: Props) {
  const router = useRouter();
  const [content, setContent] = useState(() => withEditableStats(initialContent));
  const [activeTab, setActiveTab] = useState<TabId>("hero");
  const [saving, setSaving] = useState(false);

  const whoWeAre = content.sections[ABOUT_SECTION_KEYS.WHO_WE_ARE];
  const leadership = content.sections[ABOUT_SECTION_KEYS.LEADERSHIP];
  const vm = whoWeAre.settings;

  function updateHero(patch: Partial<AboutPageContent["hero"]>) {
    setContent((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }));
  }

  function updateSection(
    key: typeof ABOUT_SECTION_KEYS.WHO_WE_ARE | typeof ABOUT_SECTION_KEYS.LEADERSHIP,
    patch: Partial<(typeof content.sections)[typeof key]>
  ) {
    setContent((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: { ...prev.sections[key], ...patch },
      },
    }));
  }

  function updateWhoWeAreSettings(patch: Record<string, unknown>) {
    setContent((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [ABOUT_SECTION_KEYS.WHO_WE_ARE]: {
          ...prev.sections[ABOUT_SECTION_KEYS.WHO_WE_ARE],
          settings: { ...prev.sections[ABOUT_SECTION_KEYS.WHO_WE_ARE].settings, ...patch },
        },
      },
    }));
  }

  function updateLeadershipSettings(patch: Record<string, unknown>) {
    setContent((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [ABOUT_SECTION_KEYS.LEADERSHIP]: {
          ...prev.sections[ABOUT_SECTION_KEYS.LEADERSHIP],
          settings: { ...prev.sections[ABOUT_SECTION_KEYS.LEADERSHIP].settings, ...patch },
        },
      },
    }));
  }

  function updateImages(patch: Partial<AboutPageContent["images"]>) {
    setContent((prev) => ({ ...prev, images: { ...prev.images, ...patch } }));
  }

  function updateStat(index: number, patch: Partial<AboutStatItem>) {
    setContent((prev) => ({
      ...prev,
      statItems: prev.statItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  async function runAction(action: (fd: FormData) => Promise<void>) {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("payload", JSON.stringify(content));
      await action(formData);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const isPublished = content.status === "PUBLISHED";
  const hasDraft = initialContent.hasDraft ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "admin-btn-primary" : "admin-btn-secondary"}
          >
            {tab.label}
          </button>
        ))}
        <Link href="/admin/leadership" className="admin-btn-secondary ml-auto">
          Manage leaders
        </Link>
      </div>

      {activeTab === "hero" && (
        <FormSection title="Page hero" description="Banner at the top of the About page.">
          <div className="admin-field-grid">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Eyebrow</span>
              <input
                value={content.hero.eyebrow ?? ""}
                onChange={(e) => updateHero({ eyebrow: e.target.value || null })}
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Overlay strength</span>
              <input
                type="number"
                min={0.2}
                max={0.9}
                step={0.05}
                value={content.hero.overlayStrength}
                onChange={(e) => updateHero({ overlayStrength: parseFloat(e.target.value) || 0.55 })}
                className="admin-input"
              />
            </label>
          </div>
          <label className="space-y-1.5 text-sm block">
            <span className="font-medium text-foreground-muted">Title</span>
            <input
              value={content.hero.title ?? ""}
              onChange={(e) => updateHero({ title: e.target.value || null })}
              className="admin-input"
            />
          </label>
          <label className="space-y-1.5 text-sm block">
            <span className="font-medium text-foreground-muted">Subtitle</span>
            <textarea
              rows={2}
              value={content.hero.subtitle ?? ""}
              onChange={(e) => updateHero({ subtitle: e.target.value || null })}
              className="admin-input"
            />
          </label>
          <FramedImageField
            label="Hero background image"
            value={content.hero.imageUrl ?? ""}
            onChange={(imageUrl) => updateHero({ imageUrl: imageUrl || null })}
            preset="page-hero"
            focusX={content.hero.imageFocusX}
            focusY={content.hero.imageFocusY}
            zoom={content.hero.imageZoom}
            onFramingChange={(framing) =>
              updateHero({
                imageFocusX: framing.imageFocusX,
                imageFocusY: framing.imageFocusY,
                imageZoom: framing.imageZoom,
              })
            }
          />
          <label className="space-y-1.5 text-sm block">
            <span className="font-medium text-foreground-muted">Hero image alt text</span>
            <input
              value={content.hero.imageAlt ?? ""}
              onChange={(e) => updateHero({ imageAlt: e.target.value || null })}
              className="admin-input"
            />
          </label>
        </FormSection>
      )}

      {activeTab === "content" && (
        <FormSection
          title="Who We Are"
          description="Main copy beside the image stack. Separate paragraphs with a blank line."
        >
          <label className="flex items-center gap-2 text-sm mb-4">
            <input
              type="checkbox"
              checked={whoWeAre.isActive}
              onChange={(e) => updateSection(ABOUT_SECTION_KEYS.WHO_WE_ARE, { isActive: e.target.checked })}
            />
            <span>Show Who We Are section</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <LandingSectionHeadingFields
              section={whoWeAre as LandingSectionContent}
              onUpdate={(patch) =>
                updateSection(ABOUT_SECTION_KEYS.WHO_WE_ARE, patch as Partial<typeof whoWeAre>)
              }
              onUpdateSettings={updateWhoWeAreSettings}
              showDescription
              descriptionLabel="Body text"
              descriptionField="body"
            />
          </div>
        </FormSection>
      )}

      {activeTab === "vision" && (
        <FormSection title="Vision & Mission" description="Two highlight boxes below the main copy.">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Vision title</span>
              <input
                value={(vm.visionTitle as string) ?? "Vision"}
                onChange={(e) => updateWhoWeAreSettings({ visionTitle: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Mission title</span>
              <input
                value={(vm.missionTitle as string) ?? "Mission"}
                onChange={(e) => updateWhoWeAreSettings({ missionTitle: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="font-medium text-foreground-muted">Vision description</span>
              <textarea
                rows={3}
                value={(vm.visionDescription as string) ?? ""}
                onChange={(e) => updateWhoWeAreSettings({ visionDescription: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="font-medium text-foreground-muted">Mission description</span>
              <textarea
                rows={3}
                value={(vm.missionDescription as string) ?? ""}
                onChange={(e) => updateWhoWeAreSettings({ missionDescription: e.target.value })}
                className="admin-input"
              />
            </label>
          </div>
        </FormSection>
      )}

      {activeTab === "images" && (
        <FormSection
          title="Section image"
          description="Single 16:9 image beside the Who We Are copy. Optional established-year badge overlay."
        >
          <FramedImageField
            label="Image (16:9)"
            value={whoWeAre.imageUrl ?? ""}
            onChange={(imageUrl) => updateSection(ABOUT_SECTION_KEYS.WHO_WE_ARE, { imageUrl: imageUrl || null })}
            preset="16x9"
            focusX={whoWeAre.imageFocusX}
            focusY={whoWeAre.imageFocusY}
            zoom={whoWeAre.imageZoom}
            onFramingChange={(framing) =>
              updateSection(ABOUT_SECTION_KEYS.WHO_WE_ARE, {
                imageFocusX: framing.imageFocusX,
                imageFocusY: framing.imageFocusY,
                imageZoom: framing.imageZoom,
              })
            }
          />
          <label className="space-y-1.5 text-sm block">
            <span className="font-medium text-foreground-muted">Image alt text</span>
            <input
              value={whoWeAre.imageAlt ?? ""}
              onChange={(e) => updateSection(ABOUT_SECTION_KEYS.WHO_WE_ARE, { imageAlt: e.target.value || null })}
              className="admin-input"
            />
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Established year (optional badge)</span>
              <input
                value={content.images.establishedYear ?? ""}
                onChange={(e) => updateImages({ establishedYear: e.target.value || null })}
                className="admin-input"
                placeholder="e.g. 2018"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Badge label</span>
              <input
                value={content.images.establishedLabel ?? "Established"}
                onChange={(e) => updateImages({ establishedLabel: e.target.value || "Established" })}
                className="admin-input"
              />
            </label>
          </div>
        </FormSection>
      )}

      {activeTab === "stats" && (
        <FormSection title="Statistics" description="Up to three metrics shown under Vision & Mission.">
          {content.statItems.slice(0, 3).map((stat, index) => (
            <div key={stat.id ?? index} className="grid md:grid-cols-4 gap-3 p-4 border border-border rounded-lg">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground-muted">Prefix</span>
                <input
                  value={stat.prefix ?? ""}
                  onChange={(e) => updateStat(index, { prefix: e.target.value || null })}
                  className="admin-input"
                  placeholder="$"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground-muted">Value</span>
                <input
                  value={stat.value}
                  onChange={(e) => updateStat(index, { value: e.target.value })}
                  className="admin-input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground-muted">Suffix</span>
                <input
                  value={stat.suffix ?? ""}
                  onChange={(e) => updateStat(index, { suffix: e.target.value || null })}
                  className="admin-input"
                  placeholder="%"
                />
              </label>
              <label className="space-y-1.5 text-sm md:col-span-1">
                <span className="font-medium text-foreground-muted">Label</span>
                <input
                  value={stat.label}
                  onChange={(e) => updateStat(index, { label: e.target.value })}
                  className="admin-input"
                />
              </label>
              <label className="flex items-center gap-2 text-sm md:col-span-4">
                <input
                  type="checkbox"
                  checked={stat.isActive}
                  onChange={(e) => updateStat(index, { isActive: e.target.checked })}
                />
                <span>Show this statistic</span>
              </label>
            </div>
          ))}
        </FormSection>
      )}

      {activeTab === "leadership" && (
        <FormSection
          title="Leadership section intro"
          description="Heading above the leadership cards. Team members are managed separately."
        >
          <label className="flex items-center gap-2 text-sm mb-4">
            <input
              type="checkbox"
              checked={leadership.isActive}
              onChange={(e) => updateSection(ABOUT_SECTION_KEYS.LEADERSHIP, { isActive: e.target.checked })}
            />
            <span>Show leadership section</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <LandingSectionHeadingFields
              section={leadership as LandingSectionContent}
              onUpdate={(patch) =>
                updateSection(ABOUT_SECTION_KEYS.LEADERSHIP, patch as Partial<typeof leadership>)
              }
              onUpdateSettings={updateLeadershipSettings}
              showDescription
              descriptionLabel="Intro text"
              descriptionField="subtitle"
            />
          </div>
        </FormSection>
      )}

      {activeTab === "seo" && (
        <FormSection title="SEO">
          <label className="space-y-1.5 text-sm block">
            <span className="font-medium text-foreground-muted">Meta title</span>
            <input
              value={content.metaTitle ?? ""}
              onChange={(e) => setContent((prev) => ({ ...prev, metaTitle: e.target.value || null }))}
              className="admin-input"
            />
          </label>
          <label className="space-y-1.5 text-sm block">
            <span className="font-medium text-foreground-muted">Meta description</span>
            <textarea
              rows={3}
              value={content.metaDescription ?? ""}
              onChange={(e) => setContent((prev) => ({ ...prev, metaDescription: e.target.value || null }))}
              className="admin-input"
            />
          </label>
        </FormSection>
      )}

      <ContentActionBar
        hasDraft={hasDraft}
        isPublished={isPublished}
        liveUrl="/about"
        previewUrl="/preview/about"
        saving={saving}
        onSaveDraft={() => runAction(saveAboutPageDraft)}
        onPublish={() => runAction(publishAboutPage)}
        onDiscardDraft={
          hasDraft
            ? async () => {
                setSaving(true);
                try {
                  await discardAboutPageDraft();
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
