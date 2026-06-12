"use client";

type Props = {
  imageUrl?: string;
  title?: string;
  variant?: "hero" | "card";
};

export function HeroImagePreview({ imageUrl, title = "Preview", variant = "hero" }: Props) {
  if (!imageUrl) {
    return (
      <div
        className={
          variant === "hero"
            ? "border border-dashed border-border bg-background h-28 flex items-center justify-center text-sm text-muted"
            : "border border-dashed border-border bg-background aspect-[16/10] flex items-center justify-center text-sm text-muted"
        }
      >
        No image URL set
      </div>
    );
  }

  return (
    <div
      className={
        variant === "hero"
          ? "relative overflow-hidden border border-border h-28"
          : "relative overflow-hidden border border-border aspect-[16/10]"
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <p className="absolute bottom-2 left-3 text-xs text-white font-medium">{title}</p>
    </div>
  );
}
