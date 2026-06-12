"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  imageUrl?: string | null;
  imageAlt?: string | null;
  tagline?: string | null;
  caption?: string | null;
  className?: string;
};

export function IntroImagePreview({
  imageUrl,
  imageAlt,
  tagline,
  caption,
  className,
}: Props) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(imageUrl?.trim()) && !failed;

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-border bg-surface aspect-[16/9] shadow-sm",
        className
      )}
    >
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl!}
            alt={imageAlt ?? "Supporting image preview"}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
          {(tagline || caption) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              {tagline && <p className="text-sm font-semibold text-white">{tagline}</p>}
              {caption && <p className="text-xs text-white/80 mt-0.5">{caption}</p>}
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-muted">
          <ImageIcon className="h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">No supporting image selected</p>
          <p className="text-xs">Add an image URL above to preview it here</p>
        </div>
      )}
    </div>
  );
}
