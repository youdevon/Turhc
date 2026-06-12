"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { parseStatsJson, serializeStatsJson, type StatItem } from "@/lib/stats-json";

type Props = {
  name?: string;
  initialJson?: string | null;
};

export function StatsRepeater({ name = "statsJson", initialJson }: Props) {
  const [items, setItems] = useState<StatItem[]>(() => parseStatsJson(initialJson));
  const serialized = useMemo(() => serializeStatsJson(items), [items]);

  function updateItem(index: number, patch: Partial<StatItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { label: "", value: "" }]);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={serialized} readOnly />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="admin-label">Highlight stats</p>
          <p className="admin-help-text mt-0.5">Optional figures shown on the slide, e.g. project count.</p>
        </div>
        <button type="button" onClick={addItem} className="admin-btn-secondary">
          <Plus className="w-4 h-4" /> Add stat
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted border border-dashed border-border p-4 text-center">
          No stats added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <label className="space-y-1.5">
                <span className="admin-label text-foreground-muted">Label</span>
                <input
                  value={item.label}
                  onChange={(e) => updateItem(index, { label: e.target.value })}
                  placeholder="Active Projects"
                  className="admin-input"
                />
              </label>
              <label className="space-y-1.5">
                <span className="admin-label text-foreground-muted">Value</span>
                <input
                  value={item.value}
                  onChange={(e) => updateItem(index, { value: e.target.value })}
                  placeholder="24"
                  className="admin-input"
                />
              </label>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="admin-btn-icon admin-btn-quiet admin-btn-icon--danger mb-0.5"
                aria-label="Remove stat"
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
