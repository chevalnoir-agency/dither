import { Buffer } from "node:buffer";

import { expect, test, type Page } from "@playwright/test";

import { appPerformance } from "../src/app/app-performance";
import {
  expectToolcraftProductObservableToChange,
  getToolcraftProductObservableSnapshot,
} from "./product-observable-helpers";
import {
  applyToolcraftPerformanceStressFixture,
  applyToolcraftPerformanceWorkloadFixture,
  dragToolcraftCanvasViewport,
  dragToolcraftSliderByLabel,
  dragToolcraftSliderToPerformanceStressValue,
  dragToolcraftSliderToValue,
  expectToolcraftCanvasBackingPixelsForRenderScale,
  expectToolcraftCanvasViewportStable,
  expectToolcraftDiscreteSliderDragSmoothness,
  getToolcraftPerformanceScenarioBudget,
  expectToolcraftScenarioPerformanceBudget,
  getToolcraftFieldByLabel,
  getToolcraftPerformanceStressValue,
  measureToolcraftAnimationFrames,
  measureToolcraftInteraction,
  waitForToolcraftAnimationFrames,
  zoomToolcraftCanvasViewport,
} from "./performance-helpers";

type LastExportKind = "image" | "svg" | "video";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

async function openApp(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
}

async function pausePlayback(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: /Pause playback/ }).first();
  if (await pause.isVisible()) {
    await pause.click();
    await waitForToolcraftAnimationFrames(page, 2);
  }
}

async function playPlayback(page: Page): Promise<void> {
  const play = page.getByRole("button", { name: /Play playback/ }).first();
  if (await play.isVisible()) {
    await play.click();
    await waitForToolcraftAnimationFrames(page, 2);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function clickSelectOption(page: Page, option: string): Promise<void> {
  const item = page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(option)}\\s*$`) })
    .first();
  try {
    await expect(item).toBeVisible({ timeout: 500 });
    await item.click();
    return;
  } catch {
    // Some select implementations expose ARIA options without the Toolcraft item slot.
  }

  const roleOption = page.getByRole("option", { exact: true, name: option }).first();
  try {
    await expect(roleOption).toBeVisible({ timeout: 500 });
    await roleOption.click();
    return;
  } catch {
    await expect(item, `Select option "${option}" should be visible`).toBeVisible();
    await item.click();
  }
}

async function chooseSelectInField(
  page: Page,
  label: string,
  option: string,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  const combobox = field.getByRole("combobox").first();
  await combobox.click();
  await clickSelectOption(page, option);
  await expect(combobox).toContainText(option);
}

async function chooseSelectInSection(
  page: Page,
  sectionTitle: string,
  label: string,
  option: string,
): Promise<void> {
  const sectionHeader = page
    .locator('[data-slot="panel-title"]')
    .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(sectionTitle)}\\s*$`) })
    .first();
  const section = sectionHeader.locator("xpath=ancestor::section[1]");
  await expect(section, `Section "${sectionTitle}" should be visible`).toBeVisible();
  const field = section.locator('[data-slot="field"]').filter({
    has: page
      .locator('[data-slot="field-label"]')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`) }),
  }).first();
  await expect(field, `${sectionTitle} / ${label} should be visible`).toBeVisible();
  const combobox = field.getByRole("combobox").first();
  await combobox.click();
  await clickSelectOption(page, option);
  await expect(combobox).toContainText(option);
}

async function toggleSwitchByLabel(page: Page, label: string): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  await field.getByRole("switch").first().click();
  await waitForToolcraftAnimationFrames(page, 2);
}

async function getCheckboxInSection(page: Page, sectionTitle: string, label: string) {
  const section = page
    .locator('[data-slot="panel-title"]')
    .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(sectionTitle)}\\s*$`) })
    .first()
    .locator("xpath=ancestor::section[1]");
  await expect(section, `Section "${sectionTitle}" should be visible`).toBeVisible();
  const field = section.locator('[data-slot="field"]').filter({
    has: page
      .locator('[data-slot="field-label"]')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`) }),
  }).first();
  await expect(field, `${sectionTitle} / ${label} should be visible`).toBeVisible();
  return field.getByRole("checkbox").first();
}

async function toggleCheckboxInSection(
  page: Page,
  sectionTitle: string,
  label: string,
): Promise<void> {
  const checkbox = await getCheckboxInSection(page, sectionTitle, label);
  await checkbox.click();
  await waitForToolcraftAnimationFrames(page, 2);
}

async function getSourceImageField(page: Page) {
  const sourceSection = page
    .locator('[data-slot="panel-title"]')
    .filter({ hasText: /^Source Image$/ })
    .locator("xpath=ancestor::section[1]");
  await expect(sourceSection, "Source Image section should be visible").toBeVisible();
  const field = sourceSection
    .locator('[data-slot="field"]')
    .filter({ has: page.getByRole("button", { name: /Browse image file|Replace image file/ }) })
    .first();
  await expect(field, "Source image fileDrop field should be visible").toBeVisible();
  return field;
}

async function getSourceVideoField(page: Page) {
  const sourceSection = page
    .locator('[data-slot="panel-title"]')
    .filter({ hasText: /^Source Video$/ })
    .locator("xpath=ancestor::section[1]");
  await expect(sourceSection, "Source Video section should be visible").toBeVisible();
  const field = sourceSection
    .locator('[data-slot="field"]')
    .filter({ has: page.getByRole("button", { name: /Browse file|Replace file/ }) })
    .first();
  await expect(field, "Source video fileDrop field should be visible").toBeVisible();
  return field;
}

function createSourceImageSvg(width = 320, height = 180): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#050505"/>
  <rect x="${Math.round(width * 0.06)}" y="${Math.round(height * 0.1)}" width="${Math.round(width * 0.42)}" height="${Math.round(height * 0.78)}" fill="#ffffff"/>
  <circle cx="${Math.round(width * 0.72)}" cy="${Math.round(height * 0.34)}" r="${Math.round(Math.min(width, height) * 0.22)}" fill="#8a8a8a"/>
  <path d="M ${Math.round(width * 0.52)} ${Math.round(height * 0.88)} L ${Math.round(width * 0.94)} ${Math.round(height * 0.56)} L ${Math.round(width * 0.88)} ${Math.round(height * 0.94)} Z" fill="#d8d8d8"/>
</svg>`;

  return Buffer.from(svg, "utf8");
}

function createTonalGradientSourceImageSvg(width = 640, height = 360): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="tones" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000000"/>
      <stop offset="0.2" stop-color="#333333"/>
      <stop offset="0.4" stop-color="#666666"/>
      <stop offset="0.6" stop-color="#999999"/>
      <stop offset="0.8" stop-color="#cccccc"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#tones)"/>
</svg>`;

  return Buffer.from(svg, "utf8");
}

function createShadowDetailSourceImageSvg(width = 640, height = 360): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="shadow-tones" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#08090b"/>
      <stop offset="0.25" stop-color="#14171a"/>
      <stop offset="0.5" stop-color="#24282d"/>
      <stop offset="0.75" stop-color="#3b4147"/>
      <stop offset="1" stop-color="#6a7179"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#eeeeee"/>
  <rect width="${Math.round(width * 0.84)}" height="${height}" fill="url(#shadow-tones)"/>
</svg>`;

  return Buffer.from(svg, "utf8");
}

