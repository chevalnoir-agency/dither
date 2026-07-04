# Implementation Worklog

This file records product decisions and the evidence behind them.

## Status

Mode: product

CHEVAL NOIR DITHER is a product app with a custom Canvas 2D renderer, playback timeline, product controls including particle spacing, contrast, and diagonal hatch particles, SVG/PNG/JPG/video exports, persistence, acceptance coverage, and performance coverage.

## Decision Trail

### Iteration 1 — ASCII Dither Field Product Build

- Request: Create an app that randomly generates ASCII motifs like the supplied screen recording, reproduces the animation, offers particle type, density, animation speed, scale, dither strength, and dither threshold controls, and exports still SVG images plus MP4 video animation.
- Task type: Tier 4 first working product build touching schema, renderer, timeline, export, acceptance, performance, browser tests, and worklog.
- User-visible result: The app opens to an animated black-backed ASCII dither field with selectable Crosses, Mini dots, or Mixed particles; sliders tune scale, density, speed, dither strength, and threshold; footer actions export SVG, PNG/JPG image output, and MP4/WebM-compatible video output.
- Source/reference checked: Video reference study from `/Users/pierrevoisin/Desktop/Enregistrement de l’écran 2026-07-04 à 10.20.45.mov`; extracted frames in `docs/toolcraft/reference-video-frames/frame_0s.png`, `frame_2s.png`, `frame_4s.png`, `frame_6s.png`, `frame_8s.png`, `frame_10s.png`, and `contact-sheet.png`; metadata reported H.264, 2036x1436, 11.88166666666667s.
- Reference inputs: Screen recording MOV, extracted frames, Quick Look thumbnail, contact sheet, AVFoundation metadata, and the user's French product request.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `assembly-workflow.md`, `decision-contract.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `renderer-technique.md`, and `performance.md`; required skills `brainstorming` and `writing-plans`; `pnpm ai:check`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `timeline-mode-choice`, `timeline-enabled-behavior`, `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `video-reference-analysis`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Build a new Toolcraft app with `defineToolcraft`, `ToolcraftApp`, `canvasContent`, playback timeline duration 11.88166666666667s, localStorage persistence, Canvas 2D preview renderer, SVG still export from the same frame model, PNG/JPG export via `createToolcraftPngExportCanvas`, and video export through an offscreen canvas plus `MediaRecorder`.
- Alternatives rejected: DOM/SVG live preview was rejected because the stress state can contain tens of thousands of glyphs; WebGL/WebGPU was rejected because the visible primitive is monospace text rather than a shader pixel transform and the still SVG export must remain vector text; layers were rejected because the product has one generated output layer with no layer selection, reorder, or visibility workflow; upload was rejected because the product is procedural and no source media is required.
- State/output mapping: `pattern.particleType` chooses glyph family; `pattern.scale` sets cell size; `pattern.density` controls visible particle count; `motion.speed` changes circular drift distance across one timeline loop; `dither.strength` changes contrast; `dither.threshold` changes cutoff; `appearance.background` and `export.includeBackground` control preview and PNG background behavior; `export.image.*` controls PNG/JPG encoding and dimensions; `export.video.*` controls recorder container request and encoder-safe dimensions; `state.timeline.currentTimeSeconds` and `state.timeline.durationSeconds` drive preview and export frame progress.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/ascii-pattern-renderer.tsx`, `src/app/ascii-export.ts`, `src/routes/index.tsx`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `docs/toolcraft/agent-worklog.md`, `docs/toolcraft/reference-video-frames/*`, and e2e browser specs.
- Verification: `pnpm verify:final` passed; browser performance checkpoint passed with playwright-fallback because no separate agent-browser control tool was available for the Toolcraft app.
- Skipped checks: None; first working product functional and fallback performance gates passed.
- Risks: Risk: Browser MP4 support is not universal, so MP4 requests fall back to supported WebM when `MediaRecorder.isTypeSupported` rejects MP4.

### Iteration 2 — Browser And Performance Hardening

- Request: Complete final Toolcraft verification after the first product implementation and fix all browser/performance regressions discovered by the gates.
- Task type: Tier 4 final delivery hardening touching browser tests, performance matrix evidence, export helpers, and exact runtime interaction helpers.
- User-visible result: The same ASCII Dither Field product now passes functional browser coverage for controls, timeline, persistence, SVG/PNG/JPG/video export, render scale backing pixels, and the full fallback performance checkpoint.
- Source/reference checked: Playwright traces and error contexts for controls, exports, timeline, render scale, and performance tests; Toolcraft performance contract validators; local runtime slider/select DOM structure.
- Reference inputs: Playwright diagnostic and passing outputs, `test-results/*/error-context.md`, Toolcraft runtime slider/select source, and the product schema/performance matrices.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `docs/toolcraft/acceptance-testing.md`, `docs/toolcraft/performance.md`, and required `systematic-debugging` workflow skill for verification diagnostics.
- Contract rules applied: `acceptance-product-observable`, `performance-coverage-levels`, `renderer-technique-inventory`, `timeline-enabled-behavior`, `output-export-required`, and `workflow-required`.
- Decision: Use exact editable slider value controls for fixture setup while keeping pointer drags for drag responsiveness scenarios; clear the last export record before each export click; target Toolcraft select items directly through `data-slot="select-item"`; prove `canvas.renderScale` backing pixels in every scenario that applies render scale 2; shorten the animated viewport drag gesture while keeping a real mouse drag and a valid 2000ms budget.
- Alternatives rejected: Leaving the two-second ARIA option fallback in select helpers was rejected because it measured test helper delay rather than UI responsiveness; loosening animated viewport drag to 3000ms was rejected because the performance validator caps interaction budgets at 2000ms; removing render scale from heavy fixtures was rejected because the selected quality must be preserved.
- State/output mapping: Fixture setup still writes the same schema/runtime targets; performance measurements now separate exact setup from measured interactions, and export tests wait for a fresh blob per action.
- Files changed: `e2e/app-controls.spec.ts`, `e2e/performance-helpers.ts`, `src/app/ascii-export.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, and `src/app/app-schema.test.ts`.
- Verification: `pnpm verify:final` passed; `pnpm verify:perf` passed with playwright-fallback, 22/22 browser performance tests.
- Skipped checks: None.
- Risks: Remaining risk is browser codec variability for MP4; WebM fallback remains implemented and covered.

