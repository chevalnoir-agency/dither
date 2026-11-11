import {
  getToolcraftTimelineLoopProgress,
  shouldIncludeToolcraftExportBackground,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftMediaAsset,
  type ToolcraftMediaTransform,
  type ToolcraftState,
} from "@/toolcraft/runtime";

export type AsciiParticleType = "cross" | "dot" | "hatch" | "mixed";

export const ASCII_SOURCE_IMAGE_TARGET = "source.image";
export const ASCII_SOURCE_IMAGE_INVERT_TARGET = "source.image.invert";
export const ASCII_SOURCE_VIDEO_TARGET = "source.video";
export const ASCII_SOURCE_VIDEO_INVERT_TARGET = "source.video.invert";

export type AsciiVideoExportDurationSeconds = 5 | 10 | 15;

export type AsciiPatternSettings = {
  background: string;
  density: number;
  ditherContrast: number;
  ditherStrength: number;
  ditherThreshold: number;
  imageFormat: "jpg" | "png";
  imageResolution: string;
  includeBackground: boolean;
  particleType: AsciiParticleType;
  scale: number;
  spacing: number;
  speed: number;
  videoDurationSeconds: AsciiVideoExportDurationSeconds;
  videoFormat: "gif" | "mp4" | "webm";
  videoResolution: string;
  voids: number;
};

export type AsciiGlyph = {
  char: string;
  color: string;
  size: number;
  thickness: number;
  x: number;
  y: number;
};

export type AsciiPatternFrame = {
  background: string;
  glyphs: AsciiGlyph[];
  height: number;
  includeBackground: boolean;
  width: number;
};

export type AsciiLoadedSourceImage = {
  cacheKey: string;
  image: CanvasImageSource;
  sourceHeight: number;
  sourceWidth: number;
};

export type AsciiLoadedSourceVideo = {
  cacheKey: string;
  durationSeconds: number;
  sourceHeight: number;
  sourceWidth: number;
  video: HTMLVideoElement;
};

export type AsciiSourceSampler = {
  data: Uint8ClampedArray;
  height: number;
  invertLuminance?: boolean;
  luminanceHigh: number;
  luminanceLow: number;
  targetHeight: number;
  targetWidth: number;
  width: number;
};

export type AsciiSourceSamplerSurface = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

export const ASCII_PARTICLE_LOW_COLOR = "#222629";
export const ASCII_PARTICLE_HIGH_COLOR = "#BEBDC1";

const fallbackSettings: AsciiPatternSettings = {
  background: "#0A0C11",
  density: 70,
  ditherContrast: 2,
  ditherStrength: 1.6,
  ditherThreshold: 0.6,
  imageFormat: "png",
  imageResolution: "4k",
  includeBackground: true,
  particleType: "cross",
  scale: 14,
  spacing: -2,
  speed: 1,
  videoDurationSeconds: 10,
  videoFormat: "mp4",
  videoResolution: "current",
  voids: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readColorHex(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value)) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "hex" in value &&
    typeof value.hex === "string" &&
    /^#[0-9a-f]{3,8}$/i.test(value.hex)
  ) {
    return value.hex;
  }

  return fallback;
}

function readParticleType(value: unknown): AsciiParticleType {
  return value === "dot" || value === "hatch" || value === "mixed" || value === "cross"
    ? value
    : "cross";
}

function readImageFormat(value: unknown): "jpg" | "png" {
  return value === "jpg" ? "jpg" : "png";
}

function readVideoDurationSeconds(value: unknown): AsciiVideoExportDurationSeconds {
  const seconds = Number(value);

  return seconds === 5 || seconds === 15 ? seconds : 10;
}

function readVideoFormat(value: unknown): "gif" | "mp4" | "webm" {
  return value === "gif" || value === "webm" ? value : "mp4";
}

function normalizeMediaRotation(rotationDeg: number | undefined): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round((rotationDeg ?? 0) / 90) * 90) % 360 + 360) % 360;

  return normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0;
}