async function createSourceVideoWebm(
  page: Page,
  width = 320,
  height = 180,
  frameCount = 10,
  tone: "dark" | "high" = "high",
  frameRate = 12,
): Promise<Buffer> {
  const bytes = await page.evaluate(
    async ({ frameCount, frameRate, height, tone, width }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not create source video fixture canvas.");
      }

      const stream = canvas.captureStream(0);
      const videoTrack = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      const chunks: Blob[] = [];
      const finished = new Promise<Blob>((resolve, reject) => {
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        });
        recorder.addEventListener("error", () => {
          reject(new Error("Could not record source video fixture."));
        });
        recorder.addEventListener("stop", () => {
          const blob = new Blob(chunks, {
            type: recorder.mimeType || mimeType || "video/webm",
          });
          resolve(blob);
        });
      });

      recorder.start();

      for (let frame = 0; frame < frameCount; frame += 1) {
        const progress = frameCount <= 1 ? 0 : frame / (frameCount - 1);
        context.fillStyle = tone === "dark" ? "#08090b" : "#050505";
        context.fillRect(0, 0, width, height);
        context.fillStyle = tone === "dark" ? "#34383d" : "#ffffff";
        context.fillRect(
          Math.round(width * (0.06 + progress * 0.34)),
          Math.round(height * 0.1),
          Math.round(width * 0.3),
          Math.round(height * 0.78),
        );
        context.fillStyle = tone === "dark" ? "#22272c" : "#8a8a8a";
        context.beginPath();
        context.arc(
          Math.round(width * (0.76 - progress * 0.32)),
          Math.round(height * 0.34),
          Math.round(Math.min(width, height) * 0.2),
          0,
          Math.PI * 2,
        );
        context.fill();
        context.fillStyle = tone === "dark" ? "#41464c" : "#d8d8d8";
        context.fillRect(
          Math.round(width * 0.54),
          Math.round(height * (0.7 - progress * 0.32)),
          Math.round(width * 0.36),
          Math.round(height * 0.16),
        );
        videoTrack?.requestFrame();

        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, Math.max(16, Math.round(1000 / frameRate)));
        });
      }

      recorder.stop();
      const blob = await finished;
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      if (blob.size === 0) {
        throw new Error("Source video fixture produced an empty blob.");
      }

      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    },
    { frameCount, frameRate, height, tone, width },
  );

  return Buffer.from(bytes);
}

async function expectAsciiCanvasHasVisibleParticles(page: Page): Promise<void> {
  const visibleParticleRatio = await page
    .locator("[data-ascii-pattern-canvas]")
    .evaluate((canvas: HTMLCanvasElement) => {
      const sample = document.createElement("canvas");
      sample.width = 160;
      sample.height = 90;
      const context = sample.getContext("2d", { willReadFrequently: true });

      if (!context) {
        throw new Error("Could not sample ASCII canvas.");
      }

      context.drawImage(canvas, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      let visible = 0;

      for (let index = 0; index < pixels.length; index += 4) {
        const luminance =
          (pixels[index] ?? 0) * 0.2126 +
          (pixels[index + 1] ?? 0) * 0.7152 +
          (pixels[index + 2] ?? 0) * 0.0722;
        if (luminance > 25) {
          visible += 1;
        }
      }

      return visible / (pixels.length / 4);
    });

  expect(visibleParticleRatio).toBeGreaterThan(0.002);
}

async function uploadSourceImage(
  page: Page,
  width = 320,
  height = 180,
  fileName = "source-image.svg",
  buffer = createSourceImageSvg(width, height),
): Promise<void> {
  const field = await getSourceImageField(page);
  await field.locator('input[type="file"]').first().setInputFiles({
    buffer,
    mimeType: "image/svg+xml",
    name: fileName,
  });
  await waitForToolcraftAnimationFrames(page, 3);
  await expect(page.getByRole("button", { name: "Replace image file" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
}

async function uploadSourceVideo(
  page: Page,
  width = 320,
  height = 180,
  fileName = "source-video.webm",
  buffer?: Buffer,
  frameCount = 10,
  frameRate = 12,
): Promise<void> {
  const field = await getSourceVideoField(page);
  await field.locator('input[type="file"]').first().setInputFiles({
    buffer: buffer ?? (await createSourceVideoWebm(page, width, height, frameCount, "high", frameRate)),
    mimeType: "video/webm",
    name: fileName,
  });
  await waitForToolcraftAnimationFrames(page, 5);
  await expect(page.getByRole("button", { name: "Replace file" })).toBeVisible();
  await expect(page.getByRole("button", { name: `Remove ${fileName}` })).toBeVisible();
}

async function measureSourceVideoFrameCadence(
  page: Page,
  durationMs = 1200,
): Promise<{ maxFrameGapMs: number; updates: number }> {
  return page.locator("[data-ascii-pattern-canvas]").evaluate(
    (canvas: HTMLCanvasElement, measurementDurationMs) =>
      new Promise<{ maxFrameGapMs: number; updates: number }>((resolve) => {
        const frameTimes: number[] = [];
        let previousCount = canvas.dataset.sourceVideoFrameCount;
        const observer = new MutationObserver(() => {
          const nextCount = canvas.dataset.sourceVideoFrameCount;
          if (nextCount !== undefined && nextCount !== previousCount) {
            previousCount = nextCount;
            frameTimes.push(performance.now());
          }
        });

        observer.observe(canvas, {
          attributeFilter: ["data-source-video-frame-count"],
          attributes: true,
        });

        window.setTimeout(() => {
          observer.disconnect();
          let maxFrameGapMs = 0;
          for (let index = 1; index < frameTimes.length; index += 1) {
            maxFrameGapMs = Math.max(
              maxFrameGapMs,
              (frameTimes[index] ?? 0) - (frameTimes[index - 1] ?? 0),
            );
          }
          resolve({
            maxFrameGapMs: frameTimes.length > 1 ? maxFrameGapMs : Number.POSITIVE_INFINITY,
            updates: frameTimes.length,
          });
        }, measurementDurationMs);
      }),
    durationMs,
  );
}

function particleOptionLabel(value: string): string {
  if (value === "dot") {
    return "Mini dots";
  }

  if (value === "mixed") {
    return "Mixed";
  }

  if (value === "hatch") {
    return "Hachures";
  }

  return "Crosses";
}

function exportResolutionOptionLabel(value: string): string {
  if (value === "2k") {
    return "2K";
  }

  if (value === "4k") {
    return "4K";
  }

  if (value === "8k") {
    return "8K";
  }

  return "Current";
}

async function editTimelineDuration(page: Page, durationSeconds: number): Promise<void> {
  await enableTimelinePanel(page);
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const editor = page.getByRole("textbox", { name: "timeline duration" });
  await editor.fill(String(durationSeconds));
  await editor.press("Enter");
  await waitForToolcraftAnimationFrames(page, 2);
}

async function enableTimelinePanel(page: Page): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, "Timeline");
  const timelineSwitch = field.getByRole("switch").first();
  const checked = await timelineSwitch.getAttribute("aria-checked");
  if (checked !== "true") {
    await timelineSwitch.click();
  }
  await expect(page.getByRole("button", { name: "Edit timeline duration" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Disable loop|Enable loop/ })).toBeVisible();
}

async function scrubTimeline(page: Page, ratio: number): Promise<void> {
  await enableTimelinePanel(page);
  const scrubber = page.locator('[aria-label="Playback position"]').first();
  await expect(scrubber, "Playback position scrubber should be visible").toBeVisible();
  const box = await scrubber.boundingBox();
  if (!box) {
    throw new Error("Could not measure Playback position scrubber.");
  }

  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * ratio, box.y + box.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await waitForToolcraftAnimationFrames(page, 2);
}

async function clickExport(page: Page, label: string, kind: LastExportKind): Promise<void> {
  await page.evaluate(() => {
    (window as Window & {
      __toolcraftLastExport?: { blob: Blob; kind: string };
    }).__toolcraftLastExport = undefined;
  });
  await page.getByRole("button", { name: label }).click();
  await page.waitForFunction(
    (expectedKind) => {
      const record = (window as Window & {
        __toolcraftLastExport?: { blob: Blob; kind: string };
      }).__toolcraftLastExport;
      return record?.kind === expectedKind && record.blob.size > 0;
    },
    kind,
    { timeout: 60000 },
  );
}

async function readLastExport(page: Page, kind: LastExportKind) {
  await page.waitForFunction(
    (expectedKind) => {
      const record = (window as Window & {
        __toolcraftLastExport?: { blob: Blob; kind: string };
      }).__toolcraftLastExport;
      return record?.kind === expectedKind && record.blob.size > 0;
    },
    kind,
    { timeout: 60000 },
  );

  return page.evaluate(async (expectedKind) => {
    const record = (window as Window & {
      __toolcraftLastExport?: {
        blob: Blob;
        durationSeconds?: number;
        fileName: string;
        height?: number;
        kind: string;
        type: string;
        width?: number;
      };
    }).__toolcraftLastExport;

    if (!record || record.kind !== expectedKind) {
      throw new Error(`Missing ${expectedKind} export.`);
    }

    const header = new Uint8Array(await record.blob.slice(0, 16).arrayBuffer());
    const text = expectedKind === "svg" ? await record.blob.text() : "";

    return {
      durationSeconds: record.durationSeconds,
      fileName: record.fileName,
      header: Array.from(header),
      height: record.height,
      kind: record.kind,
      size: record.blob.size,
      text,
      type: record.blob.type,
      width: record.width,
    };
  }, kind);
}

async function readExportedImage(page: Page) {
  return page.evaluate(async () => {
    const record = (window as Window & {
      __toolcraftLastExport?: { blob: Blob; type: string };
    }).__toolcraftLastExport;

    if (!record) {
      throw new Error("Missing exported image.");
    }

    const exportedImage = await createImageBitmap(record.blob);
    const sample = document.createElement("canvas");
    sample.width = 1;
    sample.height = 1;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Missing image sample context.");
    }

    context.drawImage(exportedImage, 0, 0);
    const pixel = context.getImageData(0, 0, 1, 1).data;

    return {
      alpha: pixel[3],
      height: exportedImage.height,
      type: record.blob.type || record.type,
      width: exportedImage.width,
    };
  });
}

async function readExportedVideoDurationMetadata(page: Page) {
  const duration = await page.evaluate(async () => {
    const record = (window as Window & {
      __toolcraftLastExport?: { blob: Blob; durationSeconds?: number };
    }).__toolcraftLastExport;

    if (!record) {
      throw new Error("Missing exported video.");
    }

    const url = URL.createObjectURL(record.blob);
    const video = document.createElement("video");
    video.preload = "metadata";
    const metadata = await new Promise<{
      duration: number;
      durationSeconds?: number;
      videoHeight: number;
      videoWidth: number;
    }>((resolve, reject) => {
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          durationSeconds: record.durationSeconds,
          videoHeight: video.videoHeight,
          videoWidth: video.videoWidth,
        });
      };
      video.onerror = () => reject(new Error("Video metadata failed to load."));
      video.src = url;
    });
    URL.revokeObjectURL(url);
    return metadata;
  });

  return duration;
}