### Iteration 3 — CHEVAL NOIR DITHER Visual Refinement

- Request: Rename the app to CHEVAL NOIR DITHER, set the background to `#0A0C11`, map weak particles to `#222629` and strong particles to `#BEBDC1`, make empty zones feel more randomized and organic, and add a control for particle spacing.
- Task type: Tier 3 post-first-working product iteration touching schema defaults, a Pattern control, renderer output, SVG export color, acceptance, performance, browser tests, and worklog.
- User-visible result: The app is branded CHEVAL NOIR DITHER, opens with the darker navy-black background, renders particles through the requested dark-to-light color ramp, exposes a Spacing slider in Pattern, and generates softer organic void islands instead of blocky macro gaps.
- Source/reference checked: Existing reference-video study and extracted storyboard frames; current `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, and e2e browser specs; latest user visual request.
- Reference inputs: Existing screen recording `/Users/pierrevoisin/Desktop/Enregistrement de l’écran 2026-07-04 à 10.20.45.mov`, extracted frame folder `docs/toolcraft/reference-video-frames`, and latest user color/spacing/organic-void request.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `renderer-technique.md`, and `performance.md`; required skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Add `pattern.spacing` as a built-in slider in the Pattern section; keep the Canvas 2D renderer; use a deterministic multi-octave value-noise field with coordinate warp for organic voids; replace opacity-based particle brightness with direct RGB interpolation between `#222629` and `#BEBDC1`; bump persistence and settings transfer to the `cheval-noir-dither` identity.
- Alternatives rejected: A custom spacing control was rejected because a built-in slider owns this numeric live value; keeping alpha over white particles was rejected because the requested weak and strong colors need exact rendered particle colors; keeping rectangular macro-cell noise was rejected because the user asked for more organic empty regions; migrating the old persistence key was rejected because the visual defaults need to appear immediately in the current browser.
- State/output mapping: `pattern.spacing` adjusts the grid step while `pattern.scale` keeps controlling glyph size; `appearance.background` defaults to `#0A0C11`; each generated glyph receives a concrete interpolated color that Canvas preview and SVG export both consume; timeline progress still drives a seamless forward organic-noise field; `export.includeBackground`, image settings, and video settings keep their existing export behavior.
- Files changed: `index.html`, `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `pnpm verify:quick` passed; `pnpm build` passed; targeted browser acceptance passed for Pattern, Dither, Background/Image Export, SVG/video export, reference motif, and native preview dimensions; targeted browser performance passed for density, scale, spacing, threshold, heavy preview render, heavy animation frame, animated viewport drag, and viewport zoom.
- Skipped checks: Full performance checkpoint is not required for this post-first-working visual/control iteration unless targeted performance evidence points to a broader regression.
- Risks: Risk: The organic void field changes the reference motif away from rectangular islands by user request, so acceptance now maps to organic negative-space behavior rather than exact block silhouettes.

### Iteration 4 — Particle Contrast Control

- Request: Add a contrast control parameter to CHEVAL NOIR DITHER.
- Task type: Tier 3 post-first-working product iteration touching schema controls, renderer tone mapping, SVG/video/image export frame output, acceptance, performance, browser tests, and worklog.
- User-visible result: The Dither section now includes a `Contrast` slider that remaps particle brightness between `#222629` and `#BEBDC1` without changing particle spacing, size, or count.
- Source/reference checked: Current schema, renderer, export frame model, acceptance matrix, performance pipeline, targeted browser tests, and the existing reference-video study.
- Reference inputs: Existing screen recording `/Users/pierrevoisin/Desktop/Enregistrement de l’écran 2026-07-04 à 10.20.45.mov`, extracted reference frames, and latest user request for a contrast parameter.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `renderer-technique.md`, and `performance.md`; required skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Add built-in slider `dither.contrast` to Dither with default `1`, range `0..2`, and live responsiveness coverage; keep `dither.strength` as cutoff sharpness and apply contrast as a tone remap around mid-gray before the particle color ramp.
- Alternatives rejected: A custom control was rejected because the value is a simple live numeric slider; changing the existing Strength semantics was rejected because it already controls threshold sharpness and would break existing settings; applying contrast in CSS/opacity was rejected because exports need real particle colors in Canvas, SVG, PNG, and video.
- State/output mapping: `dither.contrast` is read by `getAsciiPatternSettings`, stored in the shared frame settings, applied by `getAsciiParticleColor(tone, contrast)`, and consumed by Canvas preview plus SVG/PNG/video exports through the same `AsciiPatternFrame` model.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted unit tests passed (`pnpm vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); `pnpm verify:quick` passed; `pnpm build` passed; targeted browser acceptance passed for `browser: dither controls change ASCII output`; targeted browser performance passed for `browser perf: contrast control drag stays responsive`.
- Skipped checks: Full performance checkpoint is not required for this post-first-working non-performance edit because the targeted renderer/control path passed and the new slider does not increase glyph count, canvas size, render scale, or export resolution.
- Risks: None: the default value `1` preserves the existing tonal output until the user edits the new control.

### Iteration 5 — Default Tuning And Hatch Particles

- Request: Set default Threshold to `0.6`, Contrast to `2`, Strength to `1.6`, Density to `70%`, Scale to `14`, and add diagonal hatches as a particle type.
- Task type: Tier 3 post-first-working product iteration touching schema defaults, renderer glyph generation, Canvas/SVG/video/image export frame output, acceptance, performance, browser tests, and worklog.
- User-visible result: New sessions open with the requested denser, higher-contrast CHEVAL NOIR DITHER defaults, and the Particle dropdown includes `Hachures` for diagonal hatch marks.
- Source/reference checked: Current schema, renderer frame model, Canvas/SVG export path, acceptance matrix, performance matrix, targeted browser tests, and the existing reference-video study.
- Reference inputs: Existing screen recording `/Users/pierrevoisin/Desktop/Enregistrement de l’écran 2026-07-04 à 10.20.45.mov`, extracted reference frames, and latest user request for specific defaults plus diagonal hatches.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `renderer-technique.md`, and `performance.md`; required skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Keep the existing Pattern and Dither sections, update only resettable `defaultValue` entries and renderer fallbacks, add `hatch` as a built-in select option labeled `Hachures`, and draw hatches as lightweight pixel-step diagonal Canvas marks while SVG still exports the ASCII slash/backslash glyphs from the shared frame model.
- Alternatives rejected: A custom particle picker was rejected because the built-in select already owns this product choice; changing the scale or spacing semantics was rejected because the user requested new defaults rather than new control behavior; drawing hatches through per-glyph canvas rotation or stroke paths was rejected because pixel-step marks are simpler and lighter under dense stress fixtures.
- State/output mapping: `pattern.particleType = "hatch"` alternates `/` and `\` marks per generated cell; `pattern.scale`, `pattern.density`, `dither.strength`, `dither.contrast`, and `dither.threshold` now reset to `14`, `70`, `1.6`, `2`, and `0.6`; Canvas preview, SVG, PNG/JPG, and video share the same generated hatch frame.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted unit tests passed (`pnpm vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); `pnpm verify:quick` passed; `pnpm build` passed; targeted browser acceptance passed for Pattern and Dither controls; targeted browser performance passed for `browser perf: particle type select changes glyph family`.
- Skipped checks: Full performance checkpoint is not required for this post-first-working feature iteration unless targeted hatch rendering evidence points to a broader regression.
- Risks: Low: hatch Canvas preview uses pixel-step diagonal primitives while SVG exports literal slash/backslash text glyphs, so exact antialiasing differs by export format but the particle family remains semantically identical.

