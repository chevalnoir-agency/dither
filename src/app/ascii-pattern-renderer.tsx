"use client";

import * as React from "react";

import { useToolcraft } from "@/toolcraft/runtime/react";

import {
  drawAsciiPattern,
  getAsciiPatternProgress,
  getAsciiPatternRenderScale,
  getAsciiPatternSettings,
} from "./ascii-pattern";

export function AsciiPatternRenderer(): React.JSX.Element {
  const { state } = useToolcraft();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const suspendPreviewRef = React.useRef(false);

  React.useEffect(() => {
    const setSuspendedFromPointer = (event: PointerEvent): void => {
      const target = event.target;
      suspendPreviewRef.current =
        target instanceof Element &&
        target.closest('[data-slot="toolcraft-runtime-canvas"]') !== null;
    };
    const resumePreview = (): void => {
      suspendPreviewRef.current = false;
    };

    window.addEventListener("pointerdown", setSuspendedFromPointer, true);
    window.addEventListener("pointercancel", resumePreview, true);
    window.addEventListener("pointerup", resumePreview, true);

    return () => {
      window.removeEventListener("pointerdown", setSuspendedFromPointer, true);
      window.removeEventListener("pointercancel", resumePreview, true);
      window.removeEventListener("pointerup", resumePreview, true);
    };
  }, []);

  React.useLayoutEffect(() => {
    if (suspendPreviewRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const settings = getAsciiPatternSettings(state);
    const progress = getAsciiPatternProgress(state);
    const renderScale = getAsciiPatternRenderScale(state);
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1) * renderScale;
    const width = state.canvas.size.width;
    const height = state.canvas.size.height;
    const pixelWidth = Math.max(1, Math.round(width * pixelRatio));
    const pixelHeight = Math.max(1, Math.round(height * pixelRatio));

    if (canvas.width !== pixelWidth) {
      canvas.width = pixelWidth;
    }

    if (canvas.height !== pixelHeight) {
      canvas.height = pixelHeight;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.save();
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawAsciiPattern(context, {
      height,
      includeBackground: settings.includeBackground,
      progress,
      settings,
      width,
    });
    context.restore();
  }, [state]);

  return (
    <canvas
      aria-label="Generated ASCII dither pattern"
      className="block size-full"
      data-ascii-pattern-canvas=""
      data-renderer-layer="ascii-pattern"
      data-toolcraft-product-output=""
      ref={canvasRef}
    />
  );
}
