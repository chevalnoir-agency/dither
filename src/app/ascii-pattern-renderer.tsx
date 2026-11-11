"use client";

import * as React from "react";

import type { ToolcraftState } from "@/toolcraft/runtime";
import { useToolcraft } from "@/toolcraft/runtime/react";

import {
  createAsciiSourceSampler,
  createAsciiSourceSamplerSurface,
  drawAsciiPattern,
  getAsciiPatternProgress,
  getAsciiPatternRenderScale,
  getAsciiPatternSettings,
  getAsciiSourceImageAsset,
  getAsciiSourceImageInvert,
  getAsciiSourceSamplerSize,
  getAsciiSourceVideoAsset,
  getAsciiSourceVideoInvert,
  getAsciiSourceVideoTime,
  loadAsciiSourceImage,
  loadAsciiSourceVideo,
  seekAsciiSourceVideo,
  type AsciiLoadedSourceImage,
  type AsciiLoadedSourceVideo,
  type AsciiSourceSampler,
  type AsciiSourceSamplerSurface,
} from "./ascii-pattern";

function drawAsciiPreview({
  canvas,
  progress,
  sourceSampler,
  state,
}: {
  canvas: HTMLCanvasElement;
  progress?: number;
  sourceSampler?: AsciiSourceSampler;
  state: ToolcraftState;
}): void {
  const settings = getAsciiPatternSettings(state);
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
    progress: progress ?? getAsciiPatternProgress(state),
    settings,
    sourceSampler,
    width,
  });
  context.restore();
}

