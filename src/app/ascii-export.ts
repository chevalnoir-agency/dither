import { ArrayBufferTarget, Muxer } from "mp4-muxer";

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
  getAsciiSourceImageInvert,
  getAsciiSourceVideoAsset,
  getAsciiSourceVideoInvert,
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
const gifFrameRate = 12;

type GifWorkerRequest =
  {
    delayMs: number;
    first: boolean;
    height: number;
    palette?: number[][];
    rgba: ArrayBuffer;
    type: "encode-frame";
    width: number;
  };

type GifWorkerResponse =
  | { bytes: ArrayBuffer; palette?: number[][]; type: "frame-complete" }
  | { message: string; type: "error" };

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

function sendGifWorkerRequest(
  worker: Worker,
  request: GifWorkerRequest,
  transfer: Transferable[] = [],
): Promise<GifWorkerResponse> {
  return new Promise((resolve, reject) => {
    const handleError = (event: ErrorEvent): void => {
      cleanup();
      reject(event.error ?? new Error(event.message || "GIF encoder worker failed."));
    };
    const handleMessage = (event: MessageEvent<GifWorkerResponse>): void => {
      cleanup();
      if (event.data.type === "error") {
        reject(new Error(event.data.message));
        return;
      }

      resolve(event.data);
    };
    const cleanup = (): void => {
      worker.removeEventListener("error", handleError);
      worker.removeEventListener("message", handleMessage);
    };

    worker.addEventListener("error", handleError);
    worker.addEventListener("message", handleMessage);
    worker.postMessage(request, transfer);
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
        invertLuminance: getAsciiSourceVideoInvert(state),
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
    invertLuminance: getAsciiSourceImageInvert(state),
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
  await seekAsciiSourceVideo(video, 0);
  video.playbackRate = 1;
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
        invertLuminance: getAsciiSourceVideoInvert(state),
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

const mp4KeyFrameIntervalSeconds = 2;

function getMp4Bitrate(width: number, height: number): number {
  return Math.round(
    Math.min(40_000_000, Math.max(2_000_000, width * height * videoFrameRate * 0.12)),
  );
}

async function getMp4EncoderConfig(
  width: number,
  height: number,
): Promise<VideoEncoderConfig | undefined> {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") {
    return undefined;
  }

  // High then Baseline profile, at the lowest level that fits the frame size.
  const level = width * height > 2560 * 1440 ? "33" : width * height > 1920 * 1088 ? "32" : "28";
  const codecs = [`avc1.6400${level}`, `avc1.4D00${level}`, `avc1.42E0${level}`, "avc1.640033"];

  for (const codec of codecs) {
    const config: VideoEncoderConfig = {
      avc: { format: "avc" },
      bitrate: getMp4Bitrate(width, height),
      codec,
      framerate: videoFrameRate,
      height,
      width,
    };

    try {
      const support = await VideoEncoder.isConfigSupported(config);

      if (support.supported) {
        return config;
      }
    } catch {
      // Try the next profile.
    }
  }

  return undefined;
}

// Encodes MP4 frame by frame with WebCodecs and muxes a standard (non-fragmented,
// fast-start) H.264 file with a constant frame rate and a real duration header, so
// the result opens in QuickTime, editing software, and upload pipelines. MediaRecorder
// MP4 is fragmented, has a zero header duration, and a real-time variable cadence.
// Returns false when this browser has no usable H.264 WebCodecs encoder.
async function exportAsciiMp4WithWebCodecs(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<boolean> {
  const settings = getAsciiPatternSettings(state);
  const size = getToolcraftVideoExportSize({
    resolution: settings.videoResolution,
    state,
  });
  // H.264 requires even dimensions.
  const width = Math.max(2, size.width - (size.width % 2));
  const height = Math.max(2, size.height - (size.height % 2));
  const encoderConfig = await getMp4EncoderConfig(width, height);

  if (!encoderConfig) {
    return false;
  }

  const durationSeconds = settings.videoDurationSeconds;
  const frameCount = Math.max(2, Math.round(durationSeconds * videoFrameRate));
  const frameDurationUs = Math.round(1_000_000 / videoFrameRate);
  const keyFrameInterval = mp4KeyFrameIntervalSeconds * videoFrameRate;
  const getSourceSampler = await createExportSourceSamplerFactory(state);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Video export requires a 2D canvas context.");
  }

  const includeBackground =
    shouldIncludeAsciiVideoBackground(state) &&
    shouldIncludeToolcraftExportBackground({
      format: "video",
      schema: state.schema,
    });
  const muxer = new Muxer({
    fastStart: "in-memory",
    target: new ArrayBufferTarget(),
    video: { codec: "avc", frameRate: videoFrameRate, height, width },
  });
  let encoderError: unknown;
  const encoder = new VideoEncoder({
    error: (error) => {
      encoderError = error;
    },
    output: (chunk, metadata) => {
      muxer.addVideoChunk(chunk, metadata);
    },
  });
  encoder.configure(encoderConfig);

  try {
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      if (encoderError) {
        throw encoderError;
      }

      const timeSeconds = (frameIndex / frameCount) * durationSeconds;
      const sourceSampler = await getSourceSampler(timeSeconds);
      context.save();
      context.setTransform(size.pixelRatio, 0, 0, size.pixelRatio, 0, 0);
      drawAsciiPattern(context, {
        height: state.canvas.size.height,
        includeBackground,
        progress: getAsciiPatternProgress(state, timeSeconds, durationSeconds),
        settings,
        sourceSampler,
        width: state.canvas.size.width,
      });
      context.restore();

      const frame = new VideoFrame(canvas, {
        duration: frameDurationUs,
        timestamp: frameIndex * frameDurationUs,
      });
      try {
        encoder.encode(frame, { keyFrame: frameIndex % keyFrameInterval === 0 });
      } finally {
        frame.close();
      }
      reportProgress((frameIndex / frameCount) * 0.95);

      // Keep memory bounded and let the progress indicator repaint.
      while (encoder.encodeQueueSize > 4 && !encoderError) {
        await wait(4);
      }
      if (frameIndex % 4 === 0) {
        await wait(0);
      }
    }

    await encoder.flush();
    if (encoderError) {
      throw encoderError;
    }
    muxer.finalize();
  } finally {
    if (encoder.state !== "closed") {
      encoder.close();
    }
  }

  const blob = new Blob([muxer.target.buffer], { type: "video/mp4" });
  if (blob.size === 0) {
    throw new Error("Video export produced an empty blob.");
  }

  const fileName = `${getSafeFileStem()}.mp4`;
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
  return true;
}

export async function exportAsciiVideo(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  const settings = getAsciiPatternSettings(state);

  if (settings.videoFormat === "gif") {
    await exportAsciiGif(state, reportProgress);
    return;
  }

  if (settings.videoFormat === "mp4" && (await exportAsciiMp4WithWebCodecs(state, reportProgress))) {
    return;
  }

  const { height, pixelRatio, width } = getToolcraftVideoExportSize({
    resolution: settings.videoResolution,
    state,
  });
  const recorderTarget = getRecorderMimeType(settings.videoFormat);
  const durationSeconds = settings.videoDurationSeconds;
  const sourceSamplerFactory = await createVideoExportSourceSamplerFactory(state);
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
        progress: getAsciiPatternProgress(state, timeSeconds, durationSeconds),
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

async function exportAsciiGif(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  const settings = getAsciiPatternSettings(state);
  const { height, pixelRatio, width } = getToolcraftVideoExportSize({
    resolution: settings.videoResolution,
    state,
  });
  const durationSeconds = settings.videoDurationSeconds;
  const frameCount = Math.max(2, Math.round(durationSeconds * gifFrameRate));
  const totalDelayCentiseconds = Math.max(1, Math.round(durationSeconds * 100));
  const getSourceSampler = await createExportSourceSamplerFactory(state);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("GIF export requires a 2D canvas context.");
  }

  const includeBackground =
    shouldIncludeAsciiVideoBackground(state) &&
    shouldIncludeToolcraftExportBackground({
      format: "video",
      schema: state.schema,
    });
  const workerCount = Math.min(
    4,
    Math.max(2, Math.floor((navigator.hardwareConcurrency || 4) - 1)),
  );
  const workers = Array.from(
    { length: workerCount },
    () => new Worker(new URL("./gif-encoder.worker.ts", import.meta.url), { type: "module" }),
  );
  const chunks = new Array<ArrayBuffer>(frameCount);
  const inFlight = new Array<Promise<void> | undefined>(workerCount);
  let completedFrames = 0;

  const getFrameDelayMs = (frameIndex: number): number => {
    const delayStart = Math.round((frameIndex / frameCount) * totalDelayCentiseconds);
    const delayEnd = Math.round(((frameIndex + 1) / frameCount) * totalDelayCentiseconds);
    return Math.max(1, delayEnd - delayStart) * 10;
  };
  const renderFrame = async (frameIndex: number): Promise<Uint8ClampedArray> => {
    const timeSeconds = (frameIndex / frameCount) * durationSeconds;
    const sourceSampler = await getSourceSampler(timeSeconds);

    context.save();
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawAsciiPattern(context, {
      height: state.canvas.size.height,
      includeBackground,
      progress: getAsciiPatternProgress(state, timeSeconds, durationSeconds),
      settings,
      sourceSampler,
      width: state.canvas.size.width,
    });
    context.restore();
    return context.getImageData(0, 0, width, height).data;
  };

  try {
    const firstRgba = await renderFrame(0);
    const firstRgbaBuffer = firstRgba.buffer as ArrayBuffer;
    const firstResult = await sendGifWorkerRequest(
      workers[0]!,
      {
        delayMs: getFrameDelayMs(0),
        first: true,
        height,
        rgba: firstRgbaBuffer,
        type: "encode-frame",
        width,
      },
      [firstRgbaBuffer],
    );
    if (firstResult.type !== "frame-complete" || !firstResult.palette) {
      throw new Error("GIF export could not create its shared color palette.");
    }
    chunks[0] = firstResult.bytes;
    const palette = firstResult.palette;
    completedFrames = 1;
    reportProgress((completedFrames / frameCount) * 0.95);

    for (let frameIndex = 1; frameIndex < frameCount; frameIndex += 1) {
      const workerIndex = frameIndex % workers.length;
      await inFlight[workerIndex];
      const rgba = await renderFrame(frameIndex);
      const rgbaBuffer = rgba.buffer as ArrayBuffer;
      inFlight[workerIndex] = sendGifWorkerRequest(
        workers[workerIndex]!,
        {
          delayMs: getFrameDelayMs(frameIndex),
          first: false,
          height,
          palette,
          rgba: rgbaBuffer,
          type: "encode-frame",
          width,
        },
        [rgbaBuffer],
      ).then((result) => {
        if (result.type !== "frame-complete") {
          throw new Error("GIF export did not return an encoded frame.");
        }

        chunks[frameIndex] = result.bytes;
        completedFrames += 1;
        reportProgress((completedFrames / frameCount) * 0.95);
      });
    }
    await Promise.all(inFlight.filter((promise): promise is Promise<void> => Boolean(promise)));

    if (chunks.some((chunk) => !chunk)) {
      throw new Error("GIF export is missing one or more encoded frames.");
    }

    const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 1);
    const bytes = new Uint8Array(byteLength);
    let byteOffset = 0;
    for (const chunk of chunks) {
      bytes.set(new Uint8Array(chunk), byteOffset);
      byteOffset += chunk.byteLength;
    }
    bytes[byteOffset] = 0x3b;
    const blob = new Blob([bytes], { type: "image/gif" });
    if (blob.size === 0) {
      throw new Error("GIF export produced an empty blob.");
    }

    const fileName = `${getSafeFileStem()}.gif`;
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
  } finally {
    for (const worker of workers) {
      worker.terminate();
    }
  }
}
