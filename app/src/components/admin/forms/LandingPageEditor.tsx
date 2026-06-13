"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { HeroImagePreview } from "../HeroImagePreview";
import { IntroImagePreview } from "../IntroImagePreview";
import { FramedImageField } from "../FramedImageField";
import {
  discardLandingPageDraft,
  discardLandingV2PageDraft,
  publishLandingPage,
  publishLandingV2Page,
  saveLandingPageDraft,
  saveLandingV2PageDraft,
} from "@/lib/draft-actions";
import { ContentActionBar } from "../ContentActionBar";
import {
  LANDING_SECTION_KEYS,
  getWhoWeAreColorSettings,
  type GovernanceLink,
  type LandingPageContent,
  type LandingHeroSlideInput,
  type LandingStatItem,
  type IntroImagePosition,
  type MandateCard,
  type WhoWeAreColorSettings,
} from "@/lib/landing-page";
import {
  LANDING_V2_SECTION_KEYS,
  type LandingV2PageContent,
  type LandingV2QuickLink,
  type LandingV2SectionKey,
} from "@/lib/landing-page-v2";
import { V2_VISUAL_PRESETS } from "@/lib/landing-page-v2-presets";
import { MANDATE_ICON_OPTIONS } from "@/lib/admin-select-options";
import { cn } from "@/lib/utils";
import { LandingSectionHeadingFields } from "./LandingSectionHeadingFields";
import { WhoWeAreColorFields } from "./WhoWeAreColorFields";

type Props = {
  initialContent: LandingPageContent & { hasDraft?: boolean };
  initialV2Content: LandingV2PageContent & { hasDraft?: boolean };
};

const TABS = [
  { id: "prehero", label: "Pre-hero" },
  { id: "hero", label: "Hero" },
  { id: "intro", label: "Intro / Mandate" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "stats", label: "Stats" },
  { id: "tenders", label: "Tenders" },
  { id: "news", label: "News" },
  { id: "contractor", label: "Contractor CTA" },
  { id: "governance", label: "Governance" },
  { id: "contact", label: "Contact Strip" },
  { id: "seo", label: "SEO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function SectionCard({
  title,
  description,
  children,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border border-border bg-surface-elevated overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface/50 transition-colors"
      >
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
        </div>
        <span className="text-muted text-sm">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">{children}</div>}
    </section>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
  help,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  help?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded"
      />
      <span>
        <span className="font-medium">{label}</span>
        {help && <span className="block text-xs text-muted mt-0.5">{help}</span>}
      </span>
    </label>
  );
}