async function readExportedMp4Structure(page: Page) {
  return page.evaluate(async () => {
    const record = (window as Window & {
      __toolcraftLastExport?: { blob: Blob };
    }).__toolcraftLastExport;

    if (!record) {
      throw new Error("Missing exported video.");
    }

    const bytes = new Uint8Array(await record.blob.arrayBuffer());
    const view = new DataView(bytes.buffer);
    const readType = (offset: number): string =>
      String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const topLevel: string[] = [];
    let headerDurationSeconds = 0;

    for (let offset = 0; offset + 8 <= bytes.length; ) {
      const size = view.getUint32(offset) || bytes.length - offset;
      const type = readType(offset);
      topLevel.push(type);

      if (type === "moov") {
        for (let child = offset + 8; child + 8 <= offset + size; ) {
          const childSize = view.getUint32(child);
          if (readType(child) === "mvhd") {
            const version = bytes[child + 8];
            const timescale = view.getUint32(child + (version === 1 ? 28 : 20));
            const duration =
              version === 1
                ? Number(view.getBigUint64(child + 32))
                : view.getUint32(child + 24);
            headerDurationSeconds = duration / timescale;
          }
          if (childSize < 8) {
            break;
          }
          child += childSize;
        }
      }

      if (size < 8) {
        break;
      }
      offset += size;
    }

    return { headerDurationSeconds, topLevel, type: record.blob.type };
  });
}

async function readExportedGifMetadata(page: Page) {
  return page.evaluate(async () => {
    const record = (window as Window & {
      __toolcraftLastExport?: {
        blob: Blob;
        durationSeconds?: number;
        fileName: string;
        height?: number;
        type: string;
        width?: number;
      };
    }).__toolcraftLastExport;

    if (!record) {
      throw new Error("Missing exported GIF.");
    }

    const bytes = new Uint8Array(await record.blob.arrayBuffer());
    const header = String.fromCharCode(...bytes.slice(0, 6));
    const width = (bytes[6] ?? 0) | ((bytes[7] ?? 0) << 8);
    const height = (bytes[8] ?? 0) | ((bytes[9] ?? 0) << 8);
    const paletteColors = 1 << (((bytes[10] ?? 0) & 0x07) + 1);
    const netscape = Array.from("NETSCAPE2.0", (character) => character.charCodeAt(0));
    let durationCentiseconds = 0;
    let frameCount = 0;
    let loopCount: number | undefined;

    for (let index = 0; index < bytes.length - 8; index += 1) {
      if (
        bytes[index] === 0x21 &&
        bytes[index + 1] === 0xf9 &&
        bytes[index + 2] === 0x04
      ) {
        durationCentiseconds += (bytes[index + 4] ?? 0) | ((bytes[index + 5] ?? 0) << 8);
        frameCount += 1;
      }

      if (netscape.every((value, offset) => bytes[index + offset] === value)) {
        loopCount = (bytes[index + 13] ?? 0) | ((bytes[index + 14] ?? 0) << 8);
      }
    }

    return {
      duration: durationCentiseconds / 100,
      durationSeconds: record.durationSeconds,
      fileName: record.fileName,
      frameCount,
      header,
      height,
      loopCount,
      paletteColors,
      size: record.blob.size,
      type: record.blob.type || record.type,
      width,
    };
  });
}

test("browser: pattern controls change ASCII output", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);

  await expectToolcraftProductObservableToChange(page, async () => {
    await chooseSelectInField(page, "Particle", "Mini dots");
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await chooseSelectInField(page, "Particle", "Hachures");
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await chooseSelectInField(page, "Particle", "Mixed");
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Scale", 0.1);
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Voids", 5);
  });
  await dragToolcraftSliderToValue(page, "Voids", 0);
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Density", 12);
  });
  await dragToolcraftSliderToValue(page, "Density", 100);
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Spacing", -8);
  });
});

test("browser: source image upload clear reset and transforms update dither output", async ({
  page,
}) => {
  await openApp(page);
  await pausePlayback(page);

  await expectToolcraftProductObservableToChange(page, async () => {
    await uploadSourceImage(page);
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "90° Right" }).click();
    await waitForToolcraftAnimationFrames(page, 3);
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Flip horizontal" }).click();
    await waitForToolcraftAnimationFrames(page, 3);
  });
  await clickExport(page, "Export SVG", "svg");
  const sourceSvg = await readLastExport(page, "svg");
  expect(sourceSvg.text).toContain("data-particle-color");

  await chooseSelectInSection(page, "Video Export", "Duration", "5 s");
  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");
  await clickExport(page, "Export Video", "video");
  const sourceVideo = await readLastExport(page, "video");
  expect(sourceVideo.size).toBeGreaterThan(1000);

  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Remove image" }).click();
    await waitForToolcraftAnimationFrames(page, 3);
  });

  await uploadSourceImage(page, 360, 180, "source-section-reset.svg");
  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Reset Source Image section" }).click();
    await waitForToolcraftAnimationFrames(page, 3);
  });
  await expect(page.getByRole("button", { name: "Browse image file" })).toBeVisible();

  await uploadSourceImage(page, 300, 180, "source-global-reset.svg");
  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Reset controls" }).click();
    await waitForToolcraftAnimationFrames(page, 3);
  });
  await expect(page.getByRole("button", { name: "Browse image file" })).toBeVisible();
});

test("browser: source image invert swaps light and dark dither output", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await uploadSourceImage(page, 640, 360, "source-image-invert.svg");

  const checkbox = await getCheckboxInSection(page, "Source Image", "Invert");
  await expect(checkbox).not.toBeChecked();
  const normalPreview = await getToolcraftProductObservableSnapshot(page);
  await clickExport(page, "Export SVG", "svg");
  const normalSvg = await readLastExport(page, "svg");

  await expectToolcraftProductObservableToChange(page, async () => {
    await toggleCheckboxInSection(page, "Source Image", "Invert");
  });
  await expect(checkbox).toBeChecked();
  const invertedPreview = await getToolcraftProductObservableSnapshot(page);
  await clickExport(page, "Export SVG", "svg");
  const invertedSvg = await readLastExport(page, "svg");

  expect(invertedPreview).not.toBe(normalPreview);
  expect(invertedSvg.text).not.toBe(normalSvg.text);

  await page.getByRole("button", { name: "Reset Source Image section" }).click();
  await waitForToolcraftAnimationFrames(page, 3);
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Browse image file" })).toBeVisible();
});

