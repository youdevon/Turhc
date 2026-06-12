"use client";

import { useState } from "react";
import {
  DEFAULT_PHOTO_FOCUS,
  DEFAULT_PHOTO_ZOOM,
  framingHiddenInputNames,
  type FramingFieldPrefix,
  type ImageAspectPreset,
  type ImageFraming,
} from "@/lib/photo-framing";
import { ImageAlignmentEditor } from "./ImageAlignmentEditor";
import { MediaUrlField } from "./MediaUrlField";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  preset: ImageAspectPreset;
  name?: string;
  help?: string;
  required?: boolean;
  className?: string;
  fieldPrefix?: FramingFieldPrefix;
  defaultFocusX?: number;
  defaultFocusY?: number;
  defaultZoom?: number;
  focusX?: number;
  focusY?: number;
  zoom?: number;
  onFramingChange?: (framing: ImageFraming) => void;
};

export function FramedImageField({
  label,
  value,
  onChange,
  preset,
  name,
  help,
  required,
  className,
  fieldPrefix = "image",
  defaultFocusX = DEFAULT_PHOTO_FOCUS,
  defaultFocusY = DEFAULT_PHOTO_FOCUS,
  defaultZoom = DEFAULT_PHOTO_ZOOM,
  focusX,
  focusY,
  zoom,
  onFramingChange,
}: Props) {
  const [alignmentKey, setAlignmentKey] = useState(value || "none");
  const [framingDefaults, setFramingDefaults] = useState({
    x: defaultFocusX,
    y: defaultFocusY,
    zoom: defaultZoom,
  });

  const isControlled = focusX !== undefined && focusY !== undefined && zoom !== undefined && !!onFramingChange;
  const hiddenNames = framingHiddenInputNames(fieldPrefix);

  function handleUrlChange(url: string) {
    onChange(url);
    if (url !== value) {
      setAlignmentKey(url || "none");
      if (!isControlled) {
        setFramingDefaults({
          x: DEFAULT_PHOTO_FOCUS,
          y: DEFAULT_PHOTO_FOCUS,
          zoom: DEFAULT_PHOTO_ZOOM,
        });
        onFramingChange?.({
          imageFocusX: DEFAULT_PHOTO_FOCUS,
          imageFocusY: DEFAULT_PHOTO_FOCUS,
          imageZoom: DEFAULT_PHOTO_ZOOM,
        });
      }
    }
  }

  return (
    <div className="space-y-4">
      <MediaUrlField
        label={label}
        name={name}
        value={value}
        onChange={handleUrlChange}
        help={help}
        required={required}
        className={className}
      />
      {value && value.startsWith("/") ? (
        <ImageAlignmentEditor
          key={alignmentKey}
          photoUrl={value}
          preset={preset}
          fieldPrefix={fieldPrefix}
          defaultFocusX={framingDefaults.x}
          defaultFocusY={framingDefaults.y}
          defaultZoom={framingDefaults.zoom}
          focusX={isControlled ? focusX : undefined}
          focusY={isControlled ? focusY : undefined}
          zoom={isControlled ? zoom : undefined}
          onFramingChange={onFramingChange}
          showHiddenInputs={!isControlled}
        />
      ) : (
        !isControlled && (
          <>
            <input type="hidden" name={hiddenNames.focusX} value={defaultFocusX} />
            <input type="hidden" name={hiddenNames.focusY} value={defaultFocusY} />
            <input type="hidden" name={hiddenNames.zoom} value={defaultZoom} />
          </>
        )
      )}
    </div>
  );
}