export function AsciiPatternRenderer(): React.JSX.Element {
  const { state } = useToolcraft();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const stateRef = React.useRef(state);
  const suspendPreviewRef = React.useRef(false);
  const sourceSamplerSurfaceRef = React.useRef<AsciiSourceSamplerSurface | undefined>(undefined);
  const sourceImageAsset = getAsciiSourceImageAsset(state);
  const sourceVideoAsset = getAsciiSourceVideoAsset(state);
  const [sourceImage, setSourceImage] = React.useState<AsciiLoadedSourceImage | null>(null);
  const [sourceVideo, setSourceVideo] = React.useState<AsciiLoadedSourceVideo | null>(null);
  const [pausedVideoFrameVersion, setPausedVideoFrameVersion] = React.useState(0);

  stateRef.current = state;

  const getReusableSamplerSurface = React.useCallback(() => {
    sourceSamplerSurfaceRef.current ??= createAsciiSourceSamplerSurface();
    return sourceSamplerSurfaceRef.current;
  }, []);

  React.useEffect(() => {
    if (!sourceImageAsset) {
      setSourceImage(null);
      return;
    }

    let cancelled = false;

    void loadAsciiSourceImage(sourceImageAsset)
      .then((loadedImage) => {
        if (!cancelled) setSourceImage(loadedImage ?? null);
      })
      .catch(() => {
        if (!cancelled) setSourceImage(null);
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
          setPausedVideoFrameVersion((version) => version + 1);
        }
      })
      .catch(() => {
        if (!cancelled) setSourceVideo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceVideoAsset?.dataUrl, sourceVideoAsset?.id]);

  React.useEffect(() => {
    if (!sourceVideoAsset || !sourceVideo || sourceVideo.cacheKey !== sourceVideoAsset.dataUrl) {
      return;
    }

    const video = sourceVideo.video;
    const sourceTime = getAsciiSourceVideoTime({
      sourceDurationSeconds: sourceVideo.durationSeconds,
      state,
    });
    let cancelled = false;

    video.muted = true;
    video.loop = true;

    video.playbackRate = 1;

    if (!state.timeline.isPlaying) {
      video.pause();
      return;
    }

    void (async () => {
      if (Math.abs(video.currentTime - sourceTime) > 0.2) {
        await seekAsciiSourceVideo(video, sourceTime);
      }

      if (!cancelled && stateRef.current.timeline.isPlaying) {
        await video.play().catch(() => video.pause());
      }
    })();

    return () => {
      cancelled = true;
      video.pause();
    };
  }, [
    sourceVideo,
    sourceVideoAsset?.dataUrl,
    state.timeline.durationSeconds,
    state.timeline.isPlaying,
  ]);

  React.useEffect(() => {
    if (
      state.timeline.isPlaying ||
      !sourceVideoAsset ||
      !sourceVideo ||
      sourceVideo.cacheKey !== sourceVideoAsset.dataUrl
    ) {
      return;
    }

    let cancelled = false;
    const sourceTime = getAsciiSourceVideoTime({
      sourceDurationSeconds: sourceVideo.durationSeconds,
      state,
    });

    sourceVideo.video.pause();
    void seekAsciiSourceVideo(sourceVideo.video, sourceTime).then(() => {
      if (!cancelled) setPausedVideoFrameVersion((version) => version + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [
    sourceVideo,
    sourceVideoAsset?.dataUrl,
    state.timeline.currentTimeSeconds,
    state.timeline.durationSeconds,
    state.timeline.isPlaying,
  ]);

  const staticSourceSampler = React.useMemo(() => {
    const settings = getAsciiPatternSettings(state);
    const samplerSize = getAsciiSourceSamplerSize({
      height: state.canvas.size.height,
      settings,
      width: state.canvas.size.width,
    });

    if (sourceVideoAsset) {
      if (
        state.timeline.isPlaying ||
        !sourceVideo ||
        sourceVideo.cacheKey !== sourceVideoAsset.dataUrl ||
        sourceVideo.video.readyState < 2
      ) {
        return undefined;
      }

      return createAsciiSourceSampler({
        image: sourceVideo.video,
        invertLuminance: getAsciiSourceVideoInvert(state),
        reuseSurface: getReusableSamplerSurface(),
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
      invertLuminance: getAsciiSourceImageInvert(state),
      ...samplerSize,
      sourceHeight: sourceImage.sourceHeight,
      sourceWidth: sourceImage.sourceWidth,
      targetHeight: state.canvas.size.height,
      targetWidth: state.canvas.size.width,
      transform: sourceImageAsset.transform,
    });
  }, [
    getReusableSamplerSurface,
    pausedVideoFrameVersion,
    sourceImage,
    sourceImageAsset?.dataUrl,
    sourceImageAsset?.transform?.flipHorizontal,
    sourceImageAsset?.transform?.flipVertical,
    sourceImageAsset?.transform?.rotationDeg,
    sourceVideo,
    sourceVideoAsset?.dataUrl,
    state.canvas.size.height,
    state.canvas.size.width,
    state.timeline.isPlaying,
    state.values["source.image.invert"],
    state.values["source.video.invert"],
    state.values["pattern.scale"],
    state.values["pattern.spacing"],
  ]);

  React.useEffect(() => {
    if (
      !state.timeline.isPlaying ||
      !sourceVideoAsset ||
      !sourceVideo ||
      sourceVideo.cacheKey !== sourceVideoAsset.dataUrl
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const video = sourceVideo.video;
    if (!canvas) {
      return;
    }

    let cancelled = false;
    let fallbackFrame = 0;
    let presentedFrame = 0;
    let videoFrame = 0;

    const renderPresentedFrame = (): void => {
      if (cancelled || suspendPreviewRef.current || video.readyState < 2) return;

      const currentState = stateRef.current;
      const settings = getAsciiPatternSettings(currentState);
      const samplerSize = getAsciiSourceSamplerSize({
        height: currentState.canvas.size.height,
        settings,
        width: currentState.canvas.size.width,
      });
      const sourceSampler = createAsciiSourceSampler({
        image: video,
        invertLuminance: getAsciiSourceVideoInvert(currentState),
        reuseSurface: getReusableSamplerSurface(),
        ...samplerSize,
        sourceHeight: sourceVideo.sourceHeight,
        sourceWidth: sourceVideo.sourceWidth,
        targetHeight: currentState.canvas.size.height,
        targetWidth: currentState.canvas.size.width,
      });
      drawAsciiPreview({
        canvas,
        progress: getAsciiPatternProgress(currentState),
        sourceSampler,
        state: currentState,
      });

      presentedFrame += 1;
      canvas.dataset.sourceVideoFrameCount = String(presentedFrame);
    };

    if (typeof video.requestVideoFrameCallback === "function") {
      const onVideoFrame: VideoFrameRequestCallback = () => {
        renderPresentedFrame();
        if (!cancelled) videoFrame = video.requestVideoFrameCallback(onVideoFrame);
      };

      videoFrame = video.requestVideoFrameCallback(onVideoFrame);

      return () => {
        cancelled = true;
        video.cancelVideoFrameCallback(videoFrame);
      };
    }

    let previousMediaTime = -1;
    const onAnimationFrame = () => {
      if (video.currentTime !== previousMediaTime) {
        previousMediaTime = video.currentTime;
        renderPresentedFrame();
      }
      if (!cancelled) fallbackFrame = window.requestAnimationFrame(onAnimationFrame);
    };

    fallbackFrame = window.requestAnimationFrame(onAnimationFrame);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(fallbackFrame);
    };
  }, [
    getReusableSamplerSurface,
    sourceVideo,
    sourceVideoAsset?.dataUrl,
    state.timeline.isPlaying,
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
    if (suspendPreviewRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const hasPlayingSourceVideo =
      state.timeline.isPlaying &&
      sourceVideoAsset !== undefined &&
      sourceVideo !== null &&
      sourceVideo.cacheKey === sourceVideoAsset.dataUrl;

    if (hasPlayingSourceVideo) return;

    delete canvas.dataset.sourceVideoFrameCount;
    drawAsciiPreview({ canvas, sourceSampler: staticSourceSampler, state });
  }, [sourceVideo, sourceVideoAsset?.dataUrl, staticSourceSampler, state]);

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