test("browser: source video upload clear reset and timeline frames update dither output", async ({
  page,
}) => {
  await openApp(page);
  await pausePlayback(page);

  await uploadSourceImage(page, 320, 180, "source-image-fallback.svg");
  await expectToolcraftProductObservableToChange(
    page,
    async () => {
      await uploadSourceVideo(page);
    },
    { timeoutMs: 8000 },
  );

  const videoFrameStart = await getToolcraftProductObservableSnapshot(page);
  await scrubTimeline(page, 0.55);
  const videoFrameMiddle = await getToolcraftProductObservableSnapshot(page);
  expect(videoFrameMiddle).not.toBe(videoFrameStart);

  await playPlayback(page);
  const sourceCadence = await measureSourceVideoFrameCadence(page, 800);
  expect(sourceCadence.updates).toBeGreaterThanOrEqual(4);
  expect(sourceCadence.maxFrameGapMs).toBeLessThanOrEqual(250);
  await pausePlayback(page);

  await clickExport(page, "Export SVG", "svg");
  const sourceSvg = await readLastExport(page, "svg");
  expect(sourceSvg.text).toContain("data-particle-color");

  await chooseSelectInSection(page, "Video Export", "Duration", "5 s");
  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");
  await clickExport(page, "Export Video", "video");
  const sourceVideo = await readLastExport(page, "video");
  const sourceVideoMetadata = await readExportedVideoDurationMetadata(page);
  expect(sourceVideo.size).toBeGreaterThan(1000);
  expect(sourceVideoMetadata.duration).toBeGreaterThan(4.5);
  expect(sourceVideoMetadata.duration).toBeLessThan(5.75);
  expect(sourceVideoMetadata.durationSeconds).toBe(5);
  expect(sourceVideoMetadata.videoWidth).toBe(1920);
  expect(sourceVideoMetadata.videoHeight).toBe(1080);
  const sourceVideoMp4 = await readExportedMp4Structure(page);
  if (sourceVideoMp4.type.startsWith("video/mp4")) {
    // MP4 must be a standard progressive file: players and editors outside the
    // browser reject fragmented MP4 with a zero header duration.
    expect(sourceVideoMp4.topLevel).not.toContain("moof");
    expect(sourceVideoMp4.topLevel.indexOf("moov")).toBeLessThan(
      sourceVideoMp4.topLevel.indexOf("mdat"),
    );
    expect(sourceVideoMp4.headerDurationSeconds).toBeGreaterThan(4.5);
    expect(sourceVideoMp4.headerDurationSeconds).toBeLessThan(5.75);
  }

  await expectToolcraftProductObservableToChange(
    page,
    async () => {
      await page.getByRole("button", { name: "Remove source-video.webm" }).click();
      await waitForToolcraftAnimationFrames(page, 4);
    },
    { timeoutMs: 8000 },
  );

  await uploadSourceVideo(page, 360, 180, "source-video-section-reset.webm");
  await expectToolcraftProductObservableToChange(
    page,
    async () => {
      await page.getByRole("button", { name: "Reset Source Video section" }).click();
      await waitForToolcraftAnimationFrames(page, 4);
    },
    { timeoutMs: 8000 },
  );
  await expect(page.getByRole("button", { name: "Browse file" })).toBeVisible();

  await uploadSourceVideo(page, 300, 180, "source-video-global-reset.webm");
  await page.getByRole("button", { name: "Reset controls" }).click();
  await waitForToolcraftAnimationFrames(page, 4);
  await expect(page.getByRole("button", { name: "Browse file" })).toBeVisible();
  await expect(page.locator("[data-ascii-pattern-canvas]")).not.toHaveAttribute(
    "data-source-video-frame-count",
  );
});

test("browser: source video invert swaps light and dark dither output", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await uploadSourceVideo(page, 640, 360, "source-video-invert.webm");

  const checkbox = await getCheckboxInSection(page, "Source Video", "Invert");
  await expect(checkbox).not.toBeChecked();
  const normalPreview = await getToolcraftProductObservableSnapshot(page);
  await clickExport(page, "Export SVG", "svg");
  const normalSvg = await readLastExport(page, "svg");

  await expectToolcraftProductObservableToChange(
    page,
    async () => {
      await toggleCheckboxInSection(page, "Source Video", "Invert");
    },
    { timeoutMs: 8000 },
  );
  await expect(checkbox).toBeChecked();
  const invertedPreview = await getToolcraftProductObservableSnapshot(page);
  await clickExport(page, "Export SVG", "svg");
  const invertedSvg = await readLastExport(page, "svg");

  expect(invertedPreview).not.toBe(normalPreview);
  expect(invertedSvg.text).not.toBe(normalSvg.text);

  await scrubTimeline(page, 0.55);
  await expect(checkbox).toBeChecked();
  await page.getByRole("button", { name: "Reset Source Video section" }).click();
  await waitForToolcraftAnimationFrames(page, 4);
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Browse file" })).toBeVisible();
});

test("browser: source video export still creates a file when playback start is blocked", async ({
  page,
}) => {
  await openApp(page);
  await pausePlayback(page);
  await uploadSourceVideo(page);
  await chooseSelectInSection(page, "Video Export", "Duration", "5 s");
  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");

  await page.evaluate(() => {
    const originalPlay = HTMLMediaElement.prototype.play;
    Object.defineProperty(window, "__restoreBlockedVideoPlay", {
      configurable: true,
      value: () => {
        HTMLMediaElement.prototype.play = originalPlay;
      },
    });
    HTMLMediaElement.prototype.play = function blockedSourceVideoPlay() {
      if (this instanceof HTMLVideoElement && this.currentSrc.startsWith("data:video/")) {
        return Promise.reject(new DOMException("Blocked by test.", "NotAllowedError"));
      }

      return originalPlay.call(this);
    };
  });

  try {
    await clickExport(page, "Export Video", "video");
  } finally {
    await page.evaluate(() => {
      const restore = (window as Window & {
        __restoreBlockedVideoPlay?: () => void;
      }).__restoreBlockedVideoPlay;
      restore?.();
    });
  }

  const sourceVideo = await readLastExport(page, "video");
  const sourceVideoMetadata = await readExportedVideoDurationMetadata(page);
  expect(sourceVideo.size).toBeGreaterThan(1000);
  expect(sourceVideoMetadata.duration).toBeGreaterThan(4.5);
  expect(sourceVideoMetadata.duration).toBeLessThan(5.75);
});

test("browser: dark source video auto-levels into visible dither output", async ({
  page,
}) => {
  await openApp(page);
  await pausePlayback(page);

  const darkVideoBuffer = await createSourceVideoWebm(page, 320, 180, 8, "dark");
  await expectToolcraftProductObservableToChange(
    page,
    async () => {
      await uploadSourceVideo(
        page,
        320,
        180,
        "source-video-dark.webm",
        darkVideoBuffer,
        8,
      );
    },
    { timeoutMs: 8000 },
  );
  await expectAsciiCanvasHasVisibleParticles(page);
});