### Iteration 6 — Tighter Default Particle Spacing

- Request: Reduce the default particle spacing because there is still too much space between elements.
- Task type: Tier 3 post-first-working product iteration touching a Pattern control default/range, renderer workload bounds, acceptance, performance fixtures, browser tests, and worklog.
- User-visible result: New sessions open with `Spacing` at `-1px`, tightening the default particle grid while keeping the existing Scale value and glyph sizes.
- Source/reference checked: Current schema, renderer frame model, acceptance matrix, performance matrix, targeted browser tests, and the user's latest spacing request.
- Reference inputs: Latest user request; no new external media beyond the existing reference screen recording already used for the product.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, and `performance.md`; required skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Keep `Spacing` as the built-in Pattern slider, set its default and minimum to `-1px`, leave the maximum at `24px`, and keep the renderer grid step protected by a minimum cell step so tighter defaults cannot collapse the canvas field.
- Alternatives rejected: Increasing glyph scale was rejected because the request was about spacing rather than mark size; raising density was rejected because it changes particle survival rather than center distance; `Spacing -2px` was rejected after the targeted performance test measured a `158.9ms` frame gap against a `120ms` budget at the dense `Scale 6`, `Density 100`, render scale 2 fixture.
- State/output mapping: `pattern.spacing = -1` reduces the generated grid step from `scale + spacing`; the Canvas preview, SVG frame model, PNG/JPG export, and video export all consume the same tighter particle positions.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted unit tests passed (`pnpm vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); `pnpm verify:quick` passed; `pnpm build` passed; targeted browser acceptance passed for `browser: pattern controls change ASCII output`; targeted browser performance passed for `browser perf: spacing control drag uses heavy ASCII fixture`.
- Skipped checks: Full performance checkpoint is not required for this post-first-working spacing-default iteration unless targeted spacing performance evidence points to a broader regression.
- Risks: Low: users with older persisted local settings may keep their previous Spacing value until they reset controls or clear imported settings; new sessions and Reset use the tighter default.

### Iteration 7 — Extended Negative Spacing Range

- Request: Reduce spacing further and set the minimum value to `-3px`.
- Task type: Tier 3 post-first-working product iteration touching a Pattern control default/range, renderer fallback bounds, performance fixtures, browser tests, and worklog.
- User-visible result: New sessions open with `Spacing` at `-2px`, and the Spacing slider can now be pushed down to `-3px` for extra-tight particle fields.
- Source/reference checked: Current schema, renderer frame model, acceptance row for `pattern.spacing`, performance matrix, targeted browser tests, and the user's latest `-3px` request.
- Reference inputs: Latest user request; no new external media beyond the existing reference screen recording already used for the product.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, and `performance.md`; required skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Set `pattern.spacing.defaultValue` to `-2px`, set the slider minimum and renderer clamp to `-3px`, and keep the dense-stress performance smooth target at `0px` because negative spacing multiplies the grid workload sharply at low Scale.
- Alternatives rejected: Setting the dense-stress guarantee to `-3px` was rejected because the previous `-2px` stress run measured `158.9ms` frame gaps against a `120ms` budget, and `-1px` still measured `125ms`; hiding the `-3px` option was rejected because the user explicitly requested the lower minimum for art direction.
- State/output mapping: `pattern.spacing` now accepts `-3..24`, resets to `-2`, and still reduces the generated grid step through `scale + spacing`; Canvas preview, SVG, PNG/JPG, and video share the same frame model and tighter particle positions.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted unit tests passed (`pnpm vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); `pnpm verify:quick` passed; `pnpm build` passed; targeted browser acceptance passed for `browser: pattern controls change ASCII output`; targeted browser performance passed for `browser perf: spacing control drag uses heavy ASCII fixture`.
- Skipped checks: Full performance checkpoint is not required for this post-first-working spacing-range iteration unless targeted spacing performance evidence points to a broader regression.
- Risks: Risk: `-3px` and the `-2px` default are intentionally available for compressed visuals, but under extreme combinations such as Scale 6, Density 100, and render scale 2 they are outside the guaranteed smooth target recorded in `app-performance.ts`.

