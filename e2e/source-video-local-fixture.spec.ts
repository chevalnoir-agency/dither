import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { expect, test } from "@playwright/test";

import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

const fixturePath = process.env.DITHER_VIDEO_FIXTURE;

test("browser: local MP4 fixture imports while paused and plays", async ({ page }, testInfo) => {
  test.skip(!fixturePath, "Set DITHER_VIDEO_FIXTURE to reproduce an external video locally.");
  const buffer = await readFile(fixturePath!);
  const name = basename(fixturePath!);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: /Pause playback/ }).click();

  const input = page.locator('input[type="file"][accept="video/*"]');
  const canvas = page.locator("[data-ascii-pattern-canvas]");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await expectToolcraftProductObservableToChange(page, async () => {
      await input.setInputFiles({ buffer, mimeType: "video/mp4", name });
      await expect(page.getByRole("button", { name: `Remove ${name}` })).toBeVisible();
    });
    await expect(page.getByRole("button", { name: /Play playback/ })).toBeVisible();
    if (attempt === 0) {
      await page.getByRole("button", { name: `Remove ${name}` }).click();
      await expect(page.getByRole("button", { name: "Browse file", exact: true })).toBeVisible();
    }
  }

  await page.screenshot({ path: process.env.DITHER_VIDEO_SCREENSHOT || testInfo.outputPath("video-import.png") });
  await page.getByRole("button", { name: /Play playback/ }).click();
  await expect.poll(async () => Number(await canvas.getAttribute("data-source-video-frame-count"))).toBeGreaterThan(3);
  expect(errors).toEqual([]);
});