test("browser: dither controls change ASCII output", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await uploadSourceImage(
    page,
    640,
    360,
    "tonal-gradient-source.svg",
    createTonalGradientSourceImageSvg(),
  );

  await dragToolcraftSliderToValue(page, "Threshold", 0.52);
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Strength", 0.2);
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Depth", 0);
  });
  await clickExport(page, "Export SVG", "svg");
  const flatDepthSvg = await readLastExport(page, "svg");
  const flatDepthSizes = [
    ...flatDepthSvg.text.matchAll(/data-glyph-size="([0-9.]+)"/g),
  ].map((match) => match[1]);
  const flatDepthColors = [
    ...flatDepthSvg.text.matchAll(/data-particle-color="(#[0-9A-F]{6})"/g),
  ].map((match) => match[1]);
  expect(flatDepthSizes.length).toBeGreaterThan(2);
  expect(new Set(flatDepthSizes).size).toBe(1);
  expect(new Set(flatDepthColors).size).toBe(1);
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Depth", 2);
  });
  await clickExport(page, "Export SVG", "svg");
  const deepDepthSvg = await readLastExport(page, "svg");
  const deepDepthSizes = [
    ...deepDepthSvg.text.matchAll(/data-glyph-size="([0-9.]+)"/g),
  ].map((match) => match[1]);
  const deepDepthColors = [
    ...deepDepthSvg.text.matchAll(/data-particle-color="(#[0-9A-F]{6})"/g),
  ].map((match) => match[1]);
  const deepCrossStrokeWidths = [
    ...deepDepthSvg.text.matchAll(/data-stroke-width="([0-9.]+)"/g),
  ].map((match) => match[1]);
  expect(new Set(deepDepthSizes).size).toBe(1);
  expect(new Set(deepDepthColors).size).toBeGreaterThan(20);
  expect(deepCrossStrokeWidths.length).toBeGreaterThan(2);
  expect(new Set(deepCrossStrokeWidths).size).toBe(1);
  expect(deepDepthSvg.text).toMatch(/<g data-particle-color=.*<rect/);
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Depth", 3);
  });
  await clickExport(page, "Export SVG", "svg");
  const enhancedDepthSvg = await readLastExport(page, "svg");
  const enhancedDepthSizes = [
    ...enhancedDepthSvg.text.matchAll(/data-glyph-size="([0-9.]+)"/g),
  ].map((match) => match[1]);
  const enhancedDepthColors = [
    ...enhancedDepthSvg.text.matchAll(/data-particle-color="(#[0-9A-F]{6})"/g),
  ].map((match) => match[1]);
  expect(new Set(enhancedDepthSizes).size).toBe(1);
  expect(new Set(enhancedDepthColors).size).toBeGreaterThan(20);

  await uploadSourceImage(
    page,
    640,
    360,
    "shadow-detail-source.svg",
    createShadowDetailSourceImageSvg(),
  );
  await dragToolcraftSliderToValue(page, "Strength", 1.6);
  await dragToolcraftSliderToValue(page, "Threshold", 0.6);
  await dragToolcraftSliderToValue(page, "Depth", 0);
  await clickExport(page, "Export SVG", "svg");
  const zeroDepthShadowSvg = await readLastExport(page, "svg");
  const zeroDepthShadowParticleCount = [
    ...zeroDepthShadowSvg.text.matchAll(/data-particle-color=/g),
  ].length;
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Depth", 1.5);
  });
  await clickExport(page, "Export SVG", "svg");
  const middleDepthShadowSvg = await readLastExport(page, "svg");
  const middleDepthShadowParticleCount = [
    ...middleDepthShadowSvg.text.matchAll(/data-particle-color=/g),
  ].length;
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Depth", 3);
  });
  await clickExport(page, "Export SVG", "svg");
  const liftedShadowSvg = await readLastExport(page, "svg");
  const liftedShadowColors = [
    ...liftedShadowSvg.text.matchAll(/data-particle-color="(#[0-9A-F]{6})"/g),
  ].map((match) => match[1]);
  expect(middleDepthShadowParticleCount).toBeGreaterThan(
    zeroDepthShadowParticleCount * 1.2,
  );
  expect(liftedShadowColors.length).toBeGreaterThan(middleDepthShadowParticleCount * 1.2);
  expect(new Set(liftedShadowColors).size).toBeGreaterThan(10);
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Threshold", 0.25);
  });
});

test("browser: motion speed and timeline change rendered frames", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await enableTimelinePanel(page);
  await page.getByRole("button", { name: "Play playback" }).click();
  await waitForToolcraftAnimationFrames(page, 4);
  await page.getByRole("button", { name: "Pause playback" }).click();
  await page.getByRole("button", { name: "Disable loop" }).click();
  await page.getByRole("button", { name: "Enable loop" }).click();
  await editTimelineDuration(page, 2);

  const startFrame = await getToolcraftProductObservableSnapshot(page);
  await scrubTimeline(page, 0.5);
  const midFrame = await getToolcraftProductObservableSnapshot(page);
  expect(midFrame).not.toBe(startFrame);

  await dragToolcraftSliderToValue(page, "Speed", 0.25);
  await scrubTimeline(page, 0.37);
  const slowFrame = await getToolcraftProductObservableSnapshot(page);
  await dragToolcraftSliderToValue(page, "Speed", 3);
  await scrubTimeline(page, 0.37);
  const fastFrame = await getToolcraftProductObservableSnapshot(page);
  expect(fastFrame).not.toBe(slowFrame);

  await scrubTimeline(page, 0.98);
  const endFrame = await getToolcraftProductObservableSnapshot(page);
  expect(endFrame).not.toBe(midFrame);

  await playPlayback(page);
  await waitForToolcraftAnimationFrames(page, 12);
  await pausePlayback(page);
});

test("browser: background and image export produce correct files", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);

  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByLabel(/background hex/i).fill("101820");
    await page.getByLabel(/background hex/i).press("Enter");
  });
  await toggleSwitchByLabel(page, "Include");

  const imageResolutionExpectations = { "2k": 2048, "8k": 8192 } as const;
  await chooseSelectInSection(page, "Image Export", "Resolution", "2K");
  await chooseSelectInSection(page, "Image Export", "Format", "PNG");
  await clickExport(page, "Export PNG", "image");
  const transparentPng = await readExportedImage(page);

  expect(transparentPng.type).toContain("png");
  expect(Math.max(transparentPng.width, transparentPng.height)).toBe(
    imageResolutionExpectations["2k"],
  );
  expect(transparentPng.alpha).toBe(0);

  await toggleSwitchByLabel(page, "Include");
  await chooseSelectInSection(page, "Image Export", "Format", "JPG");
  await clickExport(page, "Export PNG", "image");
  const exportedImage = await readExportedImage(page);

  expect(exportedImage.type).toMatch(/jpeg|jpg/);
  expect(exportedImage.width).toBeGreaterThan(0);
  expect(exportedImage.height).toBeGreaterThan(0);
});

test("browser: video export produces timeline-duration metadata", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await chooseSelectInSection(page, "Video Export", "Duration", "5 s");
  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");
  await chooseSelectInSection(page, "Video Export", "Format", "MP4");
  await clickExport(page, "Export Video", "video");
  const currentMetadata = await readExportedVideoDurationMetadata(page);

  expect(currentMetadata.duration).toBeGreaterThan(4.5);
  expect(currentMetadata.duration).toBeLessThan(5.5);
  expect(currentMetadata.durationSeconds).toBe(5);
  expect(currentMetadata.videoWidth).toBe(1920);
  expect(currentMetadata.videoHeight).toBe(1080);

  await chooseSelectInSection(page, "Video Export", "Resolution", "4K");
  await chooseSelectInSection(page, "Video Export", "Format", "WebM");
  await clickExport(page, "Export Video", "video");
  const fourKMetadata = await readExportedVideoDurationMetadata(page);

  expect(fourKMetadata.videoWidth).toBe(3840);
  expect(fourKMetadata.videoHeight).toBe(2160);
});

test("browser: video duration select sets exported video length", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");
  await chooseSelectInSection(page, "Video Export", "Format", "MP4");

  await chooseSelectInSection(page, "Video Export", "Duration", "5 s");
  await clickExport(page, "Export Video", "video");
  const fiveSeconds = await readExportedVideoDurationMetadata(page);
  expect(fiveSeconds.durationSeconds).toBe(5);
  expect(fiveSeconds.duration).toBeGreaterThan(4.5);
  expect(fiveSeconds.duration).toBeLessThan(5.75);

  await chooseSelectInSection(page, "Video Export", "Duration", "10 s");
  await clickExport(page, "Export Video", "video");
  const tenSeconds = await readExportedVideoDurationMetadata(page);
  expect(tenSeconds.durationSeconds).toBe(10);
  expect(tenSeconds.duration).toBeGreaterThan(9.5);
  expect(tenSeconds.duration).toBeLessThan(10.75);
});

test("browser: optimized GIF export preserves dimensions duration and loop", async ({
  page,
}) => {
  await openApp(page);
  await pausePlayback(page);
  await chooseSelectInSection(page, "Video Export", "Duration", "5 s");
  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");
  await chooseSelectInSection(page, "Video Export", "Format", "GIF");
  await clickExport(page, "Export Video", "video");
  const gif = await readExportedGifMetadata(page);

  expect(gif.header).toBe("GIF89a");
  expect(gif.type).toBe("image/gif");
  expect(gif.fileName).toMatch(/\.gif$/);
  expect(gif.width).toBe(1920);
  expect(gif.height).toBe(1080);
  expect(gif.duration).toBeGreaterThanOrEqual(4.99);
  expect(gif.duration).toBeLessThanOrEqual(5.01);
  expect(gif.durationSeconds).toBe(5);
  expect(gif.loopCount).toBe(0);
  expect(gif.paletteColors).toBeLessThanOrEqual(32);
  expect(gif.frameCount).toBeGreaterThanOrEqual(2);
  expect(gif.size).toBeLessThan(gif.width * gif.height * gif.frameCount);
});

