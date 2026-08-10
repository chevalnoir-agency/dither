"use client";

import * as React from "react";

import { useToolcraft } from "@/toolcraft/runtime/react";

import {
  createAsciiSourceSampler,
  drawAsciiPattern,
  getAsciiSourceImageAsset,
  getAsciiSourceVideoAsset,
  getAsciiSourceVideoTime,
  getAsciiPatternProgress,
  getAsciiPatternRenderScale,
  getAsciiPatternSettings,
  getAsciiSourceSamplerSize,
  loadAsciiSourceImage,
  loadAsciiSourceVideo,
  seekAsciiSourceVideo,
  type AsciiLoadedSourceImage,
  type AsciiLoadedSourceVideo,
} from "./ascii-pattern";

export function AsciiPatternRenderer(): React.JSX.Element {
  const { state } = useToolcraft();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const suspendPreviewRef = React.useRef(false);
  const sourceImageAsset = getAsciiSourceImageAsset(state);
  const sourceVideoAsset = getAsciiSourceVideoAsset(state);
  const [sourceImage, setSourceImage] =
    React.useState<AsciiLoadedSourceImage | null>(null);
  const [sourceVideo, setSourceVideo] =
    React.useState<AsciiLoadedSourceVideo | null>(null);
  const [sourceVideoFrameVersion, setSourceVideoFrameVersion] = React.useState(0);

  React.useEffect(() => {
    if (!sourceImageAsset) {
      setSourceImage(null);
      return;
    }

    let cancelled = false;

    void loadAsciiSourceImage(sourceImageAsset)
      .then((loadedImage) => {
        if (!cancelled) {
          setSourceImage(loadedImage ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSourceImage(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sourceImageAsset?.dataUrl, sourceImageAsset?.id]);

  React.useEffect(() => {
    if (!sourceVideoAsset) {
      setSourceVideo(null);
      return;
    }

    let cancelled = false;

    void loadAsciiSourceVideo(sourceVideoAsset)
      .then((loadedVideo) => {
        if (!cancelled) {
          setSourceVideo(loadedVideo ?? null);
          setSourceVideoFrameVersion((version) => version + 1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSourceVideo(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sourceVideoAsset?.dataUrl, sourceVideoAsset?.id]);

  React.useEffect(() => {
    if (!sourceVideo) {
      return;
    }

    const video = sourceVideo.video;
    const bumpFrameVersion = (): void => {
      setSourceVideoFrameVersion((version) => version + 1);
    };

    video.addEventListener("loadeddata", bumpFrameVersion);
    video.addEventListener("seeked", bumpFrameVersion);
    video.addEventListener("timeupdate", bumpFrameVersion);

    return () => {
      video.pause();
      video.removeEventListener("loadeddata", bumpFrameVersion);
      video.removeEventListener("seeked", bumpFrameVersion);
      video.removeEventListener("timeupdate", bumpFrameVersion);
    };
  }, [sourceVideo]);

  React.useEffect(() => {
    if (!sourceVideoAsset || !sourceVideo || sourceVideo.cacheKey !== sourceVideoAsset.dataUrl) {
      return;
    }

    const video = sourceVideo.video;
    const timelineDuration = Math.max(0.001, state.timeline.durationSeconds);
    const sourceTime = getAsciiSourceVideoTime({
      sourceDurationSeconds: sourceVideo.durationSeconds,
      state,
    });

    video.muted = true;
    video.loop = true;

    try {
      video.playbackRate = Math.min(
        16,
        Math.max(0.0625, sourceVideo.durationSeconds / timelineDuration),
      );
    } catch {
      video.playbackRate = 1;
    }

    if (state.timeline.isPlaying) {
      if (Math.abs(video.currentTime - sourceTime) > 0.2) {
        void seekAsciiSourceVideo(video, sourceTime);
      }

      void video.play().catch(() => {
        video.pause();
      });
      return;
    }

    video.pause();
    void seekAsciiSourceVideo(video, sourceTime).then(() => {
      setSourceVideoFrameVersion((version) => version + 1);
    });
  }, [
    sourceVideo,
    sourceVideoAsset?.dataUrl,
    state.timeline.currentTimeSeconds,
    state.timeline.durationSeconds,
    state.timeline.isPlaying,
  ]);

  const sourceSampler = React.useMemo(() => {
    const settings = getAsciiPatternSettings(state);
    const samplerSize = getAsciiSourceSamplerSize({
      height: state.canvas.size.height,
      settings,
      width: state.canvas.size.width,
    });

    if (sourceVideoAsset) {
      if (
        !sourceVideo ||
        sourceVideo.cacheKey !== sourceVideoAsset.dataUrl ||
        sourceVideo.video.readyState < 2
      ) {
        return undefined;
      }

      return createAsciiSourceSampler({
        image: sourceVideo.video,
        ...samplerSize,
        sourceHeight: sourceVideo.sourceHeight,
        sourceWidth: sourceVideo.sourceWidth,
        targetHeight: state.canvas.size.height,
        targetWidth: state.canvas.size.width,
      });
    }

    if (!sourceImageAsset || !sourceImage || sourceImage.cacheKey !== sourceImageAsset.dataUrl) {
      return undefined;
    }

    return createAsciiSourceSampler({
      image: sourceImage.image,
      ...samplerSize,
      sourceHeight: sourceImage.sourceHeight,
      sourceWidth: sourceImage.sourceWidth,
      targetHeight: state.canvas.size.height,
      targetWidth: state.canvas.size.width,
      transform: sourceImageAsset.transform,
    });
  }, [
    sourceImage,
    sourceVideo,
    sourceVideoAsset?.dataUrl,
    sourceVideoFrameVersion,
    sourceImageAsset?.dataUrl,
    sourceImageAsset?.transform?.flipHorizontal,
    sourceImageAsset?.transform?.flipVertical,
    sourceImageAsset?.transform?.rotationDeg,
    state.canvas.size.height,
    state.values["pattern.scale"],
    state.values["pattern.spacing"],
    state.timeline.currentTimeSeconds,
    state.canvas.size.width,
  ]);

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
      sourceSampler,
      width,
    });
    context.restore();
  }, [sourceSampler, state]);

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
