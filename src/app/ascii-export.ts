import {
  createToolcraftPngExportCanvas,
  getToolcraftVideoExportSize,
  shouldIncludeToolcraftExportBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";

import {
  createAsciiPatternFrame,
  createAsciiPatternSvg,
  drawAsciiPattern,
  getAsciiPatternProgress,
  getAsciiPatternSettings,
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

export async function exportAsciiSvg(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  const settings = getAsciiPatternSettings(state);
  const progress = getAsciiPatternProgress(state);
  const frame = createAsciiPatternFrame({
    height: state.canvas.size.height,
    includeBackground: settings.includeBackground,
    progress,
    settings,
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
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Video export requires a 2D canvas context.");
  }

  const stream = canvas.captureStream(0);
  const [track] = stream.getVideoTracks();

  if (!track) {
    throw new Error("Video export failed to create a canvas video track.");
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: recorderTarget.mimeType });
  const durationSeconds = Math.max(1, state.timeline.durationSeconds);
  const frameCount = Math.max(2, Math.ceil(durationSeconds * videoFrameRate));
  const frameIntervalMs = 1000 / videoFrameRate;
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

  recorder.start();

  try {
    for (let frameIndex = 0; frameIndex <= frameCount; frameIndex += 1) {
      const timeSeconds = Math.min(
        durationSeconds,
        (frameIndex / frameCount) * durationSeconds,
      );
      context.save();
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawAsciiPattern(context, {
        height: state.canvas.size.height,
        includeBackground,
        progress: getAsciiPatternProgress(state, timeSeconds),
        settings,
        width: state.canvas.size.width,
      });
      context.restore();
      (track as CanvasCaptureMediaStreamTrack).requestFrame?.();
      reportProgress(frameIndex / frameCount);
      await wait(frameIntervalMs);
    }
  } catch (error) {
    recorder.stop();
    track.stop();
    throw error;
  }

  recorder.stop();
  const blob = await finished;
  track.stop();
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