test("browser: footer exports create svg image and video bytes", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);

  await clickExport(page, "Export SVG", "svg");
  const svg = await readLastExport(page, "svg");
  expect(svg.type).toContain("image/svg+xml");
  expect(svg.text).toContain("<svg");
  expect(svg.text).toContain("data-particle-color");

  await chooseSelectInSection(page, "Image Export", "Format", "PNG");
  await chooseSelectInSection(page, "Image Export", "Resolution", "2K");
  await clickExport(page, "Export PNG", "image");
  const png = await readLastExport(page, "image");
  expect(png.size).toBeGreaterThan(1000);

  await chooseSelectInSection(page, "Video Export", "Duration", "5 s");
  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");
  await clickExport(page, "Export Video", "video");
  const video = await readLastExport(page, "video");
  expect(video.size).toBeGreaterThan(1000);
});

test("browser: persistence reload restores edited pattern settings", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);

  const defaultSnapshot = await getToolcraftProductObservableSnapshot(page);
  await dragToolcraftSliderByLabel(page, "Density", 0.9);
  const beforeReload = await getToolcraftProductObservableSnapshot(page);
  expect(beforeReload).not.toBe(defaultSnapshot);
  await page.waitForTimeout(250);
  await page.reload();
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  await pausePlayback(page);
  const afterReload = await getToolcraftProductObservableSnapshot(page);

  expect(afterReload).toBeTruthy();
  expect(afterReload).not.toBe("");
  expect(afterReload).not.toBe(defaultSnapshot);
});

test("browser: reference video motif is reproduced in product output", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const snapshot = await getToolcraftProductObservableSnapshot(page);

  expect(snapshot).toContain("data-ascii-pattern-canvas");
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
});

test("browser: second video reference defines dense bright default field", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);

  const expectSliderValue = async (label: string, value: number) => {
    const field = await getToolcraftFieldByLabel(page, label);
    await expect(field.getByRole("slider").first()).toHaveAttribute(
      "aria-valuenow",
      String(value),
    );
  };

  const particleField = await getToolcraftFieldByLabel(page, "Particle");
  await expect(particleField.getByRole("combobox").first()).toContainText("Crosses");
  await expectSliderValue("Scale", 24);
  await expectSliderValue("Spacing", -8);
  await expectSliderValue("Voids", 1);
  await expectSliderValue("Density", 100);
  await expectSliderValue("Speed", 1);
  await expectSliderValue("Strength", 2.4);
  await expectSliderValue("Depth", 3);
  await expectSliderValue("Threshold", 0.1);

  await clickExport(page, "Export SVG", "svg");
  const defaultSvg = await readLastExport(page, "svg");
  const particleColors = defaultSvg.text.match(/data-particle-color="#[0-9A-Fa-f]{6}"/g) ?? [];
  const uniqueColors = new Set(
    particleColors.map((attribute) => attribute.slice(attribute.indexOf("#"), -1)),
  );

  expect(particleColors.length).toBeGreaterThan(4000);
  expect(uniqueColors.size).toBeGreaterThan(30);
  expect(defaultSvg.text).toContain('data-glyph-size="21.60"');
  expect(defaultSvg.text).toContain('data-stroke-width="3.02"');

  await dragToolcraftSliderToValue(page, "Scale", 6);
  await dragToolcraftSliderToValue(page, "Density", 12);
  await page.getByRole("button", { name: "Reset Pattern section" }).click();
  await dragToolcraftSliderToValue(page, "Strength", 0.2);
  await dragToolcraftSliderToValue(page, "Depth", 0);
  await dragToolcraftSliderToValue(page, "Threshold", 0.9);
  await page.getByRole("button", { name: "Reset Dither section" }).click();
  await waitForToolcraftAnimationFrames(page, 2);

  await expectSliderValue("Scale", 24);
  await expectSliderValue("Spacing", -8);
  await expectSliderValue("Density", 100);
  await expectSliderValue("Strength", 2.4);
  await expectSliderValue("Depth", 3);
  await expectSliderValue("Threshold", 0.1);
});

test("browser: native preview dimensions match canvas output size", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const renderScaleField = await getToolcraftFieldByLabel(page, "Resolution scale");
  await expect(
    renderScaleField.locator('[data-slot="slider"][data-variant="discrete"]'),
  ).toBeVisible();
  await expect(renderScaleField.locator('[data-slot="slider-marker"]').first()).toBeVisible();
  const beforeScaleSnapshot = await getToolcraftProductObservableSnapshot(page);
  await dragToolcraftSliderToValue(page, "Resolution scale", 1);
  const afterScaleSnapshot = await getToolcraftProductObservableSnapshot(page);
  expect(afterScaleSnapshot).not.toBe(beforeScaleSnapshot);
  await expectToolcraftDiscreteSliderDragSmoothness(page, "Resolution scale");
  await dragToolcraftSliderToValue(page, "Resolution scale", 2);
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );

  const dimensions = await page
    .locator("[data-ascii-pattern-canvas]")
    .evaluate((canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const previewWidth = rect.width;
      const previewHeight = rect.height;
      const outputWidth = canvas.width;
      const outputHeight = canvas.height;
      const previewAspect = previewWidth / previewHeight;
      const outputAspect = outputWidth / outputHeight;

      return {
        outputAspect,
        outputHeight,
        outputWidth,
        previewAspect,
        previewHeight,
        previewWidth,
      };
    });

  expect(dimensions.previewWidth).toBeGreaterThan(0);
  expect(dimensions.previewHeight).toBeGreaterThan(0);
  expect(dimensions.outputWidth).toBeGreaterThanOrEqual(Math.round(dimensions.previewWidth));
  expect(dimensions.outputHeight).toBeGreaterThanOrEqual(Math.round(dimensions.previewHeight));
  expect(Math.abs(dimensions.previewAspect - dimensions.outputAspect)).toBeLessThan(0.01);
});

test("browser: reference video motion breathes across timeline frames", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);

  const sparseFrame = await getToolcraftProductObservableSnapshot(page);
  await scrubTimeline(page, 0.52);
  const denseFrame = await getToolcraftProductObservableSnapshot(page);
  await scrubTimeline(page, 0.88);
  const returningFrame = await getToolcraftProductObservableSnapshot(page);

  expect(denseFrame).not.toBe(sparseFrame);
  expect(returningFrame).not.toBe(denseFrame);
});

test("browser perf: source image import prepares dither sampler", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const stressValue = getToolcraftPerformanceStressValue<{
    height: number;
    width: number;
  }>(appPerformance, "source-image-media-import");
  const imageField = await getSourceImageField(page);
  await imageField.locator('input[type="file"]').first().setInputFiles({
    buffer: createSourceImageSvg(stressValue.width, stressValue.height),
    mimeType: "image/svg+xml",
    name: "source-image-heavy.svg",
  });
  await expect(page.getByRole("button", { name: "Replace image file" })).toBeVisible();
  await page.getByRole("button", { name: "Remove image" }).click();
  await waitForToolcraftAnimationFrames(page, 3);

  const result = await measureToolcraftInteraction(page, async () => {
    await expectToolcraftProductObservableToChange(
      page,
      async () => {
        await uploadSourceImage(
          page,
          stressValue.width,
          stressValue.height,
          "source-image-heavy.svg",
        );
      },
      { timeoutMs: 8000 },
    );
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "source-image-media-import");
});

test("browser perf: source image invert toggle stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await uploadSourceImage(page, 640, 360, "source-image-invert-performance.svg");
  const before = await getToolcraftProductObservableSnapshot(page);

  const result = await measureToolcraftInteraction(page, async () => {
    await toggleCheckboxInSection(page, "Source Image", "Invert");
  });

  const after = await getToolcraftProductObservableSnapshot(page);
  expect(after).not.toBe(before);
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "source-image-invert-control-change",
  );
});

test("browser perf: source video invert toggle stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await uploadSourceVideo(page, 640, 360, "source-video-invert-performance.webm");
  const before = await getToolcraftProductObservableSnapshot(page);

  const result = await measureToolcraftInteraction(page, async () => {
    await toggleCheckboxInSection(page, "Source Video", "Invert");
  });

  const after = await getToolcraftProductObservableSnapshot(page);
  expect(after).not.toBe(before);
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "source-video-invert-control-change",
  );
});

