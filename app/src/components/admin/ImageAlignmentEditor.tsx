"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_PHOTO_FOCUS,
  DEFAULT_PHOTO_ZOOM,
  IMAGE_ASPECT_PRESETS,
  PHOTO_ZOOM_MAX,
  PHOTO_ZOOM_MIN,
  framingHiddenInputNames,
  imageFramingStyle,
  resolveImageFraming,
  type FramingFieldPrefix,
  type ImageAspectPreset,
  type ImageFraming,
} from "@/lib/photo-framing";
import { cn } from "@/lib/utils";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type Props = {
  photoUrl: string;
  preset?: ImageAspectPreset;
  fieldPrefix?: FramingFieldPrefix;
  defaultFocusX?: number;
  defaultFocusY?: number;
  defaultZoom?: number;
  focusX?: number;
  focusY?: number;
  zoom?: number;
  onFramingChange?: (framing: ImageFraming) => void;
  showHiddenInputs?: boolean;
};

export function ImageAlignmentEditor({
  photoUrl,
  preset = "portrait-person",
  fieldPrefix = "image",
  defaultFocusX = DEFAULT_PHOTO_FOCUS,
  defaultFocusY = DEFAULT_PHOTO_FOCUS,
  defaultZoom = DEFAULT_PHOTO_ZOOM,
  focusX: controlledFocusX,
  focusY: controlledFocusY,
  zoom: controlledZoom,
  onFramingChange,
  showHiddenInputs = true,
}: Props) {
  const presetConfig = IMAGE_ASPECT_PRESETS[preset];
  const isControlled =
    controlledFocusX !== undefined &&
    controlledFocusY !== undefined &&
    controlledZoom !== undefined &&
    !!onFramingChange;

  const [focusX, setFocusX] = useState(defaultFocusX);
  const [focusY, setFocusY] = useState(defaultFocusY);
  const [zoom, setZoom] = useState(defaultZoom);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startFocusX: number;
    startFocusY: number;
    width: number;
    height: number;
  } | null>(null);

  const currentFocusX = isControlled ? controlledFocusX : focusX;
  const currentFocusY = isControlled ? controlledFocusY : focusY;
  const currentZoom = isControlled ? controlledZoom : zoom;

  useEffect(() => {
    if (isControlled) return;
    setFocusX(defaultFocusX);
    setFocusY(defaultFocusY);
    setZoom(defaultZoom);
  }, [defaultFocusX, defaultFocusY, defaultZoom, isControlled]);

  const emitFraming = useCallback(
    (next: ImageFraming) => {
      if (onFramingChange) {
        onFramingChange(resolveImageFraming(next));
        return;
      }
      setFocusX(next.imageFocusX);
      setFocusY(next.imageFocusY);
      setZoom(next.imageZoom);
    },
    [onFramingChange],
  );

  const resetFraming = useCallback(() => {
    emitFraming({
      imageFocusX: DEFAULT_PHOTO_FOCUS,
      imageFocusY: DEFAULT_PHOTO_FOCUS,
      imageZoom: DEFAULT_PHOTO_ZOOM,
    });
  }, [emitFraming]);

  function updateFraming(patch: Partial<ImageFraming>) {
    emitFraming({
      imageFocusX: patch.imageFocusX ?? currentFocusX,
      imageFocusY: patch.imageFocusY ?? currentFocusY,
      imageZoom: patch.imageZoom ?? currentZoom,
    });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startFocusX: currentFocusX,
      startFocusY: currentFocusY,
      width: rect.width,
      height: rect.height,
    };
    frame.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const deltaX = ((e.clientX - drag.startX) / drag.width) * 100;
    const deltaY = ((e.clientY - drag.startY) / drag.height) * 100;

    updateFraming({
      imageFocusX: clamp(Math.round(drag.startFocusX - deltaX), 0, 100),
      imageFocusY: clamp(Math.round(drag.startFocusY - deltaY), 0, 100),
    });
  }

  function handlePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    frameRef.current?.releasePointerCapture(e.pointerId);
  }

  const hiddenNames = framingHiddenInputNames(fieldPrefix);
  const imgStyle = imageFramingStyle(currentFocusX, currentFocusY, currentZoom);

  const cropArea = (
    <div
      ref={frameRef}
      className={cn(presetConfig.cropClass)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt="Image framing preview"
        className={cn(presetConfig.imgClass, "pointer-events-none select-none")}
        style={imgStyle}
        draggable={false}
      />
      <div className="photo-alignment-guide" aria-hidden="true">
        <span className="photo-alignment-guide__label">Visible on website</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">{presetConfig.hint}</p>

      <div className={presetConfig.previewClass}>
        {preset === "portrait-person" ? (
          <article className="public-content-card public-content-card--person border border-border">
            <div className="photo-alignment-viewfinder public-content-card__media">{cropArea}</div>
            <div className="public-content-card__body photo-alignment-body-preview">
              <p className="photo-alignment-body-preview__hint">Name &amp; title appear here</p>
            </div>
          </article>
        ) : (
          <div className="photo-alignment-viewfinder photo-alignment-viewfinder--flat">{cropArea}</div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-muted">Horizontal ({currentFocusX}%)</span>
          <input
            type="range"
            min={0}
            max={100}
            value={currentFocusX}
            onChange={(e) => updateFraming({ imageFocusX: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Vertical ({currentFocusY}%)</span>
          <input
            type="range"
            min={0}
            max={100}
            value={currentFocusY}
            onChange={(e) => updateFraming({ imageFocusY: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-muted">Zoom ({currentZoom}%)</span>
        <input
          type="range"
          min={PHOTO_ZOOM_MIN}
          max={PHOTO_ZOOM_MAX}
          value={currentZoom}
          onChange={(e) => updateFraming({ imageZoom: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <span className="text-xs text-muted">
          Zoom in for a close-up, zoom out for a wider frame.
        </span>
      </label>

      <button
        type="button"
        onClick={resetFraming}
        className="text-xs text-primary hover:underline"
      >
        Reset to defaults
      </button>

      {showHiddenInputs && !isControlled && (
        <>
          <input type="hidden" name={hiddenNames.focusX} value={currentFocusX} />
          <input type="hidden" name={hiddenNames.focusY} value={currentFocusY} />
          <input type="hidden" name={hiddenNames.zoom} value={currentZoom} />
        </>
      )}
    </div>
  );
}