export function getAsciiSourceImageAsset(
  state: ToolcraftState,
): ToolcraftMediaAsset | undefined {
  for (let index = state.mediaAssets.length - 1; index >= 0; index -= 1) {
    const asset = state.mediaAssets[index];
    if (
      asset?.sourceTarget === ASCII_SOURCE_IMAGE_TARGET &&
      (asset.assetKind ?? "image") === "image"
    ) {
      return asset;
    }
  }

  return undefined;
}

export function getAsciiSourceImageInvert(state: ToolcraftState): boolean {
  return state.values[ASCII_SOURCE_IMAGE_INVERT_TARGET] === true;
}

function isVideoMediaAsset(asset: ToolcraftMediaAsset): boolean {
  return (
    asset.sourceTarget === ASCII_SOURCE_VIDEO_TARGET &&
    (asset.mimeType.startsWith("video/") || /\.(?:mp4|m4v|mov|webm|ogg)$/i.test(asset.fileName))
  );
}

export function getAsciiSourceVideoAsset(
  state: ToolcraftState,
): ToolcraftMediaAsset | undefined {
  for (let index = state.mediaAssets.length - 1; index >= 0; index -= 1) {
    const asset = state.mediaAssets[index];
    if (asset && isVideoMediaAsset(asset)) {
      return asset;
    }
  }

  return undefined;
}

export function getAsciiSourceVideoInvert(state: ToolcraftState): boolean {
  return state.values[ASCII_SOURCE_VIDEO_INVERT_TARGET] === true;
}

