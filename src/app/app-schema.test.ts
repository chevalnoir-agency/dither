import { describe, expect, it } from "vitest";

import { appAcceptance } from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import {
  ASCII_PARTICLE_HIGH_COLOR,
  ASCII_PARTICLE_LOW_COLOR,
  getAsciiParticleColor,
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
    const patternSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Pattern",
    );
    const backgroundSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Background",
    );
    const ditherSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Dither",
    );

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
      defaultValue: 0,
      label: "Spacing",
      max: 24,
      min: 0,
      step: 1,
      target: "pattern.spacing",
      type: "slider",
      unit: "px",
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
      label: "Contrast",
      max: 2,
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
    expect(getAsciiParticleColor(0.35, 0)).toBe(getAsciiParticleColor(0.5, 1));
    expect(getAsciiParticleColor(0.35, 2)).not.toBe(getAsciiParticleColor(0.35, 1));
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
        "particle type changes ASCII glyph output",
        "scale changes ASCII grid resolution",
        "spacing changes particle separation",
        "density changes visible particle count",
        "speed changes timeline-driven field drift",
        "dither strength changes contrast",
        "dither contrast changes particle tone range",
        "dither threshold changes particle cutoff",
        "background color changes preview and exports",
        "include background controls preview png alpha and video background",
        "image format changes exported file type",
        "image resolution changes exported dimensions",
        "video format selects supported recorder container",
        "video resolution changes encoder dimensions",
        "exports svg image and animated video output",
        "timeline playback controls deterministic ASCII loop",
        "resolution scale changes preview backing pixels",
        "persistence reload restores edited ASCII settings",
        "video reference motif maps to generated ASCII renderer",
        "video reference motion maps to timeline loop",
      ]),
    );

    expect(performanceTestNames).toEqual(
      expect.arrayContaining([
        "density control drag remains responsive under heavy ASCII load",
        "scale control drag remains responsive under dense ASCII load",
        "spacing control drag remains responsive under dense ASCII load",
        "threshold control drag remains responsive under heavy ASCII load",
        "resolution scale drag preserves backing pixels and responsiveness",
        "heavy ASCII animation frame budget stays smooth",
        "animated viewport drag coalesces heavy ASCII work",
        "viewport zoom stress avoids recomputing ASCII field",
        "short video export completes within budget",
        "particle type select changes glyph family within budget",
        "speed drag keeps timeline preview responsive",
        "dither strength drag keeps preview responsive",
        "contrast drag keeps preview responsive",
        "include background toggle stays responsive",
        "background color change stays responsive",
        "image format select stays responsive",
        "image resolution select records heavy export range",
        "video format select stays responsive",
        "video resolution select records encoder workload range",
        "heavy preview render completes within budget",
        "viewport stays stable after product controls",
      ]),
    );
  });
});