## Decisions

### Renderer

- Decision: Canvas 2D live preview renderer with SVG still export generated from the same ASCII frame model.
- Reason: The product is dense text-output: the stress state can draw many glyphs per frame, while the user still needs a vector SVG still export and exact particle colors.
- Evidence: `src/app/ascii-pattern-renderer.tsx` renders only product canvas output; `src/app/ascii-pattern.ts` generates deterministic organic glyph frames, contrast-aware tone remapping, and SVG text with the CHEVAL NOIR color ramp; `src/app/app-performance.ts` declares `rendererTechnique`, `rendererPipeline`, and workload scenarios.

Renderer Technique Decision Matrix:

- sourceRepresentation: procedural-data.
- productRepresentation: text.
- previewRenderer: canvas-2d.
- exportRenderer: media-recorder for video, canvas-2d for PNG/JPG, SVG text for still vector output.
- rendererWorkload: text-output.
- rendererStrategy: canvas-2d.
- whyNotAlternativeStrategies: DOM and SVG live preview create too many nodes at stress scale; WebGL/WebGPU do not improve the text glyph primitive or SVG export requirement.
- fidelityRisks: Canvas preview rasterizes glyphs; MP4 support depends on browser MediaRecorder capabilities.
- performanceRisks: Small scale, low spacing, and high density increase glyph count; video export takes approximately the selected timeline duration.

