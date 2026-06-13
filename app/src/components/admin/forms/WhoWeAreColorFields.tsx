"use client";

import {
  WHO_WE_ARE_COLOR_DEFAULTS,
  WHO_WE_ARE_COLOR_KEYS,
  type WhoWeAreColorKey,
  type WhoWeAreColorSettings,
  type WhoWeAreSectionColorSet,
} from "@/lib/landing-page";

const COLOR_LABELS: Record<WhoWeAreColorKey, string> = {
  headingColor: "Heading (primary line)",
  emphasisColor: "Heading emphasis (italic)",
  bodyColor: "Body text",
};

type Props = {
  colors: WhoWeAreColorSettings;
  onChange: (colors: WhoWeAreColorSettings) => void;
};

function ColorField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string | null) => void;
}) {
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : placeholder;

  return (
    <label className="space-y-1.5 text-sm block">
      <span className="font-medium text-foreground-muted">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded border border-border bg-transparent p-1"
          aria-label={`${label} colour picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={placeholder}
          className="admin-input flex-1 font-mono text-xs"
          spellCheck={false}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="admin-btn-secondary shrink-0 px-2 py-1 text-xs"
          >
            Reset
          </button>
        ) : null}
      </div>
    </label>
  );
}

function ThemeColorGroup({
  theme,
  colors,
  onUpdate,
}: {
  theme: "light" | "dark";
  colors: WhoWeAreSectionColorSet;
  onUpdate: (patch: WhoWeAreSectionColorSet) => void;
}) {
  const defaults = WHO_WE_ARE_COLOR_DEFAULTS[theme];

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-surface/40 p-4">
      <p className="text-sm font-semibold capitalize">{theme} theme</p>
      <div className="grid md:grid-cols-2 gap-4">
        {WHO_WE_ARE_COLOR_KEYS.map((key) => (
          <ColorField
            key={key}
            label={COLOR_LABELS[key]}
            value={colors[key] ?? ""}
            placeholder={defaults[key]}
            onChange={(value) => {
              const next = { ...colors };
              if (value) next[key] = value;
              else delete next[key];
              onUpdate(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function WhoWeAreColorFields({ colors, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Optional overrides for the Who We Are heading block. Eyebrow label colour is set site-wide in
        Site Settings → Appearance. Leave other fields blank to inherit site-wide section heading
        colours.
      </p>
      <ThemeColorGroup
        theme="light"
        colors={colors.light ?? {}}
        onUpdate={(light) => onChange({ ...colors, light })}
      />
      <ThemeColorGroup
        theme="dark"
        colors={colors.dark ?? {}}
        onUpdate={(dark) => onChange({ ...colors, dark })}
      />
    </div>
  );
}
