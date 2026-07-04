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

function particleOptionLabel(value: string): string {
  if (value === "dot") {
    return "Mini dots";
  }

  if (value === "mixed") {
    return "Mixed";
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
    { timeout: 20000 },
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
    { timeout: 20000 },
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

test("browser: pattern controls change ASCII output", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);

  await expectToolcraftProductObservableToChange(page, async () => {
    await chooseSelectInField(page, "Particle", "Mini dots");
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await chooseSelectInField(page, "Particle", "Mixed");
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Scale", 0.1);
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Density", 0.9);
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Spacing", 0.9);
  });
});

test("browser: dither controls change ASCII output", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);

  await dragToolcraftSliderToValue(page, "Threshold", 0.52);
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Strength", 0.2);
  });
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
  await editTimelineDuration(page, 1);

  await chooseSelectInSection(page, "Video Export", "Resolution", "Current");
  await chooseSelectInSection(page, "Video Export", "Format", "MP4");
  await clickExport(page, "Export Video", "video");
  const currentMetadata = await readExportedVideoDurationMetadata(page);

  expect(currentMetadata.duration).toBeGreaterThan(0.75);
  expect(currentMetadata.duration).toBeLessThan(1.5);
  expect(currentMetadata.durationSeconds).toBe(1);
  expect(currentMetadata.videoWidth).toBe(1920);
  expect(currentMetadata.videoHeight).toBe(1080);

  await chooseSelectInSection(page, "Video Export", "Resolution", "4K");
  await chooseSelectInSection(page, "Video Export", "Format", "WebM");
  await clickExport(page, "Export Video", "video");
  const fourKMetadata = await readExportedVideoDurationMetadata(page);

  expect(fourKMetadata.videoWidth).toBe(3840);
  expect(fourKMetadata.videoHeight).toBe(2160);
});

test("browser: footer exports create svg image and video bytes", async ({ page }) => {
  await openApp(page);
  await pausePlayback(page);

  await clickExport(page, "Export SVG", "svg");
  const svg = await readLastExport(page, "svg");
  expect(svg.type).toContain("image/svg+xml");
  expect(svg.text).toContain("<svg");
  expect(svg.text).toContain("<text");

  await chooseSelectInSection(page, "Image Export", "Format", "PNG");
  await chooseSelectInSection(page, "Image Export", "Resolution", "2K");
  await clickExport(page, "Export PNG", "image");
  const png = await readLastExport(page, "image");
  expect(png.size).toBeGreaterThan(1000);

  await editTimelineDuration(page, 1);
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
  await dragToolcraftSliderToValue(page, "Spacing", 24);
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
      await editTimelineDuration(page, Number(value));
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
