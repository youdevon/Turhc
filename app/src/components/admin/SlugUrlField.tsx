"use client";

import { FormField } from "./FormField";

type Props = {
  name?: string;
  prefix: string;
  defaultValue?: string;
  help?: string;
  required?: boolean;
};

export function SlugUrlField({
  name = "slug",
  prefix,
  defaultValue = "",
  help = "The web address for this page. Leave blank to generate automatically from the title.",
  required,
}: Props) {
  return (
    <FormField label="Website link" name={name} defaultValue={defaultValue} required={required} help={help}>
      <div className="flex rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
        <span className="px-3 py-2 text-sm text-muted bg-surface border-r border-border shrink-0">{prefix}</span>
        <input
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder="page-name"
          className="flex-1 px-3 py-2 text-sm bg-transparent outline-none min-w-0"
        />
      </div>
    </FormField>
  );
}