export function HomepageEditor({ initialContent, initialV2Content }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("prehero");
  const [content, setContent] = useState<LandingPageContent>(initialContent);
  const [v2Content, setV2Content] = useState<LandingV2PageContent>(initialV2Content);
  const [saving, setSaving] = useState(false);

  const whoWeAre = content.sections[LANDING_SECTION_KEYS.WHO_WE_ARE];
  const mandate = content.sections[LANDING_SECTION_KEYS.MANDATE];
  const infrastructure = content.sections[LANDING_SECTION_KEYS.INFRASTRUCTURE];
  const statsSection = content.sections[LANDING_SECTION_KEYS.STATS];
  const tenders = content.sections[LANDING_SECTION_KEYS.TENDERS];
  const news = content.sections[LANDING_SECTION_KEYS.NEWS];
  const contractor = content.sections[LANDING_SECTION_KEYS.CONTRACTOR_CTA];
  const governance = content.sections[LANDING_SECTION_KEYS.GOVERNANCE];
  const contact = content.sections[LANDING_SECTION_KEYS.CONTACT_CTA];

  const preHero = v2Content.sections[LANDING_V2_SECTION_KEYS.PRE_HERO];
  const infrastructureV2 = v2Content.sections[LANDING_V2_SECTION_KEYS.INFRASTRUCTURE];
  const tendersV2 = v2Content.sections[LANDING_V2_SECTION_KEYS.TENDERS];
  const newsV2 = v2Content.sections[LANDING_V2_SECTION_KEYS.NEWS];
  const governanceV2 = v2Content.sections[LANDING_V2_SECTION_KEYS.GOVERNANCE];
  const contactV2 = v2Content.sections[LANDING_V2_SECTION_KEYS.CONTACT_CTA];
  const quickLinks = (preHero.settings.quickLinks as LandingV2QuickLink[] | undefined) ?? [];
  const governanceLinks = (governance.settings.links as GovernanceLink[] | undefined) ?? [];

  const mandateCards = (mandate.settings.cards as MandateCard[] | undefined) ?? [];
  const introShowImage = (whoWeAre.settings.showImage as boolean | undefined) ?? true;
  const introImagePosition = (whoWeAre.settings.imagePosition as IntroImagePosition | undefined) ?? "right";
  const whoWeAreColors = getWhoWeAreColorSettings(whoWeAre);

  function updateSection<K extends keyof typeof content.sections>(
    key: K,
    patch: Partial<(typeof content.sections)[K]>
  ) {
    setContent((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: { ...prev.sections[key], ...patch },
      },
    }));
  }

  function updateSectionSettings<K extends keyof typeof content.sections>(
    key: K,
    settings: Record<string, unknown>
  ) {
    setContent((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: {
          ...prev.sections[key],
          settings: { ...prev.sections[key].settings, ...settings },
        },
      },
    }));
  }

  function updateV2Section(key: LandingV2SectionKey, patch: Record<string, unknown>) {
    setV2Content((prev) => ({
      ...prev,
      sections: { ...prev.sections, [key]: { ...prev.sections[key], ...patch } },
    }));
  }

  function updateV2Settings(key: LandingV2SectionKey, settings: Record<string, unknown>) {
    setV2Content((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: {
          ...prev.sections[key],
          settings: { ...prev.sections[key].settings, ...settings },
        },
      },
    }));
  }

  function setPairedSectionActive(
    homeKey: keyof typeof content.sections,
    v2Key: LandingV2SectionKey,
    isActive: boolean
  ) {
    updateSection(homeKey, { isActive });
    updateV2Section(v2Key, { isActive });
  }

  function updateSlide(index: number, patch: Partial<LandingHeroSlideInput>) {
    setContent((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    }));
  }

  function addSlide() {
    setContent((prev) => ({
      ...prev,
      heroSlides: [
        ...prev.heroSlides,
        {
          title: `Hero ${prev.heroSlides.length + 1}`,
          eyebrow: "",
          heading: "New slide heading",
          subheading: "",
          primaryLabel: "Learn more",
          primaryUrl: "/projects",
          secondaryLabel: "",
          secondaryUrl: "",
          mediaUrl: "",
          mediaAlt: "",
          overlayOpacity: 0.55,
          sortOrder: prev.heroSlides.length,
          isActive: true,
        },
      ],
    }));
  }

  function removeSlide(index: number) {
    setContent((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, i) => i !== index),
    }));
  }

  function updateStat(index: number, patch: Partial<LandingStatItem>) {
    setContent((prev) => ({
      ...prev,
      statItems: prev.statItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  function addStat() {
    setContent((prev) => ({
      ...prev,
      statItems: [
        ...prev.statItems,
        {
          label: "New stat",
          value: "0",
          prefix: null,
          suffix: null,
          icon: null,
          displayOrder: prev.statItems.length,
          isActive: true,
        },
      ],
    }));
  }

  function removeStat(index: number) {
    setContent((prev) => ({
      ...prev,
      statItems: prev.statItems.filter((_, i) => i !== index),
    }));
  }

  function buildLandingPayload() {
    const formData = new FormData();
    formData.set("payload", JSON.stringify(content));
    return formData;
  }

  function buildV2Payload() {
    const formData = new FormData();
    formData.set("payload", JSON.stringify(v2Content));
    return formData;
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      await Promise.all([saveLandingPageDraft(buildLandingPayload()), saveLandingV2PageDraft(buildV2Payload())]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      await Promise.all([publishLandingPage(buildLandingPayload()), publishLandingV2Page(buildV2Payload())]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDiscardDraft() {
    setSaving(true);
    try {
      await Promise.all([
        initialContent.hasDraft ? discardLandingPageDraft() : Promise.resolve(),
        initialV2Content.hasDraft ? discardLandingV2PageDraft() : Promise.resolve(),
      ]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const hasDraft = Boolean(initialContent.hasDraft || initialV2Content.hasDraft);
  const isPublished = content.status === "PUBLISHED" && v2Content.status === "PUBLISHED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-border pb-4">
        <p className="text-sm text-muted max-w-2xl">
          Edit all homepage content in one place — pre-hero, hero slides, section copy, statistics, and calls-to-action.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/preview/home"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex gap-2 items-center"
          >
            Preview draft <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex gap-2 items-center"
          >
            View live homepage <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="admin-actions border-b border-border pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "admin-btn-toggle",
              activeTab === tab.id && "admin-btn-toggle--active"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "prehero" && (
        <div className="space-y-4">
          <SectionCard title="Pre-hero band" description="Headline, imagery, and quick links above the hero carousel.">
            <ToggleField
              label="Show pre-hero band on homepage"
              checked={content.hero.v2ShowPreHero !== false && preHero.isActive}
              onChange={(isActive) => {
                setContent((prev) => ({ ...prev, hero: { ...prev.hero, v2ShowPreHero: isActive } }));
                updateV2Section(LANDING_V2_SECTION_KEYS.PRE_HERO, { isActive });
              }}
            />
            <label className="space-y-1.5 text-sm max-w-md">
              <span className="font-medium text-foreground-muted">Pre-hero visual preset</span>
              <select
                value={content.hero.v2PreHeroPreset ?? "soft_blueprint"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      v2PreHeroPreset: e.target.value as typeof content.hero.v2PreHeroPreset,
                    },
                  }))
                }
                className="admin-input"
              >
                <option value="soft_blueprint">Soft blueprint background</option>
                <option value="floating_image">Floating image right</option>
                <option value="wide_scene">Wide image scene</option>
                <option value="split">Split text and image</option>
                <option value="image_behind">Image behind text</option>
                <option value="minimal">Minimal text only</option>
              </select>
            </label>
            <input
              value={preHero.eyebrow ?? ""}
              onChange={(e) => updateV2Section(LANDING_V2_SECTION_KEYS.PRE_HERO, { eyebrow: e.target.value })}
              className="admin-input"
              placeholder="Eyebrow label"
            />
            <input
              value={preHero.sectionTitle ?? ""}
              onChange={(e) => updateV2Section(LANDING_V2_SECTION_KEYS.PRE_HERO, { sectionTitle: e.target.value })}
              className="admin-input"
              placeholder="Headline main"
            />
            <input
              value={(preHero.settings.headingEmphasis as string) ?? ""}
              onChange={(e) => updateV2Settings(LANDING_V2_SECTION_KEYS.PRE_HERO, { headingEmphasis: e.target.value })}
              className="admin-input"
              placeholder="Headline emphasis"
            />
            <textarea
              value={preHero.subtitle ?? ""}
              onChange={(e) => updateV2Section(LANDING_V2_SECTION_KEYS.PRE_HERO, { subtitle: e.target.value })}
              className="admin-input"
              placeholder="Supporting text"
              rows={3}
            />
            <select
              value={(preHero.settings.visualPreset as string) ?? "soft_blueprint"}
              onChange={(e) => updateV2Settings(LANDING_V2_SECTION_KEYS.PRE_HERO, { visualPreset: e.target.value })}
              className="admin-input"
            >
              {V2_VISUAL_PRESETS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FramedImageField
              label="Background image"
              value={preHero.imageUrl ?? ""}
              onChange={(imageUrl) =>
                updateV2Section(LANDING_V2_SECTION_KEYS.PRE_HERO, { imageUrl: imageUrl || null })
              }
              preset="page-hero"
              focusX={preHero.imageFocusX ?? 50}
              focusY={preHero.imageFocusY ?? 50}
              zoom={preHero.imageZoom ?? 100}
              onFramingChange={(framing) => updateV2Section(LANDING_V2_SECTION_KEYS.PRE_HERO, framing)}
            />
            <FramedImageField
              label="Foreground image"
              value={(preHero.settings.foregroundImageUrl as string) ?? ""}
              onChange={(foregroundImageUrl) =>
                updateV2Settings(LANDING_V2_SECTION_KEYS.PRE_HERO, { foregroundImageUrl: foregroundImageUrl || null })
              }
              preset="16x9"
              focusX={(preHero.settings.foregroundImageFocusX as number) ?? 50}
              focusY={(preHero.settings.foregroundImageFocusY as number) ?? 50}
              zoom={(preHero.settings.foregroundImageZoom as number) ?? 100}
              onFramingChange={(framing) =>
                updateV2Settings(LANDING_V2_SECTION_KEYS.PRE_HERO, {
                  foregroundImageFocusX: framing.imageFocusX,
                  foregroundImageFocusY: framing.imageFocusY,
                  foregroundImageZoom: framing.imageZoom,
                })
              }
            />
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium">Quick links</p>
              <button
                type="button"
                className="admin-btn-secondary text-sm"
                onClick={() =>
                  updateV2Settings(LANDING_V2_SECTION_KEYS.PRE_HERO, {
                    quickLinks: [...quickLinks, { label: "Link", href: "/", isActive: true }],
                  })
                }
              >
                <Plus className="w-4 h-4 inline" /> Add quick link
              </button>
              {quickLinks.map((link, index) => (
                <div key={index} className="grid md:grid-cols-4 gap-2 border p-3 rounded">
                  <input
                    value={link.label}
                    onChange={(e) =>
                      updateV2Settings(LANDING_V2_SECTION_KEYS.PRE_HERO, {
                        quickLinks: quickLinks.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, label: e.target.value } : item
                        ),
                      })
                    }
                    className="admin-input"
                    placeholder="Label"
                  />
                  <input
                    value={link.href}
                    onChange={(e) =>
                      updateV2Settings(LANDING_V2_SECTION_KEYS.PRE_HERO, {
                        quickLinks: quickLinks.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, href: e.target.value } : item
                        ),
                      })
                    }
                    className="admin-input"
                    placeholder="URL"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={link.isActive !== false}
                      onChange={(e) =>
                        updateV2Settings(LANDING_V2_SECTION_KEYS.PRE_HERO, {
                          quickLinks: quickLinks.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, isActive: e.target.checked } : item
                          ),
                        })
                      }
                    />
                    Show
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateV2Settings(LANDING_V2_SECTION_KEYS.PRE_HERO, {
                        quickLinks: quickLinks.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                    className="admin-btn-danger text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === "hero" && (
        <div className="space-y-4">
          <SectionCard title="Hero layout" description="Carousel visibility and layout preset for the live homepage.">
            <label className="space-y-1.5 text-sm max-w-md">
              <span className="font-medium text-foreground-muted">Hero layout preset</span>
              <select
                value={content.hero.v2HeroPreset ?? "contained_cinematic"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      v2HeroPreset: e.target.value as typeof content.hero.v2HeroPreset,
                    },
                  }))
                }
                className="admin-input"
              >
                <option value="contained_cinematic">Contained cinematic</option>
                <option value="minimal_text">Minimal text only (hide hero)</option>
              </select>
            </label>
          </SectionCard>

          <SectionCard title="Hero slideshow settings" description="Control overlay, timing, and enable/disable the carousel.">
            <ToggleField
              label="Enable hero slideshow"
              checked={content.hero.enabled}
              onChange={(enabled) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, enabled } }))}
            />
            <label className="space-y-1.5 text-sm max-w-md">
              <span className="font-medium text-foreground-muted">Hero layout</span>
              <select
                value={content.hero.layout ?? "contained"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      layout: e.target.value === "full_width" ? "full_width" : "contained",
                    },
                  }))
                }
                className="admin-input"
              >
                <option value="contained">Contained cinematic (recommended)</option>
                <option value="full_width">Full width</option>
              </select>
            </label>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground-muted">Overlay strength (0–1)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={content.hero.overlayStrength}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, overlayStrength: parseFloat(e.target.value) || 0.55 },
                    }))
                  }
                  className="admin-input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground-muted">Time on each slide (seconds)</span>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={Math.round(content.hero.slideDurationMs / 1000)}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, slideDurationMs: (parseInt(e.target.value) || 5) * 1000 },
                    }))
                  }
                  className="admin-input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground-muted">Zoom animation length (seconds)</span>
                <input
                  type="number"
                  min={5}
                  max={20}
                  step={0.5}
                  value={(content.hero.zoomDurationMs / 1000).toFixed(1)}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, zoomDurationMs: Math.round((parseFloat(e.target.value) || 10) * 1000) },
                    }))
                  }
                  className="admin-input"
                />
                <span className="block text-xs text-foreground-muted">
                  Ken Burns zoom on each slide. Should be longer than the slide duration so images crossfade while still moving.
                </span>
              </label>
            </div>
          </SectionCard>

          {content.heroSlides.map((slide, index) => (
            <SectionCard
              key={slide.id ?? `slide-${index}`}
              title={`Slide ${index + 1}: ${slide.heading || "Untitled"}`}
              defaultOpen={index === 0}
            >
              <div className="flex justify-between items-center gap-4">
                <ToggleField
                  label="Active slide"
                  checked={slide.isActive}
                  onChange={(isActive) => updateSlide(index, { isActive })}
                />
                <button
                  type="button"
                  onClick={() => removeSlide(index)}
                  className="admin-btn-danger"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1.5 text-sm md:col-span-2">
                  <span className="font-medium text-foreground-muted">Admin title</span>
                  <input
                    value={slide.title}
                    onChange={(e) => updateSlide(index, { title: e.target.value })}
                    className="admin-input"
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground-muted">Eyebrow</span>
                  <input
                    value={slide.eyebrow ?? ""}
                    onChange={(e) => updateSlide(index, { eyebrow: e.target.value })}
                    className="admin-input"
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground-muted">Display order</span>
                  <input
                    type="number"
                    value={slide.sortOrder}
                    onChange={(e) => updateSlide(index, { sortOrder: parseInt(e.target.value) || 0 })}
                    className="admin-input"
                  />
                </label>
                <label className="space-y-1.5 text-sm md:col-span-2">
                  <span className="font-medium text-foreground-muted">Title</span>
                  <input
                    value={slide.heading}
                    onChange={(e) => updateSlide(index, { heading: e.target.value })}
                    className="admin-input"
                  />
                </label>
                <label className="space-y-1.5 text-sm md:col-span-2">
                  <span className="font-medium text-foreground-muted">Subtitle</span>
                  <textarea
                    rows={3}
                    value={slide.subheading ?? ""}
                    onChange={(e) => updateSlide(index, { subheading: e.target.value })}
                    className="admin-input"
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground-muted">Primary button label</span>
                  <input
                    value={slide.primaryLabel ?? ""}
                    onChange={(e) => updateSlide(index, { primaryLabel: e.target.value })}
                    className="admin-input"
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground-muted">Primary button link</span>
                  <input
                    value={slide.primaryUrl ?? ""}
                    onChange={(e) => updateSlide(index, { primaryUrl: e.target.value })}
                    className="admin-input"
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground-muted">Secondary button label</span>
                  <input
                    value={slide.secondaryLabel ?? ""}
                    onChange={(e) => updateSlide(index, { secondaryLabel: e.target.value })}
                    className="admin-input"
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground-muted">Secondary button link</span>
                  <input
                    value={slide.secondaryUrl ?? ""}
                    onChange={(e) => updateSlide(index, { secondaryUrl: e.target.value })}
                    className="admin-input"
                  />
                </label>
                <div className="md:col-span-2">
                  <FramedImageField
                    label="Slide image"
                    value={slide.mediaUrl}
                    onChange={(mediaUrl) => updateSlide(index, { mediaUrl })}
                    preset="hero-contained"
                    focusX={slide.imageFocusX ?? 50}
                    focusY={slide.imageFocusY ?? 50}
                    zoom={slide.imageZoom ?? 100}
                    onFramingChange={(framing) => updateSlide(index, framing)}
                  />
                </div>
                <label className="space-y-1.5 text-sm md:col-span-2">
                  <span className="font-medium text-foreground-muted">Image alt text</span>
                  <input
                    value={slide.mediaAlt ?? ""}
                    onChange={(e) => updateSlide(index, { mediaAlt: e.target.value })}
                    className="admin-input"
                  />
                </label>
              </div>
              {slide.mediaUrl && (
                <HeroImagePreview variant="hero" imageUrl={slide.mediaUrl} title={slide.heading} />
              )}
            </SectionCard>
          ))}

          <button
            type="button"
            onClick={addSlide}
            className="admin-btn-secondary"
          >
            <Plus className="w-4 h-4" /> Add hero slide
          </button>
        </div>
      )}

      {activeTab === "intro" && (
        <div className="space-y-4">
          <SectionCard title="Who We Are">
            <ToggleField
              label="Show section"
              checked={whoWeAre.isActive}
              onChange={(isActive) => updateSection(LANDING_SECTION_KEYS.WHO_WE_ARE, { isActive })}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <LandingSectionHeadingFields
                section={whoWeAre}
                onUpdate={(patch) => updateSection(LANDING_SECTION_KEYS.WHO_WE_ARE, patch)}
                onUpdateSettings={(patch) =>
                  updateSectionSettings(LANDING_SECTION_KEYS.WHO_WE_ARE, patch)
                }
                showDescription
                descriptionLabel="Body text"
                descriptionField="body"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Section colours"
            description="Override heading and body text colours for the Who We Are block. Eyebrow label colour is managed in Site Settings → Appearance."
          >
            <WhoWeAreColorFields
              colors={whoWeAreColors}
              onChange={(colors: WhoWeAreColorSettings) =>
                updateSectionSettings(LANDING_SECTION_KEYS.WHO_WE_ARE, { colors })
              }
            />
          </SectionCard>

          <SectionCard
            title="Supporting image / tagline area"
            description="Image shown beside the Who We Are copy on the public homepage."
          >
            <ToggleField
              label="Show supporting image"
              checked={introShowImage}
              onChange={(showImage) =>
                updateSectionSettings(LANDING_SECTION_KEYS.WHO_WE_ARE, { showImage })
              }
              help="When off, the image area is hidden and the section uses a text-only layout."
            />
            <label className="space-y-1.5 text-sm block">
              <span className="font-medium text-foreground-muted">Image position</span>
              <select
                value={introImagePosition}
                onChange={(e) =>
                  updateSectionSettings(LANDING_SECTION_KEYS.WHO_WE_ARE, {
                    imagePosition: e.target.value as IntroImagePosition,
                  })
                }
                className="admin-input"
              >
                <option value="right">Right (beside text)</option>
                <option value="left">Left (beside text)</option>
                <option value="background">Background (behind section)</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FramedImageField
                  label="Supporting image"
                  value={whoWeAre.imageUrl ?? ""}
                  onChange={(imageUrl) =>
                    updateSection(LANDING_SECTION_KEYS.WHO_WE_ARE, {
                      imageUrl: imageUrl || null,
                    })
                  }
                  preset="16x9"
                  focusX={whoWeAre.imageFocusX ?? 50}
                  focusY={whoWeAre.imageFocusY ?? 50}
                  zoom={whoWeAre.imageZoom ?? 100}
                  onFramingChange={(framing) =>
                    updateSection(LANDING_SECTION_KEYS.WHO_WE_ARE, framing)
                  }
                />
              </div>
              <label className="space-y-1.5 text-sm md:col-span-2">
                <span className="font-medium text-foreground-muted">Supporting image alt text</span>
                <input
                  value={whoWeAre.imageAlt ?? ""}
                  onChange={(e) =>
                    updateSection(LANDING_SECTION_KEYS.WHO_WE_ARE, { imageAlt: e.target.value || null })
                  }
                  className="admin-input"
                />
              </label>
              <label className="space-y-1.5 text-sm md:col-span-2">
                <span className="font-medium text-foreground-muted">Image caption (optional)</span>
                <input
                  value={(whoWeAre.settings.imageCaption as string) ?? ""}
                  onChange={(e) =>
                    updateSectionSettings(LANDING_SECTION_KEYS.WHO_WE_ARE, {
                      imageCaption: e.target.value || null,
                    })
                  }
                  className="admin-input"
                />
              </label>
              <label className="space-y-1.5 text-sm md:col-span-2">
                <span className="font-medium text-foreground-muted">Image tagline / eyebrow overlay (optional)</span>
                <span className="block text-xs text-muted">Short line displayed over the image when set.</span>
                <input
                  value={(whoWeAre.settings.tagline as string) ?? ""}
                  onChange={(e) =>
                    updateSectionSettings(LANDING_SECTION_KEYS.WHO_WE_ARE, { tagline: e.target.value || null })
                  }
                  className="admin-input"
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground-muted mb-2">Preview</p>
              <IntroImagePreview
                imageUrl={whoWeAre.imageUrl}
                imageAlt={whoWeAre.imageAlt}
                tagline={(whoWeAre.settings.tagline as string) ?? null}
                caption={(whoWeAre.settings.imageCaption as string) ?? null}
                className="max-w-md"
              />
            </div>
          </SectionCard>

          <SectionCard title="Our Mandate">
            <ToggleField
              label="Show section"
              checked={mandate.isActive}
              onChange={(isActive) => updateSection(LANDING_SECTION_KEYS.MANDATE, { isActive })}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <LandingSectionHeadingFields
                section={mandate}
                onUpdate={(patch) => updateSection(LANDING_SECTION_KEYS.MANDATE, patch)}
                onUpdateSettings={(patch) => updateSectionSettings(LANDING_SECTION_KEYS.MANDATE, patch)}
                showDescription
                descriptionLabel="Intro text"
                descriptionField="body"
              />
            </div>
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium">Mandate highlight cards</p>
              {mandateCards.map((card, index) => (
                <div key={index} className="grid md:grid-cols-3 gap-3 p-3 bg-background border border-border">
                  <select
                    value={card.icon}
                    onChange={(e) => {
                      const cards = [...mandateCards];
                      cards[index] = { ...cards[index], icon: e.target.value };
                      updateSectionSettings(LANDING_SECTION_KEYS.MANDATE, { cards });
                    }}
                    className="px-3 py-2 rounded-lg border border-border text-sm bg-background"
                  >
                    <option value="">Choose an icon</option>
                    {MANDATE_ICON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Title"
                    value={card.title}
                    onChange={(e) => {
                      const cards = [...mandateCards];
                      cards[index] = { ...cards[index], title: e.target.value };
                      updateSectionSettings(LANDING_SECTION_KEYS.MANDATE, { cards });
                    }}
                    className="px-3 py-2 rounded-lg border border-border text-sm"
                  />
                  <input
                    placeholder="Description"
                    value={card.description}
                    onChange={(e) => {
                      const cards = [...mandateCards];
                      cards[index] = { ...cards[index], description: e.target.value };
                      updateSectionSettings(LANDING_SECTION_KEYS.MANDATE, { cards });
                    }}
                    className="px-3 py-2 rounded-lg border border-border text-sm md:col-span-1"
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === "infrastructure" && (
        <SectionCard title="Featured Infrastructure section" description="Project cards are pulled from the Projects module.">
          <ToggleField
            label="Show section"
            checked={infrastructure.isActive && infrastructureV2.isActive}
            onChange={(isActive) =>
              setPairedSectionActive(
                LANDING_SECTION_KEYS.INFRASTRUCTURE,
                LANDING_V2_SECTION_KEYS.INFRASTRUCTURE,
                isActive
              )
            }
          />
          <div className="grid md:grid-cols-2 gap-4">
            <LandingSectionHeadingFields
              section={infrastructure}
              onUpdate={(patch) => updateSection(LANDING_SECTION_KEYS.INFRASTRUCTURE, patch)}
              onUpdateSettings={(patch) =>
                updateSectionSettings(LANDING_SECTION_KEYS.INFRASTRUCTURE, patch)
              }
              showDescription
              descriptionLabel="Intro text"
              showLink
            />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Number of cards</span>
              <input
                type="number"
                min={1}
                max={12}
                value={(infrastructureV2.settings.projectCount as number) ?? 3}
                onChange={(e) =>
                  updateV2Settings(LANDING_V2_SECTION_KEYS.INFRASTRUCTURE, {
                    projectCount: parseInt(e.target.value) || 3,
                  })
                }
                className="admin-input"
              />
            </label>
            <div className="space-y-2">
              <ToggleField
                label="Show only featured projects"
                checked={(infrastructureV2.settings.featuredOnly as boolean) ?? true}
                onChange={(featuredOnly) =>
                  updateV2Settings(LANDING_V2_SECTION_KEYS.INFRASTRUCTURE, { featuredOnly })
                }
              />
            </div>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Button label</span>
              <input
                value={(infrastructure.settings.buttonLabel as string) ?? infrastructure.ctaLabel ?? ""}
                onChange={(e) =>
                  updateSectionSettings(LANDING_SECTION_KEYS.INFRASTRUCTURE, { buttonLabel: e.target.value })
                }
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Button link</span>
              <input
                value={(infrastructure.settings.buttonLink as string) ?? infrastructure.ctaHref ?? ""}
                onChange={(e) =>
                  updateSectionSettings(LANDING_SECTION_KEYS.INFRASTRUCTURE, { buttonLink: e.target.value })
                }
                className="admin-input"
              />
            </label>
          </div>
        </SectionCard>
      )}

      {activeTab === "stats" && (
        <div className="space-y-4">
          <SectionCard title="Statistics section header">
            <ToggleField
              label="Show section"
              checked={statsSection.isActive}
              onChange={(isActive) => updateSection(LANDING_SECTION_KEYS.STATS, { isActive })}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <LandingSectionHeadingFields
                section={statsSection}
                onUpdate={(patch) => updateSection(LANDING_SECTION_KEYS.STATS, patch)}
                onUpdateSettings={(patch) => updateSectionSettings(LANDING_SECTION_KEYS.STATS, patch)}
                showDescription
                descriptionLabel="Subtitle"
              />
            </div>
          </SectionCard>

          {content.statItems.map((stat, index) => (
            <SectionCard key={stat.id ?? `stat-${index}`} title={`Stat ${index + 1}: ${stat.label}`} defaultOpen={index < 2}>
              <div className="flex justify-between items-center">
                <ToggleField
                  label="Active"
                  checked={stat.isActive}
                  onChange={(isActive) => updateStat(index, { isActive })}
                />
                <button
                  type="button"
                  onClick={() => removeStat(index)}
                  className="admin-btn-danger"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <input
                  placeholder="Label"
                  value={stat.label}
                  onChange={(e) => updateStat(index, { label: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border text-sm"
                />
                <input
                  placeholder="Value"
                  value={stat.value}
                  onChange={(e) => updateStat(index, { value: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border text-sm"
                />
                <input
                  placeholder="Prefix"
                  value={stat.prefix ?? ""}
                  onChange={(e) => updateStat(index, { prefix: e.target.value || null })}
                  className="px-3 py-2 rounded-lg border border-border text-sm"
                />
                <input
                  placeholder="Suffix"
                  value={stat.suffix ?? ""}
                  onChange={(e) => updateStat(index, { suffix: e.target.value || null })}
                  className="px-3 py-2 rounded-lg border border-border text-sm"
                />
              </div>
            </SectionCard>
          ))}
          <button type="button" onClick={addStat} className="admin-btn-secondary">
            <Plus className="w-4 h-4" /> Add stat
          </button>
        </div>
      )}

      {activeTab === "tenders" && (
        <SectionCard title="Tenders / Procurement section">
          <ToggleField
            label="Show section"
            checked={tenders.isActive && tendersV2.isActive}
            onChange={(isActive) =>
              setPairedSectionActive(LANDING_SECTION_KEYS.TENDERS, LANDING_V2_SECTION_KEYS.TENDERS, isActive)
            }
          />
          <div className="grid md:grid-cols-2 gap-4">
            <LandingSectionHeadingFields
              section={tenders}
              onUpdate={(patch) => updateSection(LANDING_SECTION_KEYS.TENDERS, patch)}
              onUpdateSettings={(patch) => updateSectionSettings(LANDING_SECTION_KEYS.TENDERS, patch)}
              showDescription
              descriptionLabel="Intro"
              showLink
            />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Number to show</span>
              <input
                type="number"
                min={1}
                max={12}
                value={(tendersV2.settings.tenderCount as number) ?? 2}
                onChange={(e) =>
                  updateV2Settings(LANDING_V2_SECTION_KEYS.TENDERS, {
                    tenderCount: parseInt(e.target.value) || 2,
                  })
                }
                className="admin-input"
              />
            </label>
            <ToggleField
              label="Show open tenders only"
              checked={(tendersV2.settings.openOnly as boolean) ?? true}
              onChange={(openOnly) => updateV2Settings(LANDING_V2_SECTION_KEYS.TENDERS, { openOnly })}
            />
          </div>
        </SectionCard>
      )}

      {activeTab === "news" && (
        <SectionCard title="News / Insights section">
          <ToggleField
            label="Show section"
            checked={news.isActive && newsV2.isActive}
            onChange={(isActive) =>
              setPairedSectionActive(LANDING_SECTION_KEYS.NEWS, LANDING_V2_SECTION_KEYS.NEWS, isActive)
            }
          />
          <div className="grid md:grid-cols-2 gap-4">
            <LandingSectionHeadingFields
              section={news}
              onUpdate={(patch) => updateSection(LANDING_SECTION_KEYS.NEWS, patch)}
              onUpdateSettings={(patch) => updateSectionSettings(LANDING_SECTION_KEYS.NEWS, patch)}
              showDescription
              descriptionLabel="Intro"
              showLink
            />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Number of items</span>
              <input
                type="number"
                min={1}
                max={12}
                value={(newsV2.settings.newsCount as number) ?? 3}
                onChange={(e) =>
                  updateV2Settings(LANDING_V2_SECTION_KEYS.NEWS, { newsCount: parseInt(e.target.value) || 3 })
                }
                className="admin-input"
              />
            </label>
          </div>
        </SectionCard>
      )}

      {activeTab === "contractor" && (
        <SectionCard title="Contractor CTA section">
          <ToggleField
            label="Show section"
            checked={contractor.isActive}
            onChange={(isActive) => updateSection(LANDING_SECTION_KEYS.CONTRACTOR_CTA, { isActive })}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <LandingSectionHeadingFields
              section={contractor}
              onUpdate={(patch) => updateSection(LANDING_SECTION_KEYS.CONTRACTOR_CTA, patch)}
              onUpdateSettings={(patch) =>
                updateSectionSettings(LANDING_SECTION_KEYS.CONTRACTOR_CTA, patch)
              }
              showDescription
              descriptionLabel="Body"
              descriptionField="body"
            />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Primary CTA label</span>
              <input
                value={contractor.ctaLabel ?? ""}
                onChange={(e) => updateSection(LANDING_SECTION_KEYS.CONTRACTOR_CTA, { ctaLabel: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Primary CTA link</span>
              <input
                value={contractor.ctaHref ?? ""}
                onChange={(e) => updateSection(LANDING_SECTION_KEYS.CONTRACTOR_CTA, { ctaHref: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Secondary CTA label</span>
              <input
                value={(contractor.settings.secondaryCtaLabel as string) ?? ""}
                onChange={(e) =>
                  updateSectionSettings(LANDING_SECTION_KEYS.CONTRACTOR_CTA, {
                    secondaryCtaLabel: e.target.value,
                  })
                }
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Secondary CTA link</span>
              <input
                value={(contractor.settings.secondaryCtaHref as string) ?? ""}
                onChange={(e) =>
                  updateSectionSettings(LANDING_SECTION_KEYS.CONTRACTOR_CTA, {
                    secondaryCtaHref: e.target.value,
                  })
                }
                className="admin-input"
              />
            </label>
            <div className="md:col-span-2">
              <FramedImageField
                label="Background image (optional)"
                value={contractor.imageUrl ?? ""}
                onChange={(imageUrl) =>
                  updateSection(LANDING_SECTION_KEYS.CONTRACTOR_CTA, { imageUrl })
                }
                preset="16x9"
                focusX={contractor.imageFocusX ?? 50}
                focusY={contractor.imageFocusY ?? 50}
                zoom={contractor.imageZoom ?? 100}
                onFramingChange={(framing) =>
                  updateSection(LANDING_SECTION_KEYS.CONTRACTOR_CTA, framing)
                }
              />
            </div>
          </div>
          {contractor.imageUrl && (
            <HeroImagePreview variant="card" imageUrl={contractor.imageUrl} title={contractor.sectionTitle ?? ""} />
          )}
        </SectionCard>
      )}

      {activeTab === "governance" && (
        <SectionCard title="Governance & Accountability">
          <ToggleField
            label="Show section"
            checked={governance.isActive && governanceV2.isActive}
            onChange={(isActive) =>
              setPairedSectionActive(
                LANDING_SECTION_KEYS.GOVERNANCE,
                LANDING_V2_SECTION_KEYS.GOVERNANCE,
                isActive
              )
            }
          />
          <div className="grid md:grid-cols-2 gap-4">
            <LandingSectionHeadingFields
              section={governance}
              onUpdate={(patch) => updateSection(LANDING_SECTION_KEYS.GOVERNANCE, patch)}
              onUpdateSettings={(patch) => updateSectionSettings(LANDING_SECTION_KEYS.GOVERNANCE, patch)}
              showDescription
              descriptionLabel="Intro"
            />
          </div>
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">Governance quick links</p>
            <button
              type="button"
              className="admin-btn-secondary text-sm"
              onClick={() =>
                updateSectionSettings(LANDING_SECTION_KEYS.GOVERNANCE, {
                  links: [...governanceLinks, { href: "/governance", title: "Link", description: "" }],
                })
              }
            >
              <Plus className="w-4 h-4 inline" /> Add link
            </button>
            {governanceLinks.map((link, index) => (
              <div key={index} className="grid md:grid-cols-4 gap-2 border p-3 rounded">
                <input
                  value={link.title}
                  onChange={(e) =>
                    updateSectionSettings(LANDING_SECTION_KEYS.GOVERNANCE, {
                      links: governanceLinks.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title: e.target.value } : item
                      ),
                    })
                  }
                  className="admin-input"
                  placeholder="Title"
                />
                <input
                  value={link.href}
                  onChange={(e) =>
                    updateSectionSettings(LANDING_SECTION_KEYS.GOVERNANCE, {
                      links: governanceLinks.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, href: e.target.value } : item
                      ),
                    })
                  }
                  className="admin-input"
                  placeholder="URL"
                />
                <input
                  value={link.description}
                  onChange={(e) =>
                    updateSectionSettings(LANDING_SECTION_KEYS.GOVERNANCE, {
                      links: governanceLinks.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, description: e.target.value } : item
                      ),
                    })
                  }
                  className="admin-input md:col-span-2"
                  placeholder="Description"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateSectionSettings(LANDING_SECTION_KEYS.GOVERNANCE, {
                      links: governanceLinks.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  className="admin-btn-danger text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {activeTab === "contact" && (
        <SectionCard title="Contact strip / footer CTA">
          <ToggleField
            label="Show section"
            checked={contact.isActive && contactV2.isActive}
            onChange={(isActive) =>
              setPairedSectionActive(
                LANDING_SECTION_KEYS.CONTACT_CTA,
                LANDING_V2_SECTION_KEYS.CONTACT_CTA,
                isActive
              )
            }
          />
          <div className="grid md:grid-cols-2 gap-4">
            <LandingSectionHeadingFields
              section={contact}
              onUpdate={(patch) => updateSection(LANDING_SECTION_KEYS.CONTACT_CTA, patch)}
              onUpdateSettings={(patch) => updateSectionSettings(LANDING_SECTION_KEYS.CONTACT_CTA, patch)}
              showDescription
              descriptionLabel="Subtitle"
            />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Button label</span>
              <input
                value={contact.ctaLabel ?? ""}
                onChange={(e) => updateSection(LANDING_SECTION_KEYS.CONTACT_CTA, { ctaLabel: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground-muted">Button link</span>
              <input
                value={contact.ctaHref ?? ""}
                onChange={(e) => updateSection(LANDING_SECTION_KEYS.CONTACT_CTA, { ctaHref: e.target.value })}
                className="admin-input"
              />
            </label>
          </div>
        </SectionCard>
      )}

      {activeTab === "seo" && (
        <SectionCard title="SEO & publish status">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="font-medium text-foreground-muted">Meta title</span>
              <input
                value={content.metaTitle ?? ""}
                onChange={(e) => setContent((prev) => ({ ...prev, metaTitle: e.target.value }))}
                className="admin-input"
              />
            </label>
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="font-medium text-foreground-muted">Meta description</span>
              <textarea
                rows={3}
                value={content.metaDescription ?? ""}
                onChange={(e) => setContent((prev) => ({ ...prev, metaDescription: e.target.value }))}
                className="admin-input"
              />
            </label>
            <p className="text-sm text-muted md:col-span-2">
              Use Save Draft to store changes without updating the public homepage. Publish when you are ready to go
              live.
            </p>
          </div>
        </SectionCard>
      )}

      <ContentActionBar
        hasDraft={hasDraft}
        isPublished={isPublished}
        liveUrl="/"
        previewUrl="/preview/home"
        backUrl="/admin/landing-page-v2"
        saving={saving}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onDiscardDraft={hasDraft ? handleDiscardDraft : undefined}
      />
    </div>
  );
}

/** @deprecated Use HomepageEditor */
export const LandingPageEditor = HomepageEditor;
