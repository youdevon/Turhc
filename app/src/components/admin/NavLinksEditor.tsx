"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { NavLinkItem } from "@/lib/header-config";
import {
  COMMON_NAV_PAGE_LINKS,
  DEFAULT_NAV_LINKS,
  parseNavLinksFromJson,
  serializeNavLinks,
} from "@/lib/header-config";

type Props = {
  name?: string;
  initialJson?: string | null;
  /** Administrator-only raw JSON override field name */
  rawJsonFieldName?: string;
  showDeveloperJson?: boolean;
  developerJsonValue?: string;
};

const CUSTOM_LINK_VALUE = "__custom__";

function createEmptyLink(order: number): NavLinkItem {
  return { label: "", href: "", order, active: true };
}

function isPresetHref(href: string): boolean {
  return COMMON_NAV_PAGE_LINKS.some((p) => p.href === href);
}

function PageLinkField({
  href,
  onChange,
}: {
  href: string;
  onChange: (href: string) => void;
}) {
  const [mode, setMode] = useState<"preset" | "custom">(
    href && !isPresetHref(href) ? "custom" : "preset"
  );
  const selectValue = mode === "custom" || (href && !isPresetHref(href)) ? CUSTOM_LINK_VALUE : href || "";

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={(e) => {
          const value = e.target.value;
          if (value === CUSTOM_LINK_VALUE) {
            setMode("custom");
            if (isPresetHref(href)) onChange("");
            return;
          }
          setMode("preset");
          onChange(value);
        }}
        className="admin-input"
      >
        <option value="">Choose a page…</option>
        {COMMON_NAV_PAGE_LINKS.map((page) => (
          <option key={page.href} value={page.href}>
            {page.href} — {page.label}
          </option>
        ))}
        <option value={CUSTOM_LINK_VALUE}>Custom link…</option>
      </select>
      {(mode === "custom" || (href && !isPresetHref(href))) && (
        <input
          value={href}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/your-page"
          className="admin-input"
        />
      )}
    </div>
  );
}

export function NavLinksEditor({
  name = "mainNavJson",
  initialJson,
  rawJsonFieldName = "mainNavJsonRaw",
  showDeveloperJson = false,
  developerJsonValue,
}: Props) {
  const [links, setLinks] = useState<NavLinkItem[]>(() => {
    const parsed = parseNavLinksFromJson(initialJson ?? "");
    return parsed.length ? parsed : [...DEFAULT_NAV_LINKS];
  });
  const [devJson, setDevJson] = useState(developerJsonValue ?? initialJson ?? serializeNavLinks(links));
  const [useDevJson, setUseDevJson] = useState(false);

  const serialized = useMemo(() => {
    if (showDeveloperJson && useDevJson) {
      return devJson;
    }
    return serializeNavLinks(links);
  }, [links, devJson, showDeveloperJson, useDevJson]);

  function updateLink(index: number, patch: Partial<NavLinkItem>) {
    setLinks((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function moveLink(index: number, direction: -1 | 1) {
    setLinks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, i) => ({ ...item, order: i }));
    });
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })));
  }

  function addLink() {
    setLinks((prev) => [...prev, createEmptyLink(prev.length)]);
  }

  return (
    <section className="border border-border bg-background/40 p-5 space-y-4">
      <input type="hidden" name={name} value={serialized} readOnly />
      {showDeveloperJson && useDevJson && (
        <input type="hidden" name={rawJsonFieldName} value={devJson} readOnly />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Main Navigation</h3>
          <p className="text-sm text-muted mt-1">
            Manage the links shown in the website header menu. Drag order with the move buttons.
          </p>
        </div>
        <button type="button" onClick={addLink} className="admin-btn-secondary shrink-0">
          <Plus className="w-4 h-4" /> Add Menu Item
        </button>
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-muted border border-dashed border-border p-4 text-center">
          No menu items added yet. Click &ldquo;Add Menu Item&rdquo; to create your first link.
        </p>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div key={index} className="border border-border bg-surface-elevated p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Menu item {index + 1}</p>
                <div className="admin-actions">
                  <button
                    type="button"
                    onClick={() => moveLink(index, -1)}
                    disabled={index === 0}
                    className="admin-btn-quiet"
                  >
                    <ChevronUp /> Move Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLink(index, 1)}
                    disabled={index === links.length - 1}
                    className="admin-btn-quiet"
                  >
                    <ChevronDown /> Move Down
                  </button>
                  <button type="button" onClick={() => removeLink(index)} className="admin-btn-danger">
                    <Trash2 /> Remove
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground-muted">Menu Label</span>
                  <input
                    value={link.label}
                    onChange={(e) => updateLink(index, { label: e.target.value })}
                    placeholder="e.g. Our Projects"
                    className="admin-input"
                  />
                </label>
                <div className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground-muted block">Page Link</span>
                  <PageLinkField href={link.href} onChange={(href) => updateLink(index, { href })} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 items-end">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-foreground-muted">Display Order</span>
                  <input
                    type="number"
                    min={0}
                    value={link.order ?? index}
                    onChange={(e) =>
                      updateLink(index, {
                        order: e.target.value === "" ? index : parseInt(e.target.value, 10) || index,
                      })
                    }
                    className="admin-input"
                  />
                  <span className="text-xs text-muted">Leave as-is to follow the list order above.</span>
                </label>
                <label className="flex items-center gap-2 text-sm pb-2">
                  <input
                    type="checkbox"
                    checked={link.active !== false}
                    onChange={(e) => updateLink(index, { active: e.target.checked })}
                    className="rounded"
                  />
                  <span>
                    <span className="font-medium">Show in Menu</span>
                    <span className="block text-xs text-muted">Uncheck to hide without deleting.</span>
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDeveloperJson && (
        <details className="border border-amber-500/30 bg-amber-500/5 p-4">
          <summary className="cursor-pointer text-sm font-medium text-amber-700 dark:text-amber-400">
            Developer navigation JSON (Administrator only)
          </summary>
          <p className="text-xs text-muted mt-2 mb-3">
            Advanced settings. Only edit this if you understand the website configuration.
          </p>
          <label className="flex items-center gap-2 text-sm mb-3">
            <input
              type="checkbox"
              checked={useDevJson}
              onChange={(e) => setUseDevJson(e.target.checked)}
              className="rounded"
            />
            Edit raw navigation data directly
          </label>
          {useDevJson && (
            <textarea
              value={devJson}
              onChange={(e) => setDevJson(e.target.value)}
              rows={6}
              className="admin-input font-mono text-xs"
            />
          )}
        </details>
      )}
    </section>
  );
}
