"use client";

import { useState } from "react";
import {
  DEFAULT_PHOTO_FOCUS,
  DEFAULT_PHOTO_ZOOM,
  framingHiddenInputNames,
  type FramingFieldPrefix,
  type ImageAspectPreset,
} from "@/lib/photo-framing";
import { ImageAlignmentEditor } from "./ImageAlignmentEditor";
import { MediaUploader } from "./MediaUploader";

type Props = {
  uploadName: string;
  defaultMediaId?: string;
  defaultPhotoUrl?: string | null;
  defaultFocusX?: number;
  defaultFocusY?: number;
  defaultZoom?: number;
  preset?: ImageAspectPreset;
  fieldPrefix?: FramingFieldPrefix;
};

export function FramedMediaUploadField({
  uploadName,
  defaultMediaId = "",
  defaultPhotoUrl = null,
  defaultFocusX = DEFAULT_PHOTO_FOCUS,
  defaultFocusY = DEFAULT_PHOTO_FOCUS,
  defaultZoom = DEFAULT_PHOTO_ZOOM,
  preset = "16x9",
  fieldPrefix = "image",
}: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultPhotoUrl);
  const [alignmentKey, setAlignmentKey] = useState(defaultMediaId || "none");
  const [framingDefaults, setFramingDefaults] = useState({
    x: defaultFocusX,
    y: defaultFocusY,
    zoom: defaultZoom,
  });
  const hiddenNames = framingHiddenInputNames(fieldPrefix);

  function handleUploaded(asset: { id: string; url: string }) {
    setPhotoUrl(asset.url);
    setAlignmentKey(asset.id);
    setFramingDefaults({
      x: DEFAULT_PHOTO_FOCUS,
      y: DEFAULT_PHOTO_FOCUS,
      zoom: DEFAULT_PHOTO_ZOOM,
    });
  }

  return (
    <div className="space-y-4">
      <MediaUploader
        name={uploadName}
        multiple={false}
        defaultValue={defaultMediaId}
        onUploaded={handleUploaded}
        help="Upload a new image or choose one from the media library."
      />
      {photoUrl ? (
        <ImageAlignmentEditor
          key={alignmentKey}
          photoUrl={photoUrl}
          preset={preset}
          fieldPrefix={fieldPrefix}
          defaultFocusX={framingDefaults.x}
          defaultFocusY={framingDefaults.y}
          defaultZoom={framingDefaults.zoom}
        />
      ) : (
        <>
          <input type="hidden" name={hiddenNames.focusX} value={defaultFocusX} />
          <input type="hidden" name={hiddenNames.focusY} value={defaultFocusY} />
          <input type="hidden" name={hiddenNames.zoom} value={defaultZoom} />
        </>
      )}
    </div>
  );
}
