import type { CSSProperties } from "react";

export const DEFAULT_PHOTO_FOCUS = 50;
export const DEFAULT_PHOTO_ZOOM = 100;
export const PHOTO_ZOOM_MIN = 50;
export const PHOTO_ZOOM_MAX = 200;

export type ImageFraming = {
  imageFocusX: number;
  imageFocusY: number;
  imageZoom: number;
};

export type ImageFramingInput = {
  imageFocusX?: number | null;
  imageFocusY?: number | null;
  imageZoom?: number | null;
};

export type ImageAspectPreset =
  | "portrait-person"
  | "16x9"
  | "hero-contained"
  | "page-hero";

export type FramingFieldPrefix = "image" | "photo" | "heroImage";

export const IMAGE_ASPECT_PRESETS: Record<
  ImageAspectPreset,
  { label: string; hint: string; previewClass: string; cropClass: string; imgClass: string }
> = {
  "portrait-person": {
    label: "person card",
    hint: "Drag the preview or use the sliders to choose how the photo is framed in the public person card. The dashed frame shows exactly what visitors will see.",
    previewClass: "photo-alignment-preview photo-alignment-preview--person",
    cropClass: "photo-alignment-crop public-media-portrait bg-surface",
    imgClass: "public-media-portrait__img",
  },
  "16x9": {
    label: "16:9 card",
    hint: "Drag the preview or use the sliders to choose how the image is cropped in listing cards. The dashed frame shows exactly what visitors will see.",
    previewClass: "photo-alignment-preview photo-alignment-preview--16x9",
    cropClass: "photo-alignment-crop public-media-16x9 bg-surface",
    imgClass: "public-media-16x9__img",
  },
  "hero-contained": {
    label: "hero slide",
    hint: "Drag the preview or use the sliders to choose how the image is framed in the homepage hero carousel. The dashed frame shows exactly what visitors will see.",
    previewClass: "photo-alignment-preview photo-alignment-preview--hero",
    cropClass: "photo-alignment-crop hero-contained bg-surface",
    imgClass: "absolute inset-0 w-full h-full object-cover",
  },
  "page-hero": {
    label: "page banner",
    hint: "Drag the preview or use the sliders to choose how the image is framed in the page hero banner. The dashed frame shows exactly what visitors will see.",
    previewClass: "photo-alignment-preview photo-alignment-preview--page-hero",
    cropClass: "photo-alignment-crop photo-alignment-crop--page-hero bg-surface",
    imgClass: "absolute inset-0 w-full h-full object-cover",
  },
};

export function clampPhotoFocus(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clampPhotoZoom(value: number): number {
  return Math.min(PHOTO_ZOOM_MAX, Math.max(PHOTO_ZOOM_MIN, Math.round(value)));
}

export function resolveImageFraming(input?: ImageFramingInput | null): ImageFraming {
  return {
    imageFocusX:
      input?.imageFocusX != null && Number.isFinite(input.imageFocusX)
        ? clampPhotoFocus(input.imageFocusX)
        : DEFAULT_PHOTO_FOCUS,
    imageFocusY:
      input?.imageFocusY != null && Number.isFinite(input.imageFocusY)
        ? clampPhotoFocus(input.imageFocusY)
        : DEFAULT_PHOTO_FOCUS,
    imageZoom:
      input?.imageZoom != null && Number.isFinite(input.imageZoom)
        ? clampPhotoZoom(input.imageZoom)
        : DEFAULT_PHOTO_ZOOM,
  };
}

function framingFieldNames(prefix: FramingFieldPrefix) {
  return {
    focusX: `${prefix}FocusX`,
    focusY: `${prefix}FocusY`,
    zoom: `${prefix}Zoom`,
  };
}

export type ModelFramingFields = Record<string, number>;

export function parseFramingFromFormData(
  formData: FormData,
  prefix: FramingFieldPrefix = "image",
): ModelFramingFields {
  const names = framingFieldNames(prefix);
  const rawX = parseInt(formData.get(names.focusX) as string, 10);
  const rawY = parseInt(formData.get(names.focusY) as string, 10);
  const rawZoom = parseInt(formData.get(names.zoom) as string, 10);
  return {
    [names.focusX]: Number.isFinite(rawX) ? clampPhotoFocus(rawX) : DEFAULT_PHOTO_FOCUS,
    [names.focusY]: Number.isFinite(rawY) ? clampPhotoFocus(rawY) : DEFAULT_PHOTO_FOCUS,
    [names.zoom]: Number.isFinite(rawZoom) ? clampPhotoZoom(rawZoom) : DEFAULT_PHOTO_ZOOM,
  };
}

/** @deprecated Use parseFramingFromFormData with prefix "photo" */
export function parsePhotoFraming(formData: FormData): ModelFramingFields {
  return parseFramingFromFormData(formData, "photo");
}

export function parseImageFraming(formData: FormData): ModelFramingFields {
  return parseFramingFromFormData(formData, "image");
}

export function parseHeroImageFraming(formData: FormData): ModelFramingFields {
  return parseFramingFromFormData(formData, "heroImage");
}

export function imageFramingStyle(
  focusX: number = DEFAULT_PHOTO_FOCUS,
  focusY: number = DEFAULT_PHOTO_FOCUS,
  zoom: number = DEFAULT_PHOTO_ZOOM,
): CSSProperties {
  const scale = zoom / 100;
  return {
    objectPosition: `${focusX}% ${focusY}%`,
    ...(scale !== 1
      ? {
          transform: `scale(${scale})`,
          transformOrigin: `${focusX}% ${focusY}%`,
        }
      : {}),
  };
}

/** Person-card alias kept for existing call sites. */
export const memberPhotoStyle = imageFramingStyle;

export function framingHiddenInputNames(prefix: FramingFieldPrefix) {
  return framingFieldNames(prefix);
}