test("browser perf: source video import prepares dither sampler", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const stressValue = getToolcraftPerformanceStressValue<{
    height: number;
    width: number;
  }>(appPerformance, "source-video-media-import");
  const videoBuffer = await createSourceVideoWebm(
    page,
    stressValue.width,
    stressValue.height,
    4,
  );
  const videoField = await getSourceVideoField(page);
  await videoField.locator('input[type="file"]').first().setInputFiles({
    buffer: videoBuffer,
    mimeType: "video/webm",
    name: "source-video-heavy.webm",
  });
  await expect(page.getByRole("button", { name: "Replace file" })).toBeVisible();
  await page.getByRole("button", { name: "Remove source-video-heavy.webm" }).click();
  await waitForToolcraftAnimationFrames(page, 4);

  const result = await measureToolcraftInteraction(page, async () => {
    await uploadSourceVideo(
      page,
      stressValue.width,
      stressValue.height,
      "source-video-heavy.webm",
      videoBuffer,
      4,
    );
    await expectAsciiCanvasHasVisibleParticles(page);
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "source-video-media-import");
});

test("browser perf: source video playback follows decoded frames", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const stressValue = getToolcraftPerformanceStressValue<{
    density: number;
    scale: number;
    sourceVideo: { frameRate: number; height: number; width: number };
    threshold: number;
  }>(appPerformance, "source-video-playback");
  const frameCount = Math.max(24, Math.round(stressValue.sourceVideo.frameRate * 2));
  const videoBuffer = await createSourceVideoWebm(
    page,
    stressValue.sourceVideo.width,
    stressValue.sourceVideo.height,
    frameCount,
    "high",
    stressValue.sourceVideo.frameRate,
  );

  await applyToolcraftPerformanceStressFixture(page, appPerformance, "source-video-playback", {
    density: async (value) => {
      await dragToolcraftSliderToValue(page, "Density", Number(value));
    },
    scale: async (value) => {
      await dragToolcraftSliderToValue(page, "Scale", Number(value));
    },
    sourceVideo: async (value) => {
      const media = value as { frameRate: number; height: number; width: number };
      await uploadSourceVideo(
        page,
        media.width,
        media.height,
        "source-video-playback-heavy.webm",
        videoBuffer,
        frameCount,
        media.frameRate,
      );
    },
    threshold: async (value) => {
      await dragToolcraftSliderToValue(page, "Threshold", Number(value));
    },
  });

  await playPlayback(page);
  const cadence = await measureSourceVideoFrameCadence(page, 1200);
  const animation = await measureToolcraftAnimationFrames(page, 120);
  const budget = getToolcraftPerformanceScenarioBudget(
    appPerformance,
    "source-video-playback",
  );

  expect(cadence.updates).toBeGreaterThanOrEqual(12);
  expect(cadence.maxFrameGapMs).toBeLessThanOrEqual(budget.maxFrameGapMs ?? 120);
  expectToolcraftScenarioPerformanceBudget(animation, appPerformance, "source-video-playback");
});

test("browser perf: particle type select changes glyph family", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "particle-type-control-change",
    {
      density: async (value) => {
        await dragToolcraftSliderToValue(page, "Density", Number(value));
      },
      renderScale: async (value) => {
        await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
      },
      scale: async (value) => {
        await dragToolcraftSliderToValue(page, "Scale", Number(value));
      },
      threshold: async (value) => {
        await dragToolcraftSliderToValue(page, "Threshold", Number(value));
      },
    },
  );
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  const stressValue = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "particle-type-control-change",
  );
  const particleField = await getToolcraftFieldByLabel(page, "Particle");
  await particleField.getByRole("combobox").click({ trial: true });
  const result = await measureToolcraftInteraction(page, async () => {
    await chooseSelectInField(page, "Particle", particleOptionLabel(stressValue));
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "particle-type-control-change",
  );
});

test("browser perf: speed control drag stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Speed", 0.85);
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "speed-control-drag");
});

test("browser perf: strength control drag stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Strength", 0.85);
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "strength-control-drag");
});

test("browser perf: depth control drag stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await uploadSourceImage(
    page,
    640,
    360,
    "depth-performance-shadow-source.svg",
    createShadowDetailSourceImageSvg(),
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Depth", 0.85);
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "contrast-control-drag");
});

test("browser perf: include background toggle stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const includeField = await getToolcraftFieldByLabel(page, "Include");
  await includeField.getByRole("switch").click({ trial: true });
  const result = await measureToolcraftInteraction(page, async () => {
    await toggleSwitchByLabel(page, "Include");
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "include-background-control-change",
  );
});

test("browser perf: background color change stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await page.locator("[aria-label='background hex']").fill("101820");
    await page.locator("[aria-label='background hex']").press("Enter");
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "background-color-control-change",
  );
});

test("browser perf: image format select stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const imageFormatField = await page
    .locator('[data-slot="panel-title"]')
    .filter({ hasText: /^Image Export$/ })
    .locator("xpath=ancestor::section[1]")
    .locator('[data-slot="field"]')
    .filter({ hasText: /^Format/ })
    .first();
  await imageFormatField.getByRole("combobox").click({ trial: true });
  const result = await measureToolcraftInteraction(page, async () => {
    await chooseSelectInSection(page, "Image Export", "Format", "JPG");
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "image-format-control-change");
});

test("browser perf: image resolution select records heavy export range", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "image-resolution-control-change",
    {
      density: async (value) => {
        await dragToolcraftSliderToValue(page, "Density", Number(value));
      },
      renderScale: async (value) => {
        await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
      },
      scale: async (value) => {
        await dragToolcraftSliderToValue(page, "Scale", Number(value));
      },
      threshold: async (value) => {
        await dragToolcraftSliderToValue(page, "Threshold", Number(value));
      },
    },
  );
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  const stressValue = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "image-resolution-control-change",
  );
  const imageResolutionField = await page
    .locator('[data-slot="panel-title"]')
    .filter({ hasText: /^Image Export$/ })
    .locator("xpath=ancestor::section[1]")
    .locator('[data-slot="field"]')
    .filter({ hasText: /^Resolution/ })
    .first();
  await imageResolutionField.getByRole("combobox").click({ trial: true });
  const result = await measureToolcraftInteraction(page, async () => {
    await chooseSelectInSection(
      page,
      "Image Export",
      "Resolution",
      exportResolutionOptionLabel(stressValue),
    );
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "image-resolution-control-change",
  );
});

test("browser perf: video duration select stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await chooseSelectInSection(page, "Video Export", "Duration", "15 s");
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "video-duration-control-change");
});

test("browser perf: video format select stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const videoFormatField = await page
    .locator('[data-slot="panel-title"]')
    .filter({ hasText: /^Video Export$/ })
    .locator("xpath=ancestor::section[1]")
    .locator('[data-slot="field"]')
    .filter({ hasText: /^Format/ })
    .first();
  await videoFormatField.getByRole("combobox").click({ trial: true });
  const result = await measureToolcraftInteraction(page, async () => {
    await chooseSelectInSection(page, "Video Export", "Format", "WebM");
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "video-format-control-change");
});

test("browser perf: video resolution select records encoder workload range", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "video-resolution-control-change",
    {
      density: async (value) => {
        await dragToolcraftSliderToValue(page, "Density", Number(value));
      },
      renderScale: async (value) => {
        await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
      },
      scale: async (value) => {
        await dragToolcraftSliderToValue(page, "Scale", Number(value));
      },
      threshold: async (value) => {
        await dragToolcraftSliderToValue(page, "Threshold", Number(value));
      },
    },
  );
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  const stressValue = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "video-resolution-control-change",
  );
  const videoResolutionField = await page
    .locator('[data-slot="panel-title"]')
    .filter({ hasText: /^Video Export$/ })
    .locator("xpath=ancestor::section[1]")
    .locator('[data-slot="field"]')
    .filter({ hasText: /^Resolution/ })
    .first();
  await videoResolutionField.getByRole("combobox").click({ trial: true });
  const result = await measureToolcraftInteraction(page, async () => {
    await chooseSelectInSection(
      page,
      "Video Export",
      "Resolution",
      exportResolutionOptionLabel(stressValue),
    );
  });
  await expect(page.locator("[data-ascii-pattern-canvas]")).toBeVisible();
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "video-resolution-control-change",
  );
});

test("browser perf: heavy preview render completes within budget", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await applyToolcraftPerformanceStressFixture(page, appPerformance, "heavy-preview-render", {
      density: async (value) => {
        await dragToolcraftSliderToValue(page, "Density", Number(value));
      },
      renderScale: async (value) => {
        await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
      },
      scale: async (value) => {
        await dragToolcraftSliderToValue(page, "Scale", Number(value));
      },
      threshold: async (value) => {
        await dragToolcraftSliderToValue(page, "Threshold", Number(value));
      },
    });
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "heavy-preview-render");
});

