"use client";

import { useState } from "react";
import { HardHat } from "lucide-react";
import { DEFAULT_INTRO_SUPPORTING_IMAGE } from "@/lib/landing-page";
import { cn } from "@/lib/utils";
import { FramedImage } from "./FramedImage";

type Props = {
  imageUrl?: string | null;
  imageAlt: string;
  tagline?: string | null;
  caption?: string | null;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  className?: string;
};

export function IntroSupportingImage({
  imageUrl,
  imageAlt,
  tagline,
  caption,
  imageFocusX,
  imageFocusY,
  imageZoom,
  className,
}: Props) {
  const primary = imageUrl?.trim() || DEFAULT_INTRO_SUPPORTING_IMAGE;
  const [src, setSrc] = useState(primary);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (src !== DEFAULT_INTRO_SUPPORTING_IMAGE) {
      setSrc(DEFAULT_INTRO_SUPPORTING_IMAGE);
      return;
    }
    setFailed(true);
  };

  return (
    <div
      className={cn(
        "intro-supporting-image public-media-16x9 border border-border bg-gradient-to-br from-primary/20 via-surface-elevated to-accent/10 shadow-sm",
        className
      )}
    >
      {!failed ? (
        <>
          <FramedImage
            src={src}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            imageFocusX={imageFocusX}
            imageFocusY={imageFocusY}
            imageZoom={imageZoom}
            onError={handleError}
          />
          {(tagline || caption) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-6 py-5">
              {tagline && (
                <p className="text-sm font-medium text-white leading-snug tracking-tight">
                  {tagline}
                </p>
              )}
              {caption && <p className="text-sm text-white/85 mt-1">{caption}</p>}
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center">
            <HardHat className="w-16 h-16 text-primary mx-auto mb-4 opacity-60" />
            {tagline && <p className="public-display-serif text-base text-gradient">{tagline}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
