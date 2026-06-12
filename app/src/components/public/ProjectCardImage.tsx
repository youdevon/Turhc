"use client";

import { useState } from "react";
import { FramedImage } from "./FramedImage";

type Props = {
  src: string;
  alt: string;
  fallbacks?: string[];
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
};

export function ProjectCardImage({
  src,
  alt,
  fallbacks = [],
  imageFocusX,
  imageFocusY,
  imageZoom,
}: Props) {
  const [srcIndex, setSrcIndex] = useState(0);
  const sources = [src, ...fallbacks.filter((url) => url && url !== src)];
  const currentSrc = sources[Math.min(srcIndex, sources.length - 1)] ?? src;

  return (
    <FramedImage
      src={currentSrc}
      alt={alt}
      className="project-card__image"
      imageFocusX={imageFocusX}
      imageFocusY={imageFocusY}
      imageZoom={imageZoom}
      onError={() => {
        if (srcIndex < sources.length - 1) {
          setSrcIndex((index) => index + 1);
        }
      }}
    />
  );
}