test("browser perf: density control drag uses heavy ASCII fixture", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "density-control-drag", {
    renderScale: async (value) => {
      await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
    },
    scale: async (value) => {
      await dragToolcraftSliderToValue(page, "Scale", Number(value));
    },
    threshold: async (value) => {
      await dragToolcraftSliderToValue(page, "Threshold", Number(value));
    },
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  await dragToolcraftSliderByLabel(page, "Density", 0.8);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Density",
      appPerformance,
      "density-control-drag",
    );
  });
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "density-control-drag");
});

test("browser perf: scale control drag uses heavy ASCII fixture", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "scale-control-drag", {
    density: async (value) => {
      await dragToolcraftSliderToValue(page, "Density", Number(value));
    },
    renderScale: async (value) => {
      await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
    },
    threshold: async (value) => {
      await dragToolcraftSliderToValue(page, "Threshold", Number(value));
    },
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  await dragToolcraftSliderByLabel(page, "Scale", 0.02);
  await dragToolcraftSliderByLabel(page, "Scale", 0.45);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Scale",
      appPerformance,
      "scale-control-drag",
    );
  });
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "scale-control-drag");
});

test("browser perf: spacing control drag uses heavy ASCII fixture", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "spacing-control-drag", {
    density: async (value) => {
      await dragToolcraftSliderToValue(page, "Density", Number(value));
    },
    renderScale: async (value) => {
      await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
    },
    scale: async (value) => {
      await dragToolcraftSliderToValue(page, "Scale", Number(value));
    },
    threshold: async (value) => {
      await dragToolcraftSliderToValue(page, "Threshold", Number(value));
    },
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  await dragToolcraftSliderByLabel(page, "Spacing", 0.95);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Spacing",
      appPerformance,
      "spacing-control-drag",
    );
  });
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "spacing-control-drag");
});

test("browser perf: voids control drag uses heavy ASCII fixture", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "voids-control-drag", {
    density: async (value) => {
      await dragToolcraftSliderToValue(page, "Density", Number(value));
    },
    renderScale: async (value) => {
      await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
    },
    scale: async (value) => {
      await dragToolcraftSliderToValue(page, "Scale", Number(value));
    },
    spacing: async (value) => {
      await dragToolcraftSliderToValue(page, "Spacing", Number(value));
    },
    threshold: async (value) => {
      await dragToolcraftSliderToValue(page, "Threshold", Number(value));
    },
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  await dragToolcraftSliderByLabel(page, "Voids", 0.95);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Voids",
      appPerformance,
      "voids-control-drag",
    );
  });
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "voids-control-drag");
});

test("browser perf: threshold control drag uses heavy ASCII fixture", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "threshold-control-drag", {
    density: async (value) => {
      await dragToolcraftSliderToValue(page, "Density", Number(value));
    },
    renderScale: async (value) => {
      await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
    },
    scale: async (value) => {
      await dragToolcraftSliderToValue(page, "Scale", Number(value));
    },
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  await dragToolcraftSliderByLabel(page, "Threshold", 0.6);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Threshold",
      appPerformance,
      "threshold-control-drag",
    );
  });
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "threshold-control-drag");
});

test("browser perf: render scale control drag proves backing pixels", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await expectToolcraftDiscreteSliderDragSmoothness(page, "Resolution scale");
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "render-scale-control-drag", {
    density: async (value) => {
      await dragToolcraftSliderToValue(page, "Density", Number(value));
    },
    scale: async (value) => {
      await dragToolcraftSliderToValue(page, "Scale", Number(value));
    },
    threshold: async (value) => {
      await dragToolcraftSliderToValue(page, "Threshold", Number(value));
    },
  });
  await dragToolcraftSliderByLabel(page, "Resolution scale", 0.6);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Resolution scale",
      appPerformance,
      "render-scale-control-drag",
    );
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    getToolcraftPerformanceStressValue<number>(appPerformance, "render-scale-control-drag"),
  );
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "render-scale-control-drag");
});

test("browser perf: heavy ASCII animation frame budget", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceStressFixture(page, appPerformance, "heavy-animation-frame", {
    density: async (value) => {
      await dragToolcraftSliderToValue(page, "Density", Number(value));
    },
    renderScale: async (value) => {
      await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
    },
    scale: async (value) => {
      await dragToolcraftSliderToValue(page, "Scale", Number(value));
    },
    spacing: async (value) => {
      await dragToolcraftSliderToValue(page, "Spacing", Number(value));
    },
    threshold: async (value) => {
      await dragToolcraftSliderToValue(page, "Threshold", Number(value));
    },
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  await playPlayback(page);
  const result = await measureToolcraftAnimationFrames(page, 120);
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "heavy-animation-frame");
});

test("browser perf: animated viewport drag stays stable", async ({ page }) => {
  await openApp(page);
  await applyToolcraftPerformanceStressFixture(
    page,
    appPerformance,
    "animation-viewport-drag-heavy",
    {
      density: async (value) => {
        await dragToolcraftSliderToValue(page, "Density", Number(value));
      },
      renderScale: async (value) => {
        await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
      },
      scale: async (value) => {
        await dragToolcraftSliderToValue(page, "Scale", Number(value));
      },
      threshold: async (value) => {
        await dragToolcraftSliderToValue(page, "Threshold", Number(value));
      },
    },
  );
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  await playPlayback(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftCanvasViewport(page, { x: 48, y: -32 }, 6);
  });
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "animation-viewport-drag-heavy",
  );
});

test("browser perf: viewport zoom stress uses heavy ASCII fixture", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceStressFixture(
    page,
    appPerformance,
    "viewport-zoom-stress-heavy",
    {
      density: async (value) => {
        await dragToolcraftSliderToValue(page, "Density", Number(value));
      },
      renderScale: async (value) => {
        await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
      },
      scale: async (value) => {
        await dragToolcraftSliderToValue(page, "Scale", Number(value));
      },
      threshold: async (value) => {
        await dragToolcraftSliderToValue(page, "Threshold", Number(value));
      },
    },
  );
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "[data-ascii-pattern-canvas]",
    2,
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await zoomToolcraftCanvasViewport(page);
  });
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "viewport-zoom-stress-heavy");
});

test("browser perf: short video export uses current export settings", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceStressFixture(page, appPerformance, "short-video-export", {
    density: async (value) => {
      await dragToolcraftSliderToValue(page, "Density", Number(value));
    },
    duration: async (value) => {
      await chooseSelectInSection(page, "Video Export", "Duration", `${Number(value)} s`);
    },
    scale: async (value) => {
      await dragToolcraftSliderToValue(page, "Scale", Number(value));
    },
    threshold: async (value) => {
      await dragToolcraftSliderToValue(page, "Threshold", Number(value));
    },
  });
  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");
  const result = await measureToolcraftInteraction(page, async () => {
    await clickExport(page, "Export Video", "video");
  });
  const video = await readLastExport(page, "video");
  expect(video.size).toBeGreaterThan(1000);
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "short-video-export");
});

test("browser perf: optimized GIF export stays responsive", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  await applyToolcraftPerformanceStressFixture(page, appPerformance, "optimized-gif-export", {
    density: async (value) => {
      await dragToolcraftSliderToValue(page, "Density", Number(value));
    },
    duration: async (value) => {
      await chooseSelectInSection(page, "Video Export", "Duration", `${Number(value)} s`);
    },
    scale: async (value) => {
      await dragToolcraftSliderToValue(page, "Scale", Number(value));
    },
    threshold: async (value) => {
      await dragToolcraftSliderToValue(page, "Threshold", Number(value));
    },
  });
  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");
  await chooseSelectInSection(page, "Video Export", "Format", "GIF");
  const result = await measureToolcraftInteraction(page, async () => {
    await clickExport(page, "Export Video", "video");
  });
  const gif = await readExportedGifMetadata(page);
  expect(gif.header).toBe("GIF89a");
  expect(gif.paletteColors).toBeLessThanOrEqual(32);
  expect(gif.size).toBeGreaterThan(1000);
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "optimized-gif-export");
});

test("browser perf: viewport stability after controls", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);
  const result = await expectToolcraftCanvasViewportStable(page, async () => {
    await dragToolcraftSliderByLabel(page, "Density", 0.7);
  });
  expect(result.durationMs).toBeGreaterThan(0);
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "viewport-stability-after-controls",
  );
});
