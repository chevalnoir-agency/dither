import {
  createToolcraftPngExportCanvas,
  getToolcraftVideoExportSize,
  shouldIncludeToolcraftExportBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";

import {
  createAsciiSourceSampler,
  createAsciiPatternFrame,
  createAsciiPatternSvg,
  drawAsciiPattern,
  getAsciiSourceImageAsset,
  getAsciiSourceVideoAsset,
  getAsciiSourceVideoTime,
  getAsciiPatternProgress,
  getAsciiPatternSettings,
  getAsciiSourceSamplerSize,
  loadAsciiSourceImage,
  loadAsciiSourceVideo,
  seekAsciiSourceVideo,
  type AsciiSourceSampler,
  shouldIncludeAsciiVideoBackground,
} from "./ascii-pattern";

type ExportRecord = {
  blob: Blob;
  durationSeconds?: number;
  fileName: string;
  height?: number;
  kind: "image" | "svg" | "video";
  type: string;
  width?: number;
};

type WindowWithExports = Window & {
  __toolcraftLastExport?: ExportRecord;
};

const videoFrameRate = 30;

function getSafeFileStem(): string {
  return "ascii-dither-field";
}

function rememberExport(record: ExportRecord): void {
  (window as WindowWithExports).__toolcraftLastExport = record;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image export failed to produce a blob."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function getRecorderMimeType(requestedFormat: string): {
  extension: "mp4" | "webm";
  mimeType: string;
} {
  const candidates =
    requestedFormat === "mp4"
      ? [
          'video/mp4;codecs="avc1.42E01E"',
          "video/mp4",
          'video/webm;codecs="vp9"',
          'video/webm;codecs="vp8"',
          "video/webm",
        ]
      : ['video/webm;codecs="vp9"', 'video/webm;codecs="vp8"', "video/webm"];

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return {
        extension: mimeType.includes("mp4") ? "mp4" : "webm",
        mimeType,
      };
    }
  }

  throw new Error("This browser cannot record MP4 or WebM video from canvas.");
}

async function wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type ExportSourceSamplerFactory = (
  timeSeconds?: number,
) => Promise<AsciiSourceSampler | undefined>;

type VideoExportSourceSamplerFactory = {
  cleanup: () => void;
  getSourceSampler: ExportSourceSamplerFactory;
};

function stopRecorderSafely(recorder: MediaRecorder): void {
  if (recorder.state === "inactive") {
    return;
  }

  try {
    recorder.requestData();
  } catch {
    // Some engines only allow requestData once recording has fully started.
  }

  recorder.stop();
}

