# ASCII Dither Field Spec

## Renderer Technique Decision Matrix

- sourceRepresentation: procedural-data.
- productRepresentation: text.
- previewRenderer: canvas-2d.
- exportRenderer: media-recorder for video, canvas-2d for PNG/JPG, SVG text for still vector export.
- rendererWorkload: text-output.
- rendererStrategy: canvas-2d.
- whyNotAlternativeStrategies: DOM and SVG live preview were rejected as alternatives because stress states create thousands of glyph primitives; WebGL/WebGPU were rejected because the product-quality export requirement includes SVG text/vector stills, not only pixel-output shader frames.
- fidelityRisks: Canvas preview rasterizes glyphs while SVG export preserves vector text; MP4 support depends on browser MediaRecorder support.
- performanceRisks: Small cell scale, high density, low threshold, and renderScale 2 create the heaviest preview and export workload.

## Renderer Layer Inventory

- backgroundLayer: schema-controlled via `appearance.background` and `export.includeBackground`; included in video export and optional for live preview/PNG.
- productForegroundLayer: `ascii-pattern-layer`, Canvas 2D text-output primitive field, selector `[data-ascii-pattern-canvas]`, included in all exports.
- editingHandlesLayer: none; the product has no draggable product handles.
- exportComposite: SVG still export uses text/vector nodes; PNG/JPG and video compose background plus productForegroundLayer at the selected output size.

## Render Pipeline Inventory

- field-model pass: builds deterministic text-layout data on the main thread. Cache keys are particle type, scale, density, dither strength, dither threshold, speed, timeline time, duration, and canvas size.
- glyph-raster-preview pass: rasterizes the text-output frame in Canvas 2D. Cache keys are field model, background, include background, and render scale.
- export-frame pass: renders current still SVG/PNG/JPG and sequential video frames. Cache keys are field model, background, image settings, video settings, timeline duration, and canvas size.
- interaction invalidation: control-drag and timeline-playback/scrub invalidate field and preview; viewport-drag and viewport-zoom do not change field data; export-copy invalidates only export-frame output.

## Export And Copy Decision

SVG remains the product-quality still export for vector text. PNG/JPG uses the standard image export helper and selected resolution. Video export uses the standard Toolcraft video size helper and MediaRecorder capability checks, falling back from MP4 to WebM when the browser cannot record MP4.