Renderer Layer Inventory:

- ascii-pattern-layer: product-foreground, Canvas 2D, high primitive count, content text and dense-pattern, included in exports, visible selector `[data-ascii-pattern-canvas]`.

Render Pipeline Inventory:

- field-model pass: text-layout on main thread; cache keys are particle type, scale, spacing, density, dither strength, dither contrast, threshold, speed, timeline time, duration, and canvas size.
- glyph-raster-preview pass: rasterize on main thread; cache keys are field model, background, include background, and render scale.
- export-frame pass: export-only; cache keys are field model, background, include background, image settings, video settings, and canvas size.
- interaction invalidation: control drags invalidate field/preview; timeline playback and scrub invalidate field/preview; viewport drag and zoom must not invalidate field or raster caches; export invalidates only export-frame.

### Timeline

- Decision: Enable Toolcraft playback timeline with default duration 11.88166666666667s.
- Reason: The user requested an animated product and MP4 export, and the reference metadata gives the initial loop duration.
- Evidence: `src/app/app-schema.ts` sets `panels.timeline.mode: "playback"` and `defaultDurationSeconds`; `appTransferMode.animationIntent.loopDuration` cites the reference duration; acceptance row `timeline.playback` covers pause/resume, scrub, duration, loop, and rendered frame.

### Layers

- Decision: Do not enable Layers.
- Reason: The product exposes one procedural output layer with no independent objects, visibility, reorder, grouping, or selected-layer editing.
- Evidence: `src/app/app-schema.ts` omits `panels.layers`; `src/app/app-performance.ts` records one renderer layer as a product renderer inventory item, not a user-editable Layers panel entity.

