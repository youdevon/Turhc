"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function DeveloperSettingsPanel({
  title = "Developer Settings",
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-amber-500/10 transition-colors"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted mt-1">
              Advanced settings. Only edit this if you understand the website configuration.
            </p>
          </div>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-5 pb-5 space-y-5 border-t border-amber-500/20 pt-5">{children}</div>}
    </section>
  );
}
