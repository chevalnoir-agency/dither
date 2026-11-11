import { describe, expect, it } from "vitest";

import { appAcceptance } from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import {
  ASCII_PARTICLE_HIGH_COLOR,
  ASCII_PARTICLE_LOW_COLOR,
  createAsciiPatternFrame,
  getAsciiParticleColor,
  getAsciiSourceVideoInvert,
  type AsciiPatternSettings,
} from "./ascii-pattern";

describe("appSchema", () => {
  it("publishes the CHEVAL NOIR DITHER Toolcraft app contract", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appSchema.canvas.size).toEqual({
      height: 1080,
      unit: "px",
      width: 1920,
    });
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.controls?.sections[0]?.controls.settingsTransfer).toMatchObject({
      target: "runtime.settingsTransfer",
      type: "settingsTransfer",
    });
    expect(appSchema.panels.controls?.sections[0]?.controls.canvasAspectRatio).toMatchObject({
      target: "canvas.aspectRatio",
      type: "aspectRatio",
    });
    expect(appSchema.panels.controls?.sections[0]?.controls.canvasWidth).toMatchObject({
      target: "canvas.size.width",
      type: "text",
    });
    expect(appSchema.panels.controls?.sections[0]?.controls.canvasHeight).toMatchObject({
      target: "canvas.size.height",
      type: "text",
    });
    expect(appSchema.panels.controls?.sections[0]?.controls.canvasRenderScale).toMatchObject({
      target: "canvas.renderScale",
      type: "slider",
    });
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toMatchObject({
      defaultDurationSeconds: 11.88166666666667,
      enabled: true,
      mode: "playback",
    });
    expect(appSchema.toolbar).toEqual({
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    });
    expect(appSchema.panels.controls?.title).toBe("CHEVAL NOIR DITHER");
    expect(appSchema.persistence).toMatchObject({
      key: "toolcraft:cheval-noir-dither:state:v1",
      storage: "localStorage",
      version: 1,
    });
    expect(appSchema.settingsTransfer).toMatchObject({
      appId: "cheval-noir-dither",
      fileName: "cheval-noir-dither-settings.json",
    });
    expect(appSchema.assembly.components).toEqual([
      "canvas",
      "controlsPanel",
      "timelinePanel",
      "toolbar",
    ]);
    expect(appSchema.assembly.capabilities).toEqual(
      expect.arrayContaining([
        "canvas.draggable",
        "canvas.editableSize",
        "canvas.renderScale",
        "controls.defaults",
        "controls.panel",
        "timeline.duration",
        "timeline.panel",
        "timeline.playback",
        "toolbar.history",
        "toolbar.radar",
        "toolbar.theme",
        "toolbar.zoom",
      ]),
    );
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).toEqual(
      expect.arrayContaining([
        "canvas.center",
        "canvas.setSize",
        "canvas.setViewport",
        "canvas.zoomIn",
        "controls.reset",
        "controls.setValue",
        "history.undo",
        "timeline.setCurrentTime",
        "timeline.setDuration",
        "timeline.setPlaying",
        "timeline.togglePlayback",
      ]),
    );
  });

  it("adds product sections after runtime setup", () => {
    const productSections =
      appSchema.panels.controls?.sections.filter((section) => section.title !== "Setup") ??
      [];

    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(productSections.map((section) => section.title)).toEqual([
      "Source Image",
      "Source Video",
      "Pattern",
      "Motion",
      "Dither",
      "Background",
      "Image Export",
      "Video Export",
      "Export",
    ]);
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline?.mode).toBe("playback");
  });

  it("declares CHEVAL NOIR defaults, particle spacing, and hatch particles", () => {
    const sourceImageSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Source Image",
    );
    const sourceVideoSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Source Video",
    );
    const patternSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Pattern",
    );
    const backgroundSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Background",
    );
    const ditherSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Dither",
    );

    expect(sourceImageSection?.controls.image).toMatchObject({
      accept: "image/*",
      assetKind: "image",
      defaultValue: null,
      label: "Image",
      target: "source.image",
      type: "fileDrop",
    });
    expect(sourceImageSection?.controls.invert).toMatchObject({
      defaultValue: false,
      label: "Invert",
      target: "source.image.invert",
      type: "checkbox",
    });
    expect(sourceVideoSection?.controls.video).toMatchObject({
      accept: "video/*",
      assetKind: "file",
      defaultValue: null,
      label: "Video",
      target: "source.video",
      type: "fileDrop",
    });
    expect(sourceVideoSection?.controls.invert).toMatchObject({
      defaultValue: false,
      label: "Invert",
      target: "source.video.invert",
      type: "checkbox",
    });
    expect(patternSection?.controls.particleType).toMatchObject({
      defaultValue: "cross",
      label: "Particle",
      options: [
        { label: "Crosses", value: "cross" },
        { label: "Mini dots", value: "dot" },
        { label: "Hachures", value: "hatch" },
        { label: "Mixed", value: "mixed" },
      ],
      target: "pattern.particleType",
      type: "select",
    });
    expect(patternSection?.controls.scale).toMatchObject({
      defaultValue: 14,
      target: "pattern.scale",
      type: "slider",
    });
    expect(patternSection?.controls.spacing).toMatchObject({
      defaultValue: -2,
      label: "Spacing",
      max: 24,
      min: -8,
      step: 1,
      target: "pattern.spacing",
      type: "slider",
      unit: "px",
    });
    expect(patternSection?.controls.voids).toMatchObject({
      defaultValue: 1,
      label: "Voids",
      max: 5,
      min: 0,
      step: 0.05,
      target: "pattern.voids",
      type: "slider",
    });
    expect(patternSection?.controls.density).toMatchObject({
      defaultValue: 70,
      target: "pattern.density",
      type: "slider",
      unit: "%",
    });
    expect(backgroundSection?.controls.background).toMatchObject({
      defaultValue: { hex: "#0A0C11" },
      target: "appearance.background",
      type: "color",
    });
    expect(ditherSection?.controls.strength).toMatchObject({
      defaultValue: 1.6,
      target: "dither.strength",
      type: "slider",
    });
    expect(ditherSection?.controls.contrast).toMatchObject({
      defaultValue: 2,
      label: "Depth",
      max: 3,
      min: 0,
      step: 0.05,
      target: "dither.contrast",
      type: "slider",
    });
    expect(ditherSection?.controls.threshold).toMatchObject({
      defaultValue: 0.6,
      target: "dither.threshold",
      type: "slider",
    });
    expect(ASCII_PARTICLE_LOW_COLOR).toBe("#222629");
    expect(ASCII_PARTICLE_HIGH_COLOR).toBe("#BEBDC1");
    expect(getAsciiParticleColor(0)).toBe("#222629");
    expect(getAsciiParticleColor(1)).toBe("#BEBDC1");
    expect(getAsciiParticleColor(0.35, 0)).toBe(getAsciiParticleColor(0.5, 0));
    expect(getAsciiParticleColor(0.35, 2)).not.toBe(getAsciiParticleColor(0.35, 0));
    const tonalReds = [0.2, 0.4, 0.6, 0.8].map((tone) =>
      Number.parseInt(getAsciiParticleColor(tone, 2).slice(1, 3), 16),
    );
    expect(new Set(tonalReds).size).toBe(4);
    expect(tonalReds).toEqual([...tonalReds].sort((left, right) => left - right));
    const depthTwoShadow = Number.parseInt(getAsciiParticleColor(0.25, 2).slice(1, 3), 16);
    const depthThreeShadow = Number.parseInt(getAsciiParticleColor(0.25, 3).slice(1, 3), 16);
    const depthTwoHighlight = Number.parseInt(getAsciiParticleColor(0.75, 2).slice(1, 3), 16);
    const depthThreeHighlight = Number.parseInt(
      getAsciiParticleColor(0.75, 3).slice(1, 3),
      16,
    );
    expect(depthThreeShadow).toBeLessThan(depthTwoShadow);
    expect(depthThreeHighlight).toBeGreaterThan(depthTwoHighlight);

    const videoExportSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Video Export",
    );
    expect(videoExportSection?.controls.videoFormat).toMatchObject({
      defaultValue: "mp4",
      options: [
        { label: "MP4", value: "mp4" },
        { label: "WebM", value: "webm" },
        { label: "GIF", value: "gif" },
      ],
      target: "export.video.format",
      type: "select",
    });
    expect(videoExportSection?.controls.videoDuration).toMatchObject({
      defaultValue: "10",
      options: [
        { label: "5 s", value: "5" },
        { label: "10 s", value: "10" },
        { label: "15 s", value: "15" },
      ],
      target: "export.video.duration",
      type: "select",
    });
  });

  it("second video reference defines dense bright default field", () => {
    const settings: AsciiPatternSettings = {
      background: "#0A0C11",
      density: 100,
      ditherContrast: 3,
      ditherStrength: 2.4,
      ditherThreshold: 0.1,
      imageFormat: "png",
      imageResolution: "4k",
      includeBackground: true,
      particleType: "cross",
      scale: 24,
      spacing: -8,
      speed: 1,
      videoDurationSeconds: 10,
      videoFormat: "mp4",
      videoResolution: "current",
      voids: 1,
    };
    const frame = createAsciiPatternFrame({
      height: 1080,
      includeBackground: true,
      progress: 0.3,
      settings,
      width: 1920,
    });
    const particleColors = new Set(frame.glyphs.map((glyph) => glyph.color));
    const redChannels = frame.glyphs.map((glyph) =>
      Number.parseInt(glyph.color.slice(1, 3), 16),
    );

    expect(frame.glyphs.length).toBeGreaterThan(4000);
    expect(frame.glyphs.length).toBeLessThan(8160);
    expect(new Set(frame.glyphs.map((glyph) => glyph.char))).toEqual(new Set(["+"]));
    expect(new Set(frame.glyphs.map((glyph) => glyph.size.toFixed(2)))).toEqual(
      new Set(["21.60"]),
    );
    expect(particleColors.size).toBeGreaterThan(30);
    expect(Math.min(...redChannels)).toBeLessThan(70);
    expect(Math.max(...redChannels)).toBeGreaterThan(175);
  });

  it("maps media luminance to ordered particle tones without changing glyph size", () => {
    const sourceWidth = 64;
    const sourceHeight = 16;
    const width = 384;
    const height = 96;
    const data = new Uint8ClampedArray(sourceWidth * sourceHeight * 4);

    for (let y = 0; y < sourceHeight; y += 1) {
      for (let x = 0; x < sourceWidth; x += 1) {
        const index = (y * sourceWidth + x) * 4;
        const luminance = Math.round((x / (sourceWidth - 1)) * 255);
        data[index] = luminance;
        data[index + 1] = luminance;
        data[index + 2] = luminance;
        data[index + 3] = 255;
      }
    }

    const settings: AsciiPatternSettings = {
      background: "#0A0C11",
      density: 100,
      ditherContrast: 2,
      ditherStrength: 1.6,
      ditherThreshold: 0.6,
      imageFormat: "png",
      imageResolution: "current",
      includeBackground: true,
      particleType: "cross",
      scale: 6,
      spacing: 0,
      speed: 0,
      videoDurationSeconds: 10,
      videoFormat: "mp4",
      videoResolution: "current",
      voids: 0,
    };
    const frame = createAsciiPatternFrame({
      height,
      includeBackground: true,
      progress: 0,
      settings,
      sourceSampler: {
        data,
        height: sourceHeight,
        luminanceHigh: 1,
        luminanceLow: 0,
        targetHeight: height,
        targetWidth: width,
        width: sourceWidth,
      },
      width,
    });
    const redChannels = frame.glyphs.map((glyph) =>
      Number.parseInt(glyph.color.slice(1, 3), 16),
    );
    const meanX = frame.glyphs.reduce((total, glyph) => total + glyph.x, 0) / frame.glyphs.length;
    const meanRed = redChannels.reduce((total, red) => total + red, 0) / redChannels.length;
    const covariance = frame.glyphs.reduce(
      (total, glyph, index) =>
        total + (glyph.x - meanX) * ((redChannels[index] ?? meanRed) - meanRed),
      0,
    );
    const xVariance = frame.glyphs.reduce(
      (total, glyph) => total + (glyph.x - meanX) ** 2,
      0,
    );
    const redVariance = redChannels.reduce(
      (total, red) => total + (red - meanRed) ** 2,
      0,
    );
    const correlation = covariance / Math.sqrt(xVariance * redVariance);

    expect(new Set(frame.glyphs.map((glyph) => glyph.size.toFixed(3))).size).toBe(1);
    expect(new Set(frame.glyphs.map((glyph) => glyph.color)).size).toBeGreaterThan(30);
    expect(Math.min(...redChannels)).toBeLessThan(60);
    expect(Math.max(...redChannels)).toBeGreaterThan(180);
    expect(correlation).toBeGreaterThan(0.98);
  });

  it("source image invert swaps light and dark dither output", () => {
    const sourceWidth = 64;
    const sourceHeight = 16;
    const width = 384;
    const height = 96;
    const data = new Uint8ClampedArray(sourceWidth * sourceHeight * 4);

    for (let y = 0; y < sourceHeight; y += 1) {
      for (let x = 0; x < sourceWidth; x += 1) {
        const index = (y * sourceWidth + x) * 4;
        const luminance = Math.round((x / (sourceWidth - 1)) * 255);
        data[index] = luminance;
        data[index + 1] = luminance;
        data[index + 2] = luminance;
        data[index + 3] = 255;
      }
    }

    const settings: AsciiPatternSettings = {
      background: "#0A0C11",
      density: 100,
      ditherContrast: 2,
      ditherStrength: 1.6,
      ditherThreshold: 0.6,
      imageFormat: "png",
      imageResolution: "current",
      includeBackground: true,
      particleType: "cross",
      scale: 6,
      spacing: 0,
      speed: 0,
      videoDurationSeconds: 10,
      videoFormat: "mp4",
      videoResolution: "current",
      voids: 0,
    };
    const createFrame = (invertLuminance: boolean) =>
      createAsciiPatternFrame({
        height,
        includeBackground: true,
        progress: 0,
        settings,
        sourceSampler: {
          data,
          height: sourceHeight,
          invertLuminance,
          luminanceHigh: 1,
          luminanceLow: 0,
          targetHeight: height,
          targetWidth: width,
          width: sourceWidth,
        },
        width,
      });
    const normalFrame = createFrame(false);
    const invertedFrame = createFrame(true);
    const normalMeanX =
      normalFrame.glyphs.reduce((total, glyph) => total + glyph.x, 0) /
      normalFrame.glyphs.length;
    const invertedMeanX =
      invertedFrame.glyphs.reduce((total, glyph) => total + glyph.x, 0) /
      invertedFrame.glyphs.length;

    expect(normalMeanX).toBeGreaterThan(width * 0.56);
    expect(invertedMeanX).toBeLessThan(width * 0.44);
    expect(invertedFrame.glyphs).not.toEqual(normalFrame.glyphs);
  });

  it("source video invert swaps light and dark dither output", () => {
    const enabledState = {
      values: { "source.image.invert": false, "source.video.invert": true },
    } as unknown as Parameters<typeof getAsciiSourceVideoInvert>[0];
    const disabledState = {
      values: { "source.image.invert": true, "source.video.invert": false },
    } as unknown as Parameters<typeof getAsciiSourceVideoInvert>[0];

    expect(getAsciiSourceVideoInvert(enabledState)).toBe(true);
    expect(getAsciiSourceVideoInvert(disabledState)).toBe(false);
  });

  it("reveals imported-media shadow detail between depth two and three", () => {
    const sourceWidth = 64;
    const sourceHeight = 16;
    const width = 384;
    const height = 96;
    const data = new Uint8ClampedArray(sourceWidth * sourceHeight * 4);

    for (let y = 0; y < sourceHeight; y += 1) {
      for (let x = 0; x < sourceWidth; x += 1) {
        const index = (y * sourceWidth + x) * 4;
        const normalizedShadow = 0.04 + (x / (sourceWidth - 1)) * 0.43;
        const luminance = Math.round(normalizedShadow * 255);
        data[index] = luminance;
        data[index + 1] = luminance;
        data[index + 2] = luminance;
        data[index + 3] = 255;
      }
    }

    const settings: AsciiPatternSettings = {
      background: "#0A0C11",
      density: 100,
      ditherContrast: 2,
      ditherStrength: 1.6,
      ditherThreshold: 0.6,
      imageFormat: "png",
      imageResolution: "current",
      includeBackground: true,
      particleType: "cross",
      scale: 6,
      spacing: 0,
      speed: 0,
      videoDurationSeconds: 10,
      videoFormat: "mp4",
      videoResolution: "current",
      voids: 0,
    };
    const sourceSampler = {
      data,
      height: sourceHeight,
      luminanceHigh: 1,
      luminanceLow: 0,
      targetHeight: height,
      targetWidth: width,
      width: sourceWidth,
    };
    const depthFrames = [0, 1, 2, 3].map((ditherContrast) =>
      createAsciiPatternFrame({
        height,
        includeBackground: true,
        progress: 0,
        settings: { ...settings, ditherContrast },
        sourceSampler,
        width,
      }),
    );
    const glyphCounts = depthFrames.map((frame) => frame.glyphs.length);
    const depthThreeFrame = depthFrames[3];

    expect(glyphCounts[1]).toBeGreaterThan(glyphCounts[0] ?? 0);
    expect(glyphCounts[2]).toBeGreaterThan(glyphCounts[1] ?? 0);
    expect(glyphCounts[3]).toBeGreaterThan(glyphCounts[2] ?? 0);
    expect(depthThreeFrame).toBeDefined();
    if (!depthThreeFrame) {
      throw new Error("Missing Depth 3 shadow-detail frame.");
    }
    expect(new Set(depthThreeFrame.glyphs.map((glyph) => glyph.color)).size).toBeGreaterThan(10);
    expect(new Set(depthThreeFrame.glyphs.map((glyph) => glyph.size.toFixed(3))).size).toBe(1);
  });

  it("uses playback timeline without keyframe behavior", () => {
    expect(appSchema.assembly.capabilities).toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).not.toContain("timeline.toggleControlKeyframes");
    expect(appSchema.assembly.commands).not.toContain("timeline.moveKeyframe");
  });

  it("declares product performance workload coverage", () => {
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.rendererStrategy).toBe("canvas-2d");
    expect(appPerformance.rendererWorkload).toBe("text-output");
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
    expect(appPerformance.workloadTargets).toEqual(
      expect.arrayContaining([
        "pattern.particleType",
        "pattern.scale",
        "pattern.spacing",
        "pattern.voids",
        "pattern.density",
        "dither.threshold",
        "export.image.resolution",
        "export.video.resolution",
        "canvas.renderScale",
      ]),
    );
  });

  it("backs every acceptance and performance matrix row with an automated app test name", () => {
    const acceptanceTestNames = appAcceptance.map((entry) => entry.automatedTestName);
    const performanceTestNames = appPerformance.scenarios.map(
      (scenario) => scenario.automatedTestName,
    );

    expect(acceptanceTestNames).toEqual(
      expect.arrayContaining([
        "source image upload clear reset and transforms update dither output",
        "source image invert swaps light and dark dither output",
        "source video upload clear reset and timeline frames update dither output",
        "source video invert swaps light and dark dither output",
        "particle type changes ASCII glyph output",
        "scale changes ASCII grid resolution",
        "spacing changes particle separation",
        "voids change organic empty zones",
        "density changes visible particle count",
        "speed changes timeline-driven field drift",
        "dither strength changes contrast",
        "dither depth changes particle scale and tone separation",
        "dither threshold changes particle cutoff",
        "background color changes preview and exports",
        "include background controls preview png alpha and video background",
        "image format changes exported file type",
        "image resolution changes exported dimensions",
        "video format exports recorder and optimized GIF output",
        "video resolution changes encoder dimensions",
        "video duration sets exported animation length",
        "exports svg image and animated video output",
        "timeline playback controls deterministic ASCII loop",
        "resolution scale changes preview backing pixels",
        "persistence reload restores edited ASCII settings",
        "second video reference defines dense bright default field",
        "video reference motif maps to generated ASCII renderer",
        "video reference motion maps to timeline loop",
      ]),
    );

    expect(performanceTestNames).toEqual(
      expect.arrayContaining([
        "source image import prepares dither sampler within budget",
        "source image invert toggle stays responsive",
        "source video import prepares dither sampler within budget",
        "source video invert toggle stays responsive",
        "source video playback follows decoded frames without stutter",
        "density control drag remains responsive under heavy ASCII load",
        "scale control drag remains responsive under dense ASCII load",
        "spacing control drag remains responsive under dense ASCII load",
        "voids control drag remains responsive under dense ASCII load",
        "threshold control drag remains responsive under heavy ASCII load",
        "resolution scale drag preserves backing pixels and responsiveness",
        "heavy ASCII animation frame budget stays smooth",
        "animated viewport drag coalesces heavy ASCII work",
        "viewport zoom stress avoids recomputing ASCII field",
        "short video export completes within budget",
        "optimized GIF export completes within budget",
        "particle type select changes glyph family within budget",
        "speed drag keeps timeline preview responsive",
        "dither strength drag keeps preview responsive",
        "depth drag keeps preview responsive",
        "include background toggle stays responsive",
        "background color change stays responsive",
        "image format select stays responsive",
        "image resolution select records heavy export range",
        "video format select stays responsive",
        "video duration select stays responsive",
        "video resolution select records encoder workload range",
        "heavy preview render completes within budget",
        "viewport stays stable after product controls",
      ]),
    );
  });
});