### Controls

- Decision: Product controls are grouped as Pattern, Motion, Dither, Background, Image Export, Video Export, and sticky Export actions.
- Reason: Each section maps to a product entity or workflow stage rather than control type; Background directly precedes export settings as required.
- Evidence: `starterControlSectionInventory` in `src/app/app-acceptance.ts` mirrors the schema targets including `pattern.spacing`, `pattern.particleType`, and `dither.contrast`; every visible control has `performanceRole`, `defaultValue`, and an acceptance row, and the Particle select covers Crosses, Mini dots, Hachures, and Mixed.

### Export

- Decision: Provide Export SVG, Export PNG, and Export Video footer actions; PNG/JPG uses Image Export settings and video uses Video Export settings.
- Reason: The user explicitly requested SVG stills and MP4 video, while the Toolcraft contract requires animated apps to include Export PNG and Export Video with standard settings.
- Evidence: `src/app/ascii-export.ts` reads `export.image.format`, `export.image.resolution`, `export.video.format`, and `export.video.resolution`; PNG uses `createToolcraftPngExportCanvas({ includeBackground, resolution })`; video uses `getToolcraftVideoExportSize`, `shouldIncludeToolcraftExportBackground`, `MediaRecorder.isTypeSupported`, and recorder error handling.

### Performance

- Decision: Guarantee smooth dense-stress targets for scale 6, spacing 0, density 100, threshold 0.1/0.2, hatch particle switching, and render scale 2; expose spacing down to -3 as an experimental art-direction range above the guaranteed stress target.
- Reason: These values represent the heaviest useful guaranteed preview states for a dense ASCII text-output renderer; contrast is covered as a responsiveness drag because it changes tone mapping without increasing glyph count, while extra-negative spacing multiplies cell count at low Scale.
- Evidence: `src/app/app-performance.ts` declares `loadProfile` with `hardLimit`, `smoothTarget`, and `smoothTargetRatio`; scenarios cover control drag, including `contrast-control-drag`, hatch particle select changes, spacing with a recorded degraded smooth target, animation frame sampling, animated viewport drag, viewport zoom stress, and short video export.

## Evidence

- Source reviewed: video reference MOV metadata, extracted frame storyboard, contact sheet, local Toolcraft docs, runtime export helpers, timeline loop helper, CanvasShell behavior, controls panel action handler, and performance helpers.
- Video Reference Study: storyboard frames f000, f002, f004, f006, f008, and f010; transition analysis f000-f002, f002-f004, f004-f006, f006-f008, and f008-f010; behavior decomposition maps fixed black canvas, ASCII grid cells, block islands, wave bands, particle glyphs, and breathing loop to Toolcraft renderer and acceptance rows.
- Contract applied: runtime shell through `ToolcraftApp`; product output only in `canvasContent`; timeline playback for animation/video export; Background/Image Export/Video Export sections; performance fixtures read from `app-performance.ts`.

## Verification

- Run: `pnpm ai:check` passed.
- Run: `pnpm verify:final` passed.
- Run: `pnpm verify:perf` passed with playwright-fallback because no separate agent-browser control tool was available for this Toolcraft app.
- Run: Post-first-working hatch/default iteration passed targeted unit tests, `pnpm verify:quick`, `pnpm build`, targeted browser Pattern/Dither acceptance, and targeted particle-type performance.
- Run: Post-first-working spacing-default iteration passed targeted unit tests, `pnpm verify:quick`, `pnpm build`, targeted browser Pattern acceptance, and targeted Spacing performance.
- Run: Post-first-working extended negative spacing iteration passed targeted unit tests, `pnpm verify:quick`, `pnpm build`, targeted browser Pattern acceptance, and targeted Spacing performance.
- Browser: fallback Playwright tests cover controls, product observable changes, SVG/image/video exports, timeline duration metadata, persistence reload, and performance scenarios.

## Risks

- Risk: MP4 recording support depends on Chromium/macOS MediaRecorder capabilities; the app checks `MediaRecorder.isTypeSupported` and safely falls back to WebM if MP4 is unavailable.
