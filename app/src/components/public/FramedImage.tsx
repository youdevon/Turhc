import type { CSSProperties } from "react";
import { imageFramingStyle, resolveImageFraming, type ImageFramingInput } from "@/lib/photo-framing";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "eager" | "lazy";
  onError?: React.ReactEventHandler<HTMLImageElement>;
} & ImageFramingInput;

export function FramedImage({
  src,
  alt,
  className,
  style,
  loading,
  onError,
  imageFocusX,
  imageFocusY,
  imageZoom,
}: Props) {
  const framing = resolveImageFraming({ imageFocusX, imageFocusY, imageZoom });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      style={{ ...imageFramingStyle(framing.imageFocusX, framing.imageFocusY, framing.imageZoom), ...style }}
      loading={loading}
      onError={onError}
    />
  );
}