async function waitForRecordedBlob(
  finished: Promise<Blob>,
  timeoutMs: number,
): Promise<Blob> {
  let timeoutId = 0;
  const timeout = new Promise<Blob>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error("Video export did not finish encoding. Try WebM or a lower resolution."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([finished, timeout]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function createExportSourceSamplerFactory(
  state: ToolcraftState,
): Promise<ExportSourceSamplerFactory> {
  const settings = getAsciiPatternSettings(state);
  const samplerSize = getAsciiSourceSamplerSize({
    height: state.canvas.size.height,
    settings,
    width: state.canvas.size.width,
  });
  const sourceVideoAsset = getAsciiSourceVideoAsset(state);

  if (sourceVideoAsset) {
    const sourceVideo = await loadAsciiSourceVideo(sourceVideoAsset);

    if (!sourceVideo) {
      return async () => undefined;
    }

    return async (timeSeconds = state.timeline.currentTimeSeconds) => {
      await seekAsciiSourceVideo(
        sourceVideo.video,
        getAsciiSourceVideoTime({
          sourceDurationSeconds: sourceVideo.durationSeconds,
          state,
          timeSeconds,
        }),
      );

      return createAsciiSourceSampler({
        image: sourceVideo.video,
        ...samplerSize,
        sourceHeight: sourceVideo.sourceHeight,
        sourceWidth: sourceVideo.sourceWidth,
        targetHeight: state.canvas.size.height,
        targetWidth: state.canvas.size.width,
      });
    };
  }

  const sourceImageAsset = getAsciiSourceImageAsset(state);

  if (!sourceImageAsset) {
    return async () => undefined;
  }

  const sourceImage = await loadAsciiSourceImage(sourceImageAsset);

  if (!sourceImage) {
    return async () => undefined;
  }

  const sourceSampler = createAsciiSourceSampler({
    image: sourceImage.image,
    ...samplerSize,
    sourceHeight: sourceImage.sourceHeight,
    sourceWidth: sourceImage.sourceWidth,
    targetHeight: state.canvas.size.height,
    targetWidth: state.canvas.size.width,
    transform: sourceImageAsset.transform,
  });

  return async () => sourceSampler;
}

async function createVideoExportSourceSamplerFactory(
  state: ToolcraftState,
  durationSeconds: number,
): Promise<VideoExportSourceSamplerFactory> {
  const settings = getAsciiPatternSettings(state);
  const samplerSize = getAsciiSourceSamplerSize({
    height: state.canvas.size.height,
    settings,
    width: state.canvas.size.width,
  });
  const sourceVideoAsset = getAsciiSourceVideoAsset(state);

  if (!sourceVideoAsset) {
    return {
      cleanup: () => undefined,
      getSourceSampler: await createExportSourceSamplerFactory(state),
    };
  }

  const sourceVideo = await loadAsciiSourceVideo(sourceVideoAsset);

  if (!sourceVideo) {
    return {
      cleanup: () => undefined,
      getSourceSampler: async () => undefined,
    };
  }

  const video = sourceVideo.video;
  const playbackRate = Math.max(
    0.0625,
    Math.min(16, sourceVideo.durationSeconds / Math.max(0.001, durationSeconds)),
  );

  await seekAsciiSourceVideo(video, 0);
  video.playbackRate = playbackRate;
  const playPromise = video.play();
  await Promise.race([playPromise.catch(() => undefined), wait(1000)]);

  return {
    cleanup: () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    },
    getSourceSampler: async () =>
      createAsciiSourceSampler({
        image: video,
        ...samplerSize,
        sourceHeight: sourceVideo.sourceHeight,
        sourceWidth: sourceVideo.sourceWidth,
        targetHeight: state.canvas.size.height,
        targetWidth: state.canvas.size.width,
      }),
  };
}

export async function exportAsciiSvg(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  const settings = getAsciiPatternSettings(state);
  const progress = getAsciiPatternProgress(state);
  const getSourceSampler = await createExportSourceSamplerFactory(state);
  const sourceSampler = await getSourceSampler(state.timeline.currentTimeSeconds);
  const frame = createAsciiPatternFrame({
    height: state.canvas.size.height,
    includeBackground: settings.includeBackground,
    progress,
    settings,
    sourceSampler,
    width: state.canvas.size.width,
  });
  reportProgress(0.45);
  const svg = createAsciiPatternSvg(frame);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const fileName = `${getSafeFileStem()}.svg`;
  rememberExport({
    blob,
    fileName,
    height: frame.height,
    kind: "svg",
    type: blob.type,
    width: frame.width,
  });
  downloadBlob(blob, fileName);
  reportProgress(1);
}

export async function exportAsciiImage(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  const settings = getAsciiPatternSettings(state);
  const includeBackground = settings.includeBackground;
  const getSourceSampler = await createExportSourceSamplerFactory(state);
  const sourceSampler = await getSourceSampler(state.timeline.currentTimeSeconds);
  const imageResolution =
    typeof state.values["export.image.resolution"] === "string"
      ? state.values["export.image.resolution"]
      : settings.imageResolution;
  const canvas = createToolcraftPngExportCanvas({
    background: settings.background,
    includeBackground,
    render: ({ context, cssHeight, cssWidth }) => {
      drawAsciiPattern(context, {
        height: cssHeight,
        includeBackground,
        progress: getAsciiPatternProgress(state),
        settings,
        sourceSampler,
        width: cssWidth,
      });
    },
    resolution: imageResolution,
    state,
  });
  reportProgress(0.55);
  const imageFormat = settings.imageFormat;
  const mimeType = imageFormat === "jpg" ? "image/jpeg" : "image/png";
  const blob = await canvasToBlob(canvas, mimeType, imageFormat === "jpg" ? 0.92 : undefined);
  const fileName = `${getSafeFileStem()}.${imageFormat}`;
  rememberExport({
    blob,
    fileName,
    height: canvas.height,
    kind: "image",
    type: blob.type,
    width: canvas.width,
  });
  downloadBlob(blob, fileName);
  reportProgress(1);
}

export async function exportAsciiVideo(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  const settings = getAsciiPatternSettings(state);
  const { height, pixelRatio, width } = getToolcraftVideoExportSize({
    resolution: settings.videoResolution,
    state,
  });
  const recorderTarget = getRecorderMimeType(settings.videoFormat);
  const durationSeconds = Math.max(1, state.timeline.durationSeconds);
  const sourceSamplerFactory = await createVideoExportSourceSamplerFactory(
    state,
    durationSeconds,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Video export requires a 2D canvas context.");
  }

  const stream = canvas.captureStream(videoFrameRate);
  const [track] = stream.getVideoTracks();

  if (!track) {
    throw new Error("Video export failed to create a canvas video track.");
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: recorderTarget.mimeType });
  const frameCount = Math.max(2, Math.ceil(durationSeconds * videoFrameRate));
  const includeBackground =
    shouldIncludeAsciiVideoBackground(state) &&
    shouldIncludeToolcraftExportBackground({
      format: "video",
      schema: state.schema,
    });

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    });
    recorder.addEventListener("error", (event) => {
      const recorderError =
        event instanceof ErrorEvent ? event.error : new Error("Video recorder failed.");
      reject(recorderError);
    });
    recorder.addEventListener("stop", () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || recorderTarget.mimeType });
      if (blob.size === 0) {
        reject(new Error("Video export produced an empty blob."));
        return;
      }

      resolve(blob);
    });
  });

  recorder.start(1000);
  const recordingStartedAt = performance.now();

  try {
    for (let frameIndex = 0; frameIndex <= frameCount; frameIndex += 1) {
      const targetTimeMs = recordingStartedAt + (frameIndex / frameCount) * durationSeconds * 1000;
      const delayMs = targetTimeMs - performance.now();

      if (delayMs > 0) {
        await wait(delayMs);
      }

      const timeSeconds = Math.min(
        durationSeconds,
        (frameIndex / frameCount) * durationSeconds,
      );
      context.save();
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const sourceSampler = await sourceSamplerFactory.getSourceSampler(timeSeconds);
      drawAsciiPattern(context, {
        height: state.canvas.size.height,
        includeBackground,
        progress: getAsciiPatternProgress(state, timeSeconds),
        settings,
        sourceSampler,
        width: state.canvas.size.width,
      });
      context.restore();
      (track as CanvasCaptureMediaStreamTrack).requestFrame?.();
      reportProgress(frameIndex / frameCount);

      if (delayMs <= 0 && frameIndex % 2 === 0) {
        await wait(0);
      }
    }
  } catch (error) {
    stopRecorderSafely(recorder);
    track.stop();
    sourceSamplerFactory.cleanup();
    throw error;
  }

  stopRecorderSafely(recorder);
  let blob: Blob;

  try {
    blob = await waitForRecordedBlob(finished, Math.max(5000, durationSeconds * 2000));
  } finally {
    track.stop();
    sourceSamplerFactory.cleanup();
  }
  const fileName = `${getSafeFileStem()}.${recorderTarget.extension}`;
  rememberExport({
    blob,
    durationSeconds,
    fileName,
    height,
    kind: "video",
    type: blob.type,
    width,
  });
  downloadBlob(blob, fileName);
  reportProgress(1);
}
