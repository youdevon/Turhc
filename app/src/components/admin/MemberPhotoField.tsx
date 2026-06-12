"use client";

import { useState } from "react";
import { DEFAULT_PHOTO_FOCUS, DEFAULT_PHOTO_ZOOM } from "@/lib/photo-framing";
import { ImageAlignmentEditor } from "./ImageAlignmentEditor";
import { MediaUploader } from "./MediaUploader";

type Props = {
  defaultPhotoId?: string;
  defaultPhotoUrl?: string | null;
  defaultFocusX?: number;
  defaultFocusY?: number;
  defaultZoom?: number;
};

export function MemberPhotoField({
  defaultPhotoId = "",
  defaultPhotoUrl = null,
  defaultFocusX = DEFAULT_PHOTO_FOCUS,
  defaultFocusY = DEFAULT_PHOTO_FOCUS,
  defaultZoom = DEFAULT_PHOTO_ZOOM,
}: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultPhotoUrl);
  const [alignmentKey, setAlignmentKey] = useState(defaultPhotoId || "none");
  const [framingDefaults, setFramingDefaults] = useState({
    x: defaultFocusX,
    y: defaultFocusY,
    zoom: defaultZoom,
  });

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
        name="photoId"
        multiple={false}
        defaultValue={defaultPhotoId}
        onUploaded={handleUploaded}
        help="Upload a new photo or choose one from the media library."
      />
      {photoUrl ? (
        <ImageAlignmentEditor
          key={alignmentKey}
          photoUrl={photoUrl}
          preset="portrait-person"
          fieldPrefix="photo"
          defaultFocusX={framingDefaults.x}
          defaultFocusY={framingDefaults.y}
          defaultZoom={framingDefaults.zoom}
        />
      ) : (
        <>
          <input type="hidden" name="photoFocusX" value={defaultFocusX} />
          <input type="hidden" name="photoFocusY" value={defaultFocusY} />
          <input type="hidden" name="photoZoom" value={defaultZoom} />
        </>
      )}
    </div>
  );
}