export async function loadAsciiSourceImage(
  asset: ToolcraftMediaAsset,
): Promise<AsciiLoadedSourceImage | undefined> {
  if (!asset.dataUrl) {
    return undefined;
  }

  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not load source image "${asset.fileName}".`));
    image.src = asset.dataUrl;
  });

  const sourceWidth = asset.size?.width ?? image.naturalWidth ?? image.width;
  const sourceHeight = asset.size?.height ?? image.naturalHeight ?? image.height;

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return undefined;
  }

  return {
    cacheKey: asset.dataUrl,
    image,
    sourceHeight,
    sourceWidth,
  };
}

export async function loadAsciiSourceVideo(
  asset: ToolcraftMediaAsset,
): Promise<AsciiLoadedSourceVideo | undefined> {
  if (!asset.dataUrl) {
    return undefined;
  }

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  await new Promise<void>((resolve, reject) => {
    const cleanup = (): void => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
    };
    const handleLoadedMetadata = (): void => {
      cleanup();
      resolve();
    };
    const handleError = (): void => {
      cleanup();
      reject(new Error(`Could not load source video "${asset.fileName}".`));
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);
    video.src = asset.dataUrl;
    video.load();
  });

  const sourceWidth = asset.size?.width ?? video.videoWidth;
  const sourceHeight = asset.size?.height ?? video.videoHeight;
  const durationSeconds = Number.isFinite(video.duration) ? video.duration : 0;

  if (sourceWidth <= 0 || sourceHeight <= 0 || durationSeconds <= 0) {
    return undefined;
  }

  await seekAsciiSourceVideo(video, 0);

  return {
    cacheKey: asset.dataUrl,
    durationSeconds,
    sourceHeight,
    sourceWidth,
    video,
  };
}

export function getAsciiSourceVideoTime({
  sourceDurationSeconds,
  state,
  timeSeconds = state.timeline.currentTimeSeconds,
}: {
  sourceDurationSeconds: number;
  state: ToolcraftState;
  timeSeconds?: number;
}): number {
  const safeDuration = Math.max(0.001, sourceDurationSeconds);
  const safeTime = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0;
  const sourceTime = ((safeTime % safeDuration) + safeDuration) % safeDuration;

  return Math.min(sourceTime, Math.max(0, safeDuration - 0.033));
}

export async function seekAsciiSourceVideo(
  video: HTMLVideoElement,
  timeSeconds: number,
): Promise<void> {
  const durationSeconds = Number.isFinite(video.duration) ? video.duration : 0;
  const targetTime = Math.min(
    Math.max(0, timeSeconds),
    Math.max(0, durationSeconds - 0.033),
  );

  if (video.readyState >= 2 && Math.abs(video.currentTime - targetTime) < 0.025) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (): void => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve();
    };
    const fail = (): void => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(new Error("Source video seek failed."));
    };
    const cleanup = (): void => {
      window.clearTimeout(timeout);
      video.removeEventListener("seeked", finish);
      video.removeEventListener("loadeddata", finish);
      video.removeEventListener("error", fail);
    };
    const timeout = window.setTimeout(finish, 1500);

    video.addEventListener("seeked", finish);
    video.addEventListener("loadeddata", finish);
    video.addEventListener("error", fail);

    try {
      video.currentTime = targetTime;
      if (video.readyState >= 2 && Math.abs(video.currentTime - targetTime) < 0.025) {
        finish();
      }
    } catch {
      fail();
    }
  });
}

export function createAsciiSourceSampler({
  image,
  invertLuminance = false,
  reuseSurface,
  sampleHeight,
  sampleWidth,
  sourceHeight,
  sourceWidth,
  targetHeight,
  targetWidth,
  transform,
}: {
  image: CanvasImageSource;
  invertLuminance?: boolean;
  reuseSurface?: AsciiSourceSamplerSurface;
  sampleHeight?: number;
  sampleWidth?: number;
  sourceHeight: number;
  sourceWidth: number;
  targetHeight: number;
  targetWidth: number;
  transform?: ToolcraftMediaTransform;
}): AsciiSourceSampler | undefined {
  const width = Math.max(1, Math.round(sampleWidth ?? targetWidth));
  const height = Math.max(1, Math.round(sampleHeight ?? targetHeight));
  const canvas = reuseSurface?.canvas ?? document.createElement("canvas");
  const context =
    reuseSurface?.context ?? canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return undefined;
  }

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }

  const rotationDeg = normalizeMediaRotation(transform?.rotationDeg);
  const isQuarterTurn = rotationDeg === 90 || rotationDeg === 270;
  const rotatedWidth = isQuarterTurn ? sourceHeight : sourceWidth;
  const rotatedHeight = isQuarterTurn ? sourceWidth : sourceHeight;
  const coverScale = Math.max(width / rotatedWidth, height / rotatedHeight);
  const drawWidth = sourceWidth * coverScale;
  const drawHeight = sourceHeight * coverScale;

  context.save();
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.translate(width / 2, height / 2);
  context.rotate((rotationDeg * Math.PI) / 180);
  context.scale(transform?.flipHorizontal ? -1 : 1, transform?.flipVertical ? -1 : 1);
  try {
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } catch {
    context.restore();
    return undefined;
  }
  context.restore();

  let data: Uint8ClampedArray;

  try {
    data = context.getImageData(0, 0, width, height).data;
  } catch {
    return undefined;
  }

  const levels = getAsciiSourceLuminanceLevels(data);

  return {
    data,
    height,
    invertLuminance,
    luminanceHigh: levels.high,
    luminanceLow: levels.low,
    targetHeight,
    targetWidth,
    width,
  };
}

export function createAsciiSourceSamplerSurface(): AsciiSourceSamplerSurface | undefined {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  return context ? { canvas, context } : undefined;
}

function getRawAsciiSourceLuminance(data: Uint8ClampedArray, index: number): number {
  const red = data[index] ?? 0;
  const green = data[index + 1] ?? 0;
  const blue = data[index + 2] ?? 0;
  const alpha = (data[index + 3] ?? 255) / 255;

  return ((red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255) * alpha;
}

function getAsciiSourceLuminanceLevels(data: Uint8ClampedArray): {
  high: number;
  low: number;
} {
  const histogram = new Uint32Array(256);
  let total = 0;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = getRawAsciiSourceLuminance(data, index);
    const bin = Math.round(clamp(luminance, 0, 1) * 255);
    histogram[bin] = (histogram[bin] ?? 0) + 1;
    total += 1;
  }

  if (total <= 0) {
    return { high: 1, low: 0 };
  }

  const findPercentile = (target: number): number => {
    let cumulative = 0;

    for (let index = 0; index < histogram.length; index += 1) {
      cumulative += histogram[index] ?? 0;
      if (cumulative >= target) {
        return index / 255;
      }
    }

    return 1;
  };

  let low = findPercentile(total * 0.02);
  let high = findPercentile(total * 0.98);

  if (high - low < 0.06) {
    const center = (low + high) / 2;
    const halfRange = Math.max(0.02, Math.min(0.25, center, 1 - center));
    low = Math.max(0, center - halfRange);
    high = Math.min(1, center + halfRange);
  }

  if (high - low < 0.02) {
    high = Math.min(1, low + 0.02);
  }

  return { high, low };
}

function sampleAsciiSourceLuminance(
  sampler: AsciiSourceSampler,
  x: number,
  y: number,
): number {
  const sampleX = Math.max(
    0,
    Math.min(
      sampler.width - 1,
      Math.round((x / Math.max(1, sampler.targetWidth)) * (sampler.width - 1)),
    ),
  );
  const sampleY = Math.max(
    0,
    Math.min(
      sampler.height - 1,
      Math.round((y / Math.max(1, sampler.targetHeight)) * (sampler.height - 1)),
    ),
  );
  const index = (sampleY * sampler.width + sampleX) * 4;
  const rawLuminance = getRawAsciiSourceLuminance(sampler.data, index);
  const range = Math.max(0.02, sampler.luminanceHigh - sampler.luminanceLow);

  const normalizedLuminance = clamp(
    (rawLuminance - sampler.luminanceLow) / range,
    0,
    1,
  );

  return sampler.invertLuminance ? 1 - normalizedLuminance : normalizedLuminance;
}

function hashNoise(x: number, y: number, seed: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function hexToRgb(color: string): [number, number, number] {
  const hex = color.replace("#", "");
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((channel) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

export function getAsciiParticleColor(tone: number, depth = 2): string {
  const normalizedTone = clamp(tone, 0, 1);
  const depthAmount = clamp(depth, 0, 2) / 2;
  const extraDepthAmount = clamp(depth - 2, 0, 1);
  const mediaTone = lerp(0.5, normalizedTone, depthAmount);
  const enhancedTone = smoothstep(0, 1, normalizedTone);
  const amount = lerp(mediaTone, enhancedTone, extraDepthAmount);
  const low = hexToRgb(ASCII_PARTICLE_LOW_COLOR);
  const high = hexToRgb(ASCII_PARTICLE_HIGH_COLOR);

  return rgbToHex(
    lerp(low[0], high[0], amount),
    lerp(low[1], high[1], amount),
    lerp(low[2], high[2], amount),
  );
}

const particleColorPaletteCache = new Map<number, readonly string[]>();

function getCachedAsciiParticleColor(tone: number, depth: number): string {
  const cacheKey = Math.round(clamp(depth, 0, 3) * 100);
  let palette = particleColorPaletteCache.get(cacheKey);

  if (!palette) {
    palette = Array.from({ length: 64 }, (_value, index) =>
      getAsciiParticleColor(index / 63, cacheKey / 100),
    );
    particleColorPaletteCache.set(cacheKey, palette);
  }

  return palette[Math.round(clamp(tone, 0, 1) * 63)] ?? ASCII_PARTICLE_LOW_COLOR;
}

function getAsciiVisibleParticleTone(
  tone: number,
  threshold: number,
  strength: number,
): number {
  const visibleFloor = clamp(threshold - 0.34 / Math.max(0.05, strength), 0, 0.98);
  return clamp((tone - visibleFloor) / Math.max(0.02, 1 - visibleFloor), 0, 1);
}

function getAsciiMediaDepthTone(tone: number, depth: number): number {
  const shadowLiftAmount = clamp(depth, 0, 3) / 3;
  const shadowGamma = lerp(1, 0.24, shadowLiftAmount);
  return Math.pow(clamp(tone, 0, 1), shadowGamma);
}

function getGlyphForCell(
  particleType: AsciiParticleType,
  intensity: number,
  jitter: number,
  column: number,
  row: number,
): string {
  if (particleType === "dot") {
    return ".";
  }

  if (particleType === "hatch") {
    return (column + row + Math.floor(jitter * 4)) % 2 === 0 ? "/" : "\\";
  }

  if (particleType === "cross") {
    return "+";
  }

  return intensity > 0.62 || jitter > 0.72 ? "+" : ".";
}

export function getAsciiPatternSettings(state: ToolcraftState): AsciiPatternSettings {
  return {
    background: readColorHex(
      state.values["appearance.background"],
      fallbackSettings.background,
    ),
    density: clamp(readNumber(state.values["pattern.density"], fallbackSettings.density), 0, 100),
    ditherContrast: clamp(
      readNumber(state.values["dither.contrast"], fallbackSettings.ditherContrast),
      0,
      3,
    ),
    ditherStrength: clamp(
      readNumber(state.values["dither.strength"], fallbackSettings.ditherStrength),
      0.05,
      3,
    ),
    ditherThreshold: clamp(
      readNumber(state.values["dither.threshold"], fallbackSettings.ditherThreshold),
      0,
      1,
    ),
    imageFormat: readImageFormat(state.values["export.image.format"]),
    imageResolution: readString(
      state.values["export.image.resolution"],
      fallbackSettings.imageResolution,
    ),
    includeBackground: shouldIncludeToolcraftPreviewBackground({ state }),
    particleType: readParticleType(state.values["pattern.particleType"]),
    scale: clamp(readNumber(state.values["pattern.scale"], fallbackSettings.scale), 3, 48),
    spacing: clamp(readNumber(state.values["pattern.spacing"], fallbackSettings.spacing), -8, 48),
    speed: clamp(readNumber(state.values["motion.speed"], fallbackSettings.speed), 0, 4),
    videoDurationSeconds: readVideoDurationSeconds(state.values["export.video.duration"]),
    videoFormat: readVideoFormat(state.values["export.video.format"]),
    videoResolution: readString(
      state.values["export.video.resolution"],
      fallbackSettings.videoResolution,
    ),
    voids: clamp(readNumber(state.values["pattern.voids"], fallbackSettings.voids), 0, 5),
  };
}

export function getAsciiPatternRenderScale(state: ToolcraftState): number {
  return clamp(readNumber(state.values["canvas.renderScale"], 1), 1, 2);
}

export function getAsciiSourceSamplerSize({
  height,
  settings,
  width,
}: {
  height: number;
  settings: AsciiPatternSettings;
  width: number;
}): { sampleHeight: number; sampleWidth: number } {
  const gridStep = Math.max(3, settings.scale + settings.spacing);

  return {
    sampleHeight: Math.max(1, Math.ceil(height / gridStep) + 2),
    sampleWidth: Math.max(1, Math.ceil(width / gridStep) + 2),
  };
}

export function getAsciiPatternProgress(
  state: ToolcraftState,
  timeSeconds = state.timeline.currentTimeSeconds,
  durationSeconds = state.timeline.durationSeconds,
): number {
  return getToolcraftTimelineLoopProgress({
    currentTimeSeconds: timeSeconds,
    durationSeconds,
  });
}

type AsciiMediaGridCell = {
  column: number;
  edgeNoise: number;
  flickerOffset: number;
  gridX: number;
  gridY: number;
  mask: number;
  organicDetail: number;
  row: number;
  voidField: number;
  x: number;
  y: number;
};

const mediaGridCache = new Map<string, AsciiMediaGridCell[]>();
const mediaGridCacheLimit = 12;

function getAsciiMediaGrid({
  height,
  settings,
  width,
}: {
  height: number;
  settings: AsciiPatternSettings;
  width: number;
}): AsciiMediaGridCell[] {
  const gridStep = Math.max(3, settings.scale + settings.spacing);
  const key = [width, height, settings.scale, settings.spacing, settings.voids].join(":");

  const cachedCells = mediaGridCache.get(key);
  if (cachedCells) {
    mediaGridCache.delete(key);
    mediaGridCache.set(key, cachedCells);
    return cachedCells;
  }

  const columns = Math.ceil(width / gridStep) + 2;
  const rows = Math.ceil(height / gridStep) + 2;
  const cells: AsciiMediaGridCell[] = [];
  const voidThresholdShift = (settings.voids - 1) * 0.12;

  for (let row = -1; row < rows; row += 1) {
    for (let column = -1; column < columns; column += 1) {
      const x = column * gridStep + gridStep * 0.5;
      const y = row * gridStep + gridStep * 0.5;
      const gridX = x / gridStep;
      const gridY = y / gridStep;
      const warpX = Math.sin(gridY * 0.071 + Math.sin(gridX * 0.039) * 1.7) * 4.25;
      const warpY = Math.sin(gridX * 0.067 - Math.sin(gridY * 0.043) * 1.5) * 4.25;
      const organicX = (gridX + warpX) * 0.082;
      const organicY = (gridY + warpY) * 0.082;
      const organicVoid = clamp(
        0.5 +
          Math.sin(organicX * 1.13 + Math.sin(organicY * 0.79) * 1.45) * 0.23 +
          Math.sin(organicY * 1.57 - organicX * 0.61) * 0.17 +
          Math.sin((organicX + organicY) * 2.21) * 0.1,
        0,
        1,
      );
      const organicDetail = clamp(
        0.5 +
          Math.sin(organicX * 4.83 + organicY * 2.37 + 9.2) * 0.26 +
          Math.sin(organicY * 6.19 - organicX * 3.11 - 4.7) * 0.24,
        0,
        1,
      );
      const edgeNoise = clamp(
        0.5 + Math.sin(gridX * 0.91 + gridY * 1.37 + Math.sin(gridY * 0.17)) * 0.5,
        0,
        1,
      );
      const rawVoidField =
        organicVoid + (organicDetail - 0.5) * 0.28 + (edgeNoise - 0.5) * 0.2;
      const voidField = clamp(
        smoothstep(0.54 - voidThresholdShift, 0.82 - voidThresholdShift, rawVoidField) *
          settings.voids,
        0,
        1,
      );
      cells.push({
        column,
        edgeNoise,
        flickerOffset: hashNoise(column, row, 11) * Math.PI * 2,
        gridX,
        gridY,
        mask: hashNoise(column, row, 41),
        organicDetail,
        row,
        voidField,
        x,
        y,
      });
    }
  }

  if (mediaGridCache.size >= mediaGridCacheLimit) {
    const oldestKey = mediaGridCache.keys().next().value;
    if (oldestKey !== undefined) mediaGridCache.delete(oldestKey);
  }
  mediaGridCache.set(key, cells);
  return cells;
}

function createAsciiMediaPatternFrame({
  height,
  includeBackground,
  progress,
  settings,
  sourceSampler,
  width,
}: {
  height: number;
  includeBackground: boolean;
  progress: number;
  settings: AsciiPatternSettings;
  sourceSampler: AsciiSourceSampler;
  width: number;
}): AsciiPatternFrame {
  const glyphCell = Math.max(3, settings.scale);
  const phase = progress * Math.PI * 2;
  const density = settings.density / 100;
  const threshold = settings.ditherThreshold;
  const cutoffStrength = settings.ditherStrength;
  const travel = settings.speed * 8;
  const driftX = Math.cos(phase) * travel;
  const driftY = Math.sin(phase) * travel * 0.7;
  const baseSize = glyphCell * (settings.particleType === "dot" ? 0.72 : 0.9);
  const glyphs: AsciiGlyph[] = [];

  for (const cell of getAsciiMediaGrid({ height, settings, width })) {
    const gridX = cell.gridX + driftX;
    const gridY = cell.gridY + driftY;
    const nx = gridX * 0.066;
    const ny = gridY * 0.066;
    const sweep = (Math.sin(nx * 7.8 + ny * 4.2 + phase) + 1) * 0.5;
    const sourceTone = sampleAsciiSourceLuminance(sourceSampler, cell.x, cell.y);
    const sourceDepthTone = getAsciiMediaDepthTone(sourceTone, settings.ditherContrast);
    const sourceEnvelope =
      sourceDepthTone * (1 - cell.voidField * 0.72) +
      (cell.organicDetail - 0.5) * 0.08 +
      (cell.edgeNoise - 0.5) * 0.06 +
      (sweep - 0.5) * 0.04;
    const normalized = clamp(sourceEnvelope, 0, 1);
    const intensity = smoothstep(
      threshold - 0.34 / cutoffStrength,
      threshold + 0.34 / cutoffStrength,
      normalized,
    );
    const organicMask = clamp(
      cell.mask * (0.78 + cell.voidField * 0.5) + cell.voidField * 0.14,
      0,
      1,
    );
    const flicker = 0.82 + 0.18 * Math.sin(phase + cell.flickerOffset);
    const visibility = intensity * density * flicker;

    if (visibility <= organicMask * 0.95) {
      continue;
    }

    const particleTone = getAsciiVisibleParticleTone(
      sourceDepthTone,
      threshold,
      cutoffStrength,
    );

    glyphs.push({
      char: getGlyphForCell(
        settings.particleType,
        intensity,
        cell.mask,
        cell.column,
        cell.row,
      ),
      color: getCachedAsciiParticleColor(particleTone, settings.ditherContrast),
      size: baseSize,
      thickness: Math.max(1, baseSize * 0.14),
      x: cell.x,
      y: cell.y,
    });
  }

  return {
    background: settings.background,
    glyphs,
    height,
    includeBackground,
    width,
  };
}

function createAsciiProceduralPatternFrame({
  height,
  includeBackground,
  progress,
  settings,
  width,
}: {
  height: number;
  includeBackground: boolean;
  progress: number;
  settings: AsciiPatternSettings;
  width: number;
}): AsciiPatternFrame {
  const glyphCell = Math.max(3, settings.scale);
  const phase = progress * Math.PI * 2;
  const density = settings.density / 100;
  const threshold = settings.ditherThreshold;
  const cutoffStrength = settings.ditherStrength;
  const travel = settings.speed * 8;
  const driftX = Math.cos(phase) * travel;
  const driftY = Math.sin(phase) * travel * 0.7;
  const baseSize = glyphCell * (settings.particleType === "dot" ? 0.72 : 0.9);
  const glyphs: AsciiGlyph[] = [];

  for (const cell of getAsciiMediaGrid({ height, settings, width })) {
    const gridX = cell.gridX + driftX;
    const gridY = cell.gridY + driftY;
    const nx = gridX * 0.066;
    const ny = gridY * 0.066;
    const sweep = (Math.sin(nx * 7.8 + ny * 4.2 + phase) + 1) * 0.5;
    const counterSweep = (Math.sin(nx * -4.4 + ny * 8.6 + phase * 0.7) + 1) * 0.5;
    const band =
      (Math.sin((cell.column - cell.row) * 0.035 + phase * 1.4) + 1) * 0.5;
    const normalized = clamp(
      0.34 * (1 - cell.voidField) +
        0.2 * cell.organicDetail +
        0.18 * cell.edgeNoise +
        0.15 * sweep +
        0.09 * counterSweep +
        0.04 * band,
      0,
      1,
    );
    const intensity = smoothstep(
      threshold - 0.34 / cutoffStrength,
      threshold + 0.34 / cutoffStrength,
      normalized,
    );
    const organicMask = clamp(
      cell.mask * (0.78 + cell.voidField * 0.5) + cell.voidField * 0.14,
      0,
      1,
    );
    const flicker = 0.82 + 0.18 * Math.sin(phase + cell.flickerOffset);

    if (intensity * density * flicker <= organicMask * 0.95) {
      continue;
    }

    const particleTone = getAsciiVisibleParticleTone(
      normalized,
      threshold,
      cutoffStrength,
    );

    glyphs.push({
      char: getGlyphForCell(
        settings.particleType,
        intensity,
        cell.mask,
        cell.column,
        cell.row,
      ),
      color: getCachedAsciiParticleColor(particleTone, settings.ditherContrast),
      size: baseSize,
      thickness: Math.max(1, baseSize * 0.14),
      x: cell.x,
      y: cell.y,
    });
  }

  return {
    background: settings.background,
    glyphs,
    height,
    includeBackground,
    width,
  };
}

export function createAsciiPatternFrame({
  height,
  includeBackground,
  progress,
  settings,
  sourceSampler,
  width,
}: {
  height: number;
  includeBackground: boolean;
  progress: number;
  settings: AsciiPatternSettings;
  sourceSampler?: AsciiSourceSampler;
  width: number;
}): AsciiPatternFrame {
  if (sourceSampler) {
    return createAsciiMediaPatternFrame({
      height,
      includeBackground,
      progress,
      settings,
      sourceSampler,
      width,
    });
  }

  return createAsciiProceduralPatternFrame({
    height,
    includeBackground,
    progress,
    settings,
    width,
  });
}

export function drawAsciiPatternFrame(
  context: CanvasRenderingContext2D,
  frame: AsciiPatternFrame,
): void {
  context.save();
  context.clearRect(0, 0, frame.width, frame.height);

  if (frame.includeBackground) {
    context.fillStyle = frame.background;
    context.fillRect(0, 0, frame.width, frame.height);
  }

  const glyphsByColor = new Map<string, AsciiGlyph[]>();
  for (const glyph of frame.glyphs) {
    const colorGlyphs = glyphsByColor.get(glyph.color);
    if (colorGlyphs) colorGlyphs.push(glyph);
    else glyphsByColor.set(glyph.color, [glyph]);
  }

  for (const [color, colorGlyphs] of glyphsByColor) {
    context.beginPath();
    for (const glyph of colorGlyphs) {
      if (glyph.char === "+") {
        const length = glyph.size * 0.58;
        const thickness = glyph.thickness;
        context.rect(glyph.x - length / 2, glyph.y - thickness / 2, length, thickness);
        context.rect(glyph.x - thickness / 2, glyph.y - length / 2, thickness, length);
        continue;
      }

      if (glyph.char === "/" || glyph.char === "\\") {
        const markSize = Math.max(1, glyph.size * 0.18);
        const halfMark = markSize / 2;
        const offset = glyph.size * 0.28;
        const direction = glyph.char === "/" ? -1 : 1;
        context.rect(
          glyph.x - offset - halfMark,
          glyph.y - direction * offset - halfMark,
          markSize,
          markSize,
        );
        context.rect(glyph.x - halfMark, glyph.y - halfMark, markSize, markSize);
        context.rect(
          glyph.x + offset - halfMark,
          glyph.y + direction * offset - halfMark,
          markSize,
          markSize,
        );
        continue;
      }

      const dotSize = Math.max(1, glyph.size * 0.2);
      context.rect(glyph.x - dotSize / 2, glyph.y - dotSize / 2, dotSize, dotSize);
    }
    context.fillStyle = color;
    context.fill();
  }

  context.restore();
}

export function drawAsciiPattern(
  context: CanvasRenderingContext2D,
  options: {
    height: number;
    includeBackground: boolean;
    progress: number;
    settings: AsciiPatternSettings;
    sourceSampler?: AsciiSourceSampler;
    width: number;
  },
): AsciiPatternFrame {
  const frame = createAsciiPatternFrame(options);
  drawAsciiPatternFrame(context, frame);
  return frame;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createAsciiPatternSvg(frame: AsciiPatternFrame): string {
  const background = frame.includeBackground
    ? `<rect width="100%" height="100%" fill="${escapeXml(frame.background)}" />`
    : "";
  const glyphs = frame.glyphs
    .map((glyph) => {
      const color = escapeXml(glyph.color);
      const particleAttributes = `data-particle-color="${color}" data-glyph-size="${glyph.size.toFixed(2)}"`;

      if (glyph.char === "+") {
        const length = glyph.size * 0.58;
        const thickness = glyph.thickness;
        return `<g ${particleAttributes} data-stroke-width="${thickness.toFixed(2)}" fill="${color}"><rect x="${(glyph.x - length / 2).toFixed(2)}" y="${(glyph.y - thickness / 2).toFixed(2)}" width="${length.toFixed(2)}" height="${thickness.toFixed(2)}" /><rect x="${(glyph.x - thickness / 2).toFixed(2)}" y="${(glyph.y - length / 2).toFixed(2)}" width="${thickness.toFixed(2)}" height="${length.toFixed(2)}" /></g>`;
      }

      return `<text ${particleAttributes} x="${glyph.x.toFixed(2)}" y="${glyph.y.toFixed(2)}" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="${glyph.size.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" fill="${color}">${escapeXml(glyph.char)}</text>`;
    })
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.width}" height="${frame.height}" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="Generated ASCII dither pattern">`,
    background,
    glyphs,
    "</svg>",
  ].join("");
}

export function shouldIncludeAsciiVideoBackground(state: ToolcraftState): boolean {
  return shouldIncludeToolcraftExportBackground({
    format: "video",
    schema: state.schema,
  });
}
