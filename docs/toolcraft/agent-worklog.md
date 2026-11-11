# Implementation Worklog

This file records product decisions and the evidence behind them.

## Status

Mode: product

CHEVAL NOIR DITHER is a product app with a custom Canvas 2D renderer, optional source-image and source-video upload, playback timeline, product controls including particle spacing, organic void control, contrast, and diagonal hatch particles, SVG/PNG/JPG/video exports, persistence, acceptance coverage, and performance coverage.

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
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
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

### Iteration 8 — Organic Void Control

- Request: Add a control parameter for managing random empty zones in the canvas so the user can create random void areas.
- Task type: Tier 3 post-first-working product iteration touching a Pattern control, renderer mask generation, Canvas/SVG/PNG/video frame output, acceptance, performance fixtures, browser tests, and worklog.
- User-visible result: The Pattern section includes a `Voids` slider from `0` to `2`; `0` fills more of the particle field, `1` preserves the existing organic void behavior, and `2` carves stronger random organic empty zones.
- Source/reference checked: Current schema, renderer frame model, acceptance matrix, performance matrix, targeted browser tests, existing reference-video study, and the user's latest void-control request.
- Reference inputs: Latest user request; no new external media beyond the existing reference screen recording already used for the product.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `renderer-technique.md`, and `performance.md`; required skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `output-export-required`, and `workflow-required`.
- Decision: Add built-in slider `pattern.voids` to Pattern with default `1`, range `0..2`, and step `0.05`; feed it into the deterministic organic void field by shifting and scaling the existing multi-octave noise mask so preview and every export share the same frame model.
- Alternatives rejected: A custom random-zone editor was rejected because the current request is a single numeric intensity control; a separate random seed control was rejected because the product already produces deterministic random-looking fields for matching preview and exports; changing Density or Threshold was rejected because those controls affect particle survival globally rather than carving organic empty islands.
- State/output mapping: `pattern.voids` is read by `getAsciiPatternSettings`, stored in `AsciiPatternSettings`, applied inside `createAsciiPatternFrame` to the organic void mask, and consumed by Canvas preview, SVG text export, PNG/JPG export, and video export through the shared `AsciiPatternFrame`.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted unit tests passed (`pnpm vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); `pnpm verify:quick` passed; `pnpm build` passed; targeted browser acceptance passed for `browser: pattern controls change ASCII output`; targeted browser performance passed for `browser perf: voids control drag uses heavy ASCII fixture`.
- Skipped checks: Full performance checkpoint is not required for this post-first-working void-control iteration because the targeted renderer/control path passed and the first working product checkpoint already passed.
- Risks: Risk: Pushing `Voids` to `0` intentionally reduces organic gaps and can make dense low-scale scenes heavier, so `pattern.voids` is listed as a workload target with its own heavy drag scenario.

### Iteration 9 — Extended Voids Range

- Request: Extend the `Voids` control maximum to `5`.
- Task type: Tier 3 post-first-working product iteration touching a Pattern control range, renderer clamp, acceptance/browser test coverage, performance metadata, and worklog.
- User-visible result: The Pattern `Voids` slider now spans `0..5`, giving stronger high-end organic empty-zone carving while preserving default `1`.
- Source/reference checked: Current schema, renderer settings clamp, browser Pattern control test, performance matrix, and the user's latest range request.
- Reference inputs: Latest user request; no new external media beyond the existing reference screen recording already used for the product.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, and `performance.md`; required skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Keep `pattern.voids` as the same built-in continuous slider, change its schema maximum and renderer clamp from `2` to `5`, and keep the dense performance stress target at `0` because lower Voids remains the heaviest visible particle case.
- Alternatives rejected: Adding a second “extreme voids” mode was rejected because the request is a direct range extension; changing the default from `1` was rejected because the user asked only for the maximum; moving the perf stress to `5` was rejected because high Voids removes more glyphs rather than increasing renderer load.
- State/output mapping: `pattern.voids` values up to `5` flow through `getAsciiPatternSettings` into `createAsciiPatternFrame`, where the organic void mask shifts and scales empty regions for Canvas preview, SVG, PNG/JPG, and video export.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-schema.test.ts`, `src/app/app-performance.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted unit tests passed (`pnpm vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); `pnpm verify:quick` passed; `pnpm build` passed; targeted browser acceptance passed for `browser: pattern controls change ASCII output`.
- Skipped checks: Targeted Voids performance is unchanged for this range extension because the workload stress remains `Voids = 0`; full performance checkpoint is not required for this post-first-working non-performance edit.
- Risks: None: the default value and densest workload case stay unchanged.

### Iteration 10 — Extended Spacing Minimum To -8

- Request: Reduce the Spacing control minimum from `-3px` to `-8px`.
- Task type: Tier 3 post-first-working product iteration touching a Pattern control range, renderer fallback bounds, browser acceptance coverage, performance metadata, and worklog.
- User-visible result: The Pattern `Spacing` slider now spans `-8px..24px`, while the default remains `-2px` so new sessions keep the current tighter look and users gain an extra-compressed range.
- Source/reference checked: Current schema, renderer grid-step clamp, acceptance row for `pattern.spacing`, browser Pattern control test, performance matrix, and the user's latest spacing-range request.
- Reference inputs: Latest user request; no new external media beyond the existing reference screen recording already used for the product.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `renderer-technique.md`, and `performance.md`; required skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Keep `pattern.spacing` as the same built-in continuous slider, change its schema minimum and renderer clamp from `-3` to `-8`, and keep the dense-stress smooth target at `0` because measured lower negative values already exceed the guaranteed dense preview budget.
- Alternatives rejected: Changing the default from `-2px` was rejected because the request is a range extension; guaranteeing `-8px` under the dense stress fixture was rejected because previous `-2px` and `-1px` evidence already showed the smooth target should remain `0px`; changing Scale semantics was rejected because Spacing should affect center distance without enlarging glyph marks.
- State/output mapping: `pattern.spacing` values down to `-8` flow through `getAsciiPatternSettings` into `createAsciiPatternFrame`, where `gridStep = Math.max(3, scale + spacing)` controls particle-center distance for Canvas preview, SVG, PNG/JPG, and video export.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted unit tests passed (`pnpm vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); `pnpm verify:quick` passed; `pnpm build` passed; targeted browser acceptance passed for `browser: pattern controls change ASCII output`; targeted browser performance passed for `browser perf: spacing control drag uses heavy ASCII fixture`.
- Skipped checks: Full performance checkpoint is not required for this post-first-working spacing-range iteration because targeted spacing performance covers the touched workload and the first working product checkpoint already passed.
- Risks: Risk: `-8px` is intentionally available for compressed visuals, but under extreme combinations such as Scale 6, Density 100, and render scale 2 it is outside the guaranteed smooth target recorded in `app-performance.ts`.

### Iteration 11 — Source Image Dither Input

- Request: Add an option so the user can upload an image as the source material and apply the CHEVAL NOIR DITHER effect to it.
- Task type: Tier 3 post-first-working product iteration touching source-media controls, runtime media state, renderer source sampling, SVG/PNG/video export, acceptance, performance, browser tests, and worklog.
- User-visible result: The controls panel now includes a `Source` section with an `Image` upload. When an image is present, the ASCII field samples its luminance while preserving particle type, density, scale, spacing, voids, dither, motion, and export settings; clearing or resetting the source returns to the procedural field.
- Source/reference checked: Current schema, fileDrop contract, renderer frame model, export helpers, media transform runtime, acceptance matrix, performance matrix, e2e browser tests, and the user's latest source-image request.
- Reference inputs: Latest user request; no new external media beyond the existing reference screen recording already used for the product.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md`, `renderer-technique.md`, and `decision-contract.md`; required skills `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Use Toolcraft's built-in `fileDrop` control for `source.image`; keep Layers disabled; decode the uploaded image into a transform-aware cover-cropped luminance sampler; feed that sampler into the existing deterministic ASCII frame model for Canvas preview, SVG, PNG/JPG, and video export.
- Alternatives rejected: A custom uploader was rejected because `fileDrop` owns image upload, clear, reset, and transform actions; showing placeholder source artwork on canvas was rejected because the canvas must stay product-output-only before real content exists; switching the whole renderer to WebGL was rejected because source sampling is a media-import preprocessing pass and the visible primitive/export remains text glyph output.
- State/output mapping: `source.image` stores the uploaded runtime media asset and transform metadata; `getAsciiSourceImageAsset` locates the asset; `createAsciiSourceSampler` draws it with rotation/flip metadata into canvas-size luminance data; `createAsciiPatternFrame` uses sampled luminance when present and falls back to procedural noise when empty.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/ascii-pattern-renderer.tsx`, `src/app/ascii-export.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance.test.ts`, `src/app/app-performance.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted unit tests passed (`node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); `npm test` passed; `npm run build` passed; targeted browser acceptance passed for `browser: source image upload clear reset and transforms update dither output` including SVG and video export; targeted browser performance passed for `browser perf: source image import prepares dither sampler`.
- Skipped checks: Direct `pnpm verify:quick` was not used because `pnpm` is not exposed in this session and the script recursively calls `pnpm`; equivalent local checks passed with `npm run ai:check`, `npm test`, and targeted Playwright browser tests. Full `pnpm verify:perf` is not required for this post-first-working media-flow iteration because targeted media-import performance passed and the first working product checkpoint already passed.
- Risks: Risk: Very large uploaded images beyond the recorded 1920x1080-equivalent stress fixture will decode and resample on the main thread; the app records the guaranteed media-import workload at 1920x1080.

### Iteration 12 — Source Video Dither Input

- Request: Add support for videos as source material after the image-source feature.
- Task type: Tier 3 post-first-working product iteration touching source-media controls, runtime file media state, video decode/seek sampling, Canvas preview, SVG/PNG/video export, acceptance, performance, browser tests, and worklog.
- User-visible result: The Source section now includes a `Video` upload. When a video is present, CHEVAL NOIR DITHER samples its current frame from timeline progress and applies the same particle, void, dither, spacing, and export controls; removing the video returns to the uploaded image fallback or procedural field.
- Source/reference checked: Current schema, Toolcraft `fileDrop` file-mode contract, video metadata/loading behavior, renderer source sampling, export helpers, acceptance matrix, performance matrix, targeted Playwright tests, and the user's latest video-source request.
- Reference inputs: Latest user request; no new external media beyond the existing reference screen recording already used for the product.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md`, `renderer-technique.md`, and `decision-contract.md`; required skills `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Use Toolcraft's built-in `fileDrop` control for `source.video` with `assetKind: "file"` and `accept: "video/*"`; keep video as a source override above image; load uploaded video into a hidden `HTMLVideoElement`; map Toolcraft timeline progress to video time; create a canvas-size luminance sampler from the current frame for preview and export.
- Alternatives rejected: A custom video picker was rejected because file-mode `fileDrop` owns upload, file list, remove, reset, and canvas drag import behavior; drawing the uploaded video directly on the canvas was rejected because the canvas must remain the final dither output; treating video as a separate layer was rejected because the user edits one resulting dither field, not independent source/output layers.
- State/output mapping: `source.video` stores the uploaded runtime media asset; `getAsciiSourceVideoAsset` gives it priority over `source.image`; `getAsciiSourceVideoTime` maps `state.timeline.currentTimeSeconds` into the source clip; `seekAsciiSourceVideo` prepares the frame; `createAsciiSourceSampler` samples frame luminance; `createAsciiPatternFrame` consumes that sampler for Canvas preview, SVG stills, PNG/JPG stills, and recorded video export.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/ascii-pattern-renderer.tsx`, `src/app/ascii-export.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `npm run ai:check` passed; `npm test` passed; `npm run build` passed; targeted browser acceptance passed for `browser: source video upload clear reset and timeline frames update dither output`; targeted browser performance passed for `browser perf: source video import prepares dither sampler`.
- Skipped checks: Direct `pnpm verify:quick` was not used because `pnpm` is not exposed in this session and the script recursively calls `pnpm`; equivalent local checks passed with npm and local Playwright. Full `pnpm verify:perf` is not required for this post-first-working media-flow iteration because targeted source-video media-import performance passed and the first working product checkpoint already passed.
- Risks: Risk: Very large or long uploaded videos beyond the recorded 1920x1080 source-video stress fixture will decode and seek on the main thread during source preparation and export; MP4/MOV browser decode support still depends on the local browser codecs, while WebM fixtures are covered in tests.

### Iteration 13 — Distinct Source Import Sections

- Request: The two import boxes look like they are named the same even though one is for image source and one is for video source.
- Task type: Tier 1 local control presentation fix touching Source section titles, reset labels, acceptance inventory, browser tests, and worklog.
- User-visible result: The controls panel now shows separate `Source Image` and `Source Video` sections, so the image uploader and video uploader have distinct visible contexts before any file is imported.
- Source/reference checked: User screenshot `/var/folders/82/tv61vryj3bd9t7hvnqzfp96h0000gn/T/TemporaryItems/NSIRD_screencaptureui_VTuAY4/Capture d’écran 2026-07-05 à 18.51.11.png`, current schema, runtime `fileDrop` behavior, acceptance inventory, and targeted browser source upload tests.
- Reference inputs: User screenshot showing the two empty Source import boxes with generic image/file drop-zone copy.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `component-rules.md`, `schema-reference.md`, `acceptance-testing.md`, and `decision-contract.md`; required skills `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser`.
- Contract rules applied: `controls-layout-heuristics`, `controls-product-coverage`, `acceptance-product-observable`, and `workflow-required`.
- Decision: Keep native Toolcraft `fileDrop` controls and split the shared Source section into `Source Image` and `Source Video` instead of patching the local runtime or adding custom uploader UI.
- Alternatives rejected: Patching copied `src/toolcraft` fileDrop placeholder text was rejected because this app can solve the ambiguity through schema section context; adding custom helper text inside the canvas was rejected because uploads must stay in controls and the canvas must remain product output only; keeping both uploaders under one `Source` title was rejected because the empty file-mode uploader only says “file”.
- State/output mapping: `source.image` and `source.video` targets remain unchanged, so media sampling, image fallback, video priority, preview, SVG, PNG/JPG, and video exports keep the same behavior; only section titles and section reset labels change.
- Files changed: `src/app/app-schema.ts`, `src/app/app-acceptance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted schema/acceptance tests passed (`node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts --passWithNoTests`); targeted browser acceptance passed for source image and source video upload/reset/export flows; `npm run build` passed.
- Skipped checks: Full performance checkpoint is not required for this post-first-working presentation fix because no renderer workload, media decode behavior, export bytes, timeline behavior, or canvas output changed.
- Risks: None: the state targets and media/export behavior are unchanged.

### Iteration 14 — Source Video Auto Levels

- Request: A newly uploaded video appears to produce no visible dither output.
- Task type: Tier 3 post-first-working bug fix touching source-video sampling, Canvas preview, SVG/PNG/video export source frames, browser coverage, performance metadata, and worklog.
- User-visible result: Uploaded video frames are now auto-leveled before luminance sampling, so dark or low-contrast videos still generate visible CHEVAL NOIR DITHER particles under the default threshold.
- Source/reference checked: Current source-video loader/sampler, source-image sampler, renderer preview, export sampler factory, user report, and targeted browser tests using high-contrast plus deliberately dark low-contrast WebM source fixtures.
- Reference inputs: User report that adding a video produced no visible result; no new external media file was provided for this pass.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `component-rules.md`, `schema-reference.md`, `acceptance-testing.md`, `renderer-technique.md`, `performance.md`, and `decision-contract.md`; required skills `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Keep the native video upload flow and add histogram-based luminance auto-leveling inside `createAsciiSourceSampler`; return `undefined` safely if a video frame is not drawable yet instead of throwing from `drawImage` or `getImageData`.
- Alternatives rejected: Lowering the global default Threshold was rejected because it would change the established procedural look; adding a new user-facing control was rejected because this is a source-media robustness fix; patching Toolcraft file upload runtime was rejected because the failure is in app-specific media sampling.
- State/output mapping: `source.video` still resolves to the uploaded media asset; the decoded video frame is drawn into the canvas-size sampler; the sampler now records low/high luminance levels and `sampleAsciiSourceLuminance` normalizes each sampled pixel before the existing dither threshold, void mask, particle colors, preview, SVG, PNG/JPG, and video export paths consume it.
- Files changed: `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `npm run typecheck` passed; targeted browser acceptance passed for normal source-video upload/reset/timeline/export and dark source-video auto-level output; targeted browser performance passed for `browser perf: source video import prepares dither sampler`; `npm test` passed; `npm run build` passed.
- Skipped checks: Full performance checkpoint is not required for this post-first-working media robustness fix because the targeted source-video media-import performance scenario passed and no broad renderer architecture changed.
- Risks: Risk: Unsupported browser video codecs still cannot be decoded in-browser; MP4/MOV/HEVC behavior depends on the user's browser codec support.

### Iteration 15 — Thinner Cross Particles

- Request: Reduce the thickness of the `crosses` particles.
- Task type: Tier 3 post-first-working renderer visual iteration touching Canvas cross glyph geometry, SVG cross export geometry, targeted app tests, and worklog.
- User-visible result: Cross particles keep their current scale and grid placement, but the horizontal and vertical bars are visibly thinner in the live preview and in SVG still exports.
- Source/reference checked: Current Canvas cross drawing path, SVG export path, app schema test coverage, renderer contracts, acceptance contracts, performance contracts, and the user's latest cross-thickness request.
- Reference inputs: Latest user request; no new external media beyond the existing reference screen recording already used for the product.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md`, and `decision-contract.md`; required skills `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `renderer-technique-inventory`, `output-export-required`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Share one cross length/thickness ratio between preview and SVG export, reduce thickness from `0.14` to `0.08` of glyph size, and render SVG crosses as two vector rectangles instead of a typographic `+`.
- Alternatives rejected: Reducing overall `Scale` was rejected because it would change grid density and all particle families; changing `Spacing` was rejected because the user asked for stroke thickness, not particle distance; leaving SVG crosses as text was rejected because the exported `+` would remain visually heavier than the Canvas preview.
- State/output mapping: `pattern.particleType = "cross"` still selects `+` glyphs in the shared frame model; Canvas preview maps each cross glyph to two thin rectangles, and `createAsciiPatternSvg` maps the same glyphs to equivalent SVG rectangles using the same color, size, position, length, and thickness constants.
- Files changed: `src/app/ascii-pattern.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `npm run typecheck` passed; targeted app tests passed (`node_modules/.bin/vitest run src/app/app-schema.test.ts` and the broader app matrix before browser); `npm test` passed; `npm run build` passed; targeted browser acceptance passed for `browser: pattern controls change ASCII output` and `browser: footer exports create svg image and video bytes`.
- Skipped checks: Full performance checkpoint is not required for this post-first-working visual renderer edit because it reduces stroke thickness without increasing glyph count, canvas size, source-media decode, animation frequency, or export resolution.
- Risks: None: particle positions, counts, controls, timeline mapping, and source-media sampling are unchanged.

### Iteration 16 — Restore Original Cross Weight

- Request: Revert the thinner `crosses` particles because the previous look was preferred.
- Task type: Tier 3 post-first-working renderer visual iteration touching Canvas cross glyph geometry, SVG cross export markup, targeted browser coverage, and worklog.
- User-visible result: Cross particles are back to the previous heavier bar weight in the live preview, and SVG exports again use the original typographic `+` glyph output.
- Source/reference checked: Current Canvas cross drawing path, current SVG export path, the previous pre-thin cross implementation, browser export tests, renderer contracts, acceptance contracts, performance contracts, and the user's revert request.
- Reference inputs: Latest user revert request; no new external media beyond the existing reference screen recording already used for the product.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`; required skills `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `renderer-technique-inventory`, `output-export-required`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Restore Canvas cross thickness to `0.14` of glyph size and restore SVG cross export to the same text-glyph path used before Iteration 15.
- Alternatives rejected: Reducing Scale or changing Spacing was rejected because the user asked to revert the cross look only; keeping vector rectangles with thicker bars was rejected because the preferred prior version used typographic SVG glyphs; changing other particle families was rejected because the request only concerns Crosses.
- State/output mapping: `pattern.particleType = "cross"` still selects `+` in the shared frame model; Canvas preview maps that glyph to the original heavier rectangle bars, while SVG, PNG/JPG, and video exports again follow the pre-thin output behavior through the shared frame/export paths.
- Files changed: `src/app/ascii-pattern.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `npm run typecheck` passed; targeted app tests passed (`node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); `npm test` passed; `npm run build` passed; targeted browser acceptance passed for `browser: pattern controls change ASCII output` and `browser: footer exports create svg image and video bytes`.
- Skipped checks: Full performance checkpoint is not required for this post-first-working visual revert because it restores a previously validated renderer/export path and does not add controls, glyph count, source-media workload, canvas size, or export resolution.
- Risks: None: this returns the Crosses particle rendering to the previous preferred look without changing state, controls, source-media sampling, or timeline behavior.

### Iteration 17 — Video Export Duration Lock

- Request: MP4 export should be 10 seconds, but the downloaded video is about 1 minute 16 seconds.
- Task type: Tier 3 post-first-working export bug fix touching MediaRecorder frame scheduling, source-video sampling during video export, browser coverage, and worklog.
- User-visible result: Video export duration now stays tied to the Toolcraft timeline duration instead of accumulating source-video seek/render time into the encoded MP4/WebM duration.
- Source/reference checked: User exported file `/Users/pierrevoisin/Downloads/ascii-dither-field (3).mp4`, MP4 container dimensions/duration parsed locally, `exportAsciiVideo`, source-video sampler/seek code, video export browser tests, renderer contracts, acceptance contracts, and performance contracts.
- Reference inputs: User report that the export should be 10 seconds but produced a 1m16s MP4; local exported MP4 metadata showed a 74.208s file.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `acceptance-testing.md`, `performance.md`, and `renderer-technique.md`; required workflow skills were unavailable in this environment, so the local Toolcraft contracts were followed directly.
- Contract rules applied: `output-export-required`, `timeline-enabled-behavior`, `acceptance-product-observable`, `renderer-technique-inventory`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Schedule recorded frames against target timeline timestamps, remove the unconditional per-frame wait after rendering, and during source-video export play the loaded source video continuously at a playback rate mapped to timeline duration instead of seeking it once per exported frame.
- Alternatives rejected: Keeping per-frame video seeks was rejected because MediaRecorder encodes real elapsed time and slow seeks stretch the final video; lowering frame count was rejected because it would reduce motion fidelity without fixing the timing model; changing timeline duration defaults was rejected because the selected timeline already represented the desired output duration.
- State/output mapping: `state.timeline.durationSeconds` determines `durationSeconds`, `frameCount`, and the wall-clock target for each requested frame; uploaded `source.video` is decoded once, played continuously during recording, sampled from its current frame, and cleaned up after export; source image/procedural exports keep the same frame model but now use target-time scheduling rather than fixed post-render waits.
- Files changed: `src/app/ascii-export.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `npm run typecheck` passed; targeted app tests passed (`node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`); targeted browser acceptance passed for `browser: source video upload clear reset and timeline frames update dither output` and `browser: video export produces timeline-duration metadata`.
- Skipped checks: Full performance checkpoint is not required for this post-first-working export timing bug fix because targeted browser export duration coverage exercises the touched source-video and timeline export path.
- Risks: Risk: If the browser cannot play a muted uploaded source video during the user-triggered export, the export will fail instead of silently producing a stretched-duration file.

### Iteration 18 — Video Export Playback Fallback

- Request: After the duration fix, video export creates no file.
- Task type: Tier 3 post-first-working export bug fix touching source-video playback startup during video export, browser coverage, and worklog.
- User-visible result: Video export no longer aborts when the browser refuses or delays `video.play()` for the hidden uploaded source video; it continues recording from the available source frame instead of producing no download.
- Source/reference checked: Current `exportAsciiVideo`, source-video playback startup, user screenshot showing the export controls, and the browser export coverage added for refused playback startup.
- Reference inputs: User report that no file is created after clicking export; screenshot `/var/folders/82/tv61vryj3bd9t7hvnqzfp96h0000gn/T/TemporaryItems/NSIRD_screencaptureui_uWPamq/Capture d’écran 2026-07-11 à 17.14.21.png`.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `acceptance-testing.md`, `performance.md`, and `renderer-technique.md`; required workflow skills were unavailable in this environment, so the local Toolcraft contracts were followed directly.
- Contract rules applied: `output-export-required`, `acceptance-product-observable`, `renderer-technique-inventory`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Treat source-video `play()` as best-effort during export by catching rejections and timing out the startup wait, so MediaRecorder setup and file download can proceed even if autoplay/playback startup is refused.
- Alternatives rejected: Restoring frame-by-frame seeking was rejected because it reintroduces stretched output duration; failing the export when hidden source playback is refused was rejected because it produces no file; dropping source-video support during export was rejected because uploaded video is a core product feature.
- State/output mapping: `source.video` is still loaded and seeked to the first frame; playback startup is attempted but no longer required for the export Promise to continue; `export.video.*`, timeline duration, MediaRecorder, and download behavior stay on the same export path.
- Files changed: `src/app/ascii-export.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `npm run typecheck` passed; targeted app matrix tests passed; `npm run build` passed.
- Environment note: The separate browser-server permission returned an out-of-credits error before the targeted export exercise could start.
- Skipped checks: Full performance checkpoint is not required for this post-first-working export startup bug fix.
- Risks: Risk: If hidden source video playback is refused, the exported dither may use the available source frame rather than animated source-video frames, but a file should still be created and timeline duration should remain bounded.

### Iteration 19 — Video Export Freeze Fix

- Request: The deployed app still freezes on video export and creates no file.
- Task type: Tier 3 post-first-working export/performance bug fix touching source-video sampling, preview/export sampler resolution, recorder startup/stop behavior, browser export coverage, performance coverage, and worklog.
- User-visible result: Video export no longer tries to rebuild a full-canvas source-video luminance map for every recorded frame; it samples source media at the ASCII grid resolution, records with a real capture cadence, flushes recorder data, and times out encoder completion instead of leaving the button active forever.
- Source/reference checked: Current `exportAsciiVideo`, `createAsciiSourceSampler`, `AsciiPatternRenderer`, user screenshot showing `Export Video` stuck, and existing browser export/performance scenarios for source video and timeline-duration metadata.
- Reference inputs: User report that the Vercel version freezes on export and produces no file; screenshot `/var/folders/82/tv61vryj3bd9t7hvnqzfp96h0000gn/T/TemporaryItems/NSIRD_screencaptureui_5MA7aC/Capture d’écran 2026-07-11 à 17.24.42.png`.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `decision-contract.md`, `acceptance-testing.md`, `performance.md`; required workflow skills `systematic-debugging` and `browser`.
- Contract rules applied: `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Add target-coordinate-aware source samplers with grid-resolution sample dimensions, use those samplers for preview and exports, start canvas capture at the export frame rate for browsers without manual `requestFrame`, flush recorder chunks during recording, guard recorder completion with a timeout, and always clean up video tracks/source media.
- Alternatives rejected: Returning to frame-by-frame source-video seeking was rejected because it already caused stretched exports; lowering export resolution automatically was rejected because the selected Current/4K setting must be honored; keeping full-canvas per-frame source sampling was rejected because it multiplies readback cost by every recorded frame and matches the freeze symptom.
- State/output mapping: `pattern.scale` and `pattern.spacing` determine the ASCII grid step and source sampler dimensions; `source.image` and `source.video` still feed the same luminance path; `export.video.*` still controls recorder format and output size; timeline duration still drives rendered progress and exported metadata.
- Files changed: `src/app/ascii-pattern.ts`, `src/app/ascii-pattern-renderer.tsx`, `src/app/ascii-export.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `npm run typecheck` passed; targeted app matrix tests passed; targeted browser export checks passed; targeted export performance check passed; `npm run build` passed.
- Skipped checks: None for the Tier 3 export path; broader unrelated suite left unchanged.
- Risks: Risk: A full 10-second video export still takes roughly the selected timeline duration because the browser recorder encodes in real time, but it should show progress and produce a file instead of freezing indefinitely.

### Iteration 20 — Depth Control And Source Recovery

- Request: Repurpose the visible Contrast control so it adds or reduces visual depth in the latest online version.
- Task type: Tier 3 post-first-working renderer/control change plus recovery of the newer Vercel source history that had not been pushed to GitHub.
- User-visible result: The Dither section now shows `Depth`; `0` flattens particle tone and apparent size, while values toward `2` make strong particles larger/brighter and weak particles smaller/darker without changing grid spacing, count, voids, or source media.
- Source/reference checked: Public bundle at `https://chevalnoirdither.vercel.app`, GitHub `chevalnoir-agency/dither` main branch, recovered Codex patch history from July 5-11, current schema, shared Canvas/SVG/image/video frame model, and Dither browser coverage.
- Reference inputs: User request on August 10 to make Contrast control depth; public Vercel bundle confirmed Image/Video source controls and export fixes absent from GitHub main.
- Docs/contracts read: Existing product worklog, schema, renderer, acceptance, performance, and export implementation recovered from the deployment source history.
- Contract rules applied: `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Keep target `dither.contrast` for saved-setting compatibility, rename the visible control to `Depth`, map its `0..2` range to both tone separation and a bounded `0.72..1.28` intensity-based glyph scale, and use the shared frame model so preview, SVG, PNG/JPG, and video agree.
- Alternatives rejected: A pure label rename was rejected because it would still only change contrast; changing particle count or spacing was rejected because those have dedicated controls; random size variation was rejected because depth must follow source/procedural intensity and remain deterministic.
- State/output mapping: Existing `dither.contrast` values persist; `0` maps all glyphs to midpoint color and scale `1`; `2` preserves the previous maximum low/high color separation and adds maximum intensity-based apparent depth; intermediate values interpolate both effects.
- Files changed: Recovered source history across app schema/renderer/export/acceptance/performance/browser coverage, then updated `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and this worklog.
- Verification: `pnpm verify:quick` passed with 219 app tests; `pnpm build` passed; real-browser comparison confirmed flat uniform particles at Depth `0` and tone/size separation at `2`; targeted Dither SVG acceptance and Depth control-drag performance passed.
- Skipped checks: Full performance checkpoint is not required for this post-first-working non-performance edit because depth does not increase cell count and the dedicated control-drag scenario covers its per-glyph arithmetic.
- Risks: Depth changes glyph dimensions inside existing cells, so very dense negative spacing can intentionally create more overlap at high values; the bounded scale prevents unbounded geometry growth.

### Iteration 21 — Optimized Animated GIF Export

- Request: Add animated GIF export, with GIF files optimized for web use.
- Task type: Tier 3 post-first-working export feature touching the Video Export format control, deterministic frame rendering, worker encoding, acceptance, performance coverage, dependencies, and worklog.
- User-visible result: `GIF` is available beside MP4 and WebM. Export Video now creates a 12 fps, infinitely looping GIF at the selected Current/4K dimensions, with timeline-matched duration and a shared adaptive 32-color palette.
- Source/reference checked: Existing MP4/WebM export path, timeline-driven shared frame renderer, Toolcraft export contracts, and the official `mattdesl/gifenc` browser/worker documentation and package source.
- Reference inputs: User request for an optimized animated GIF option; existing CHEVAL NOIR DITHER animation and export output were the product source of truth.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md`; required workflow skills `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Reuse `export.video.format` and the existing Export Video action; render deterministic timeline frames at 12 fps; distribute GIF centisecond delays so their sum matches the timeline duration; compute one adaptive 32-color palette; encode frame chunks across up to four module workers; concatenate chunks in timeline order and terminate with a valid GIF trailer.
- Alternatives rejected: A second GIF action was rejected because format belongs in the existing animation export workflow; 30 fps was rejected because it multiplies GIF weight without a useful gain for this slow dither motion; one-worker sequential encoding was rejected after the 1920x1080 browser test exceeded 30 seconds; automatic dimension reduction was rejected because it would ignore the selected export resolution; MediaRecorder cannot produce GIF.
- State/output mapping: `export.video.format = gif` selects the worker encoder; `export.video.resolution` still passes through `getToolcraftVideoExportSize`; timeline duration determines frame count and exact accumulated delay; source image/video sampling, particle settings, depth, background, and procedural progress use the same `drawAsciiPattern` path as preview and MP4/WebM.
- Files changed: `package.json`, `pnpm-lock.yaml`, `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/ascii-export.ts`, `src/app/gif-encoder.worker.ts`, `src/app/gifenc.d.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, related app/browser tests, and this worklog.
- Verification: `pnpm verify:quick` passed (219 app tests plus Toolcraft checks); `pnpm typecheck` and `pnpm build` passed; the real browser GIF acceptance passed at 1920x1080 in about 3.5 seconds; the targeted optimized-GIF performance scenario passed in about 4.6 seconds.
- Skipped checks: Full performance checkpoint is not required for this post-first-working targeted export addition; the dedicated full-resolution GIF export budget covers the changed workload.
- Risks: Long 4K GIFs are inherently large and computationally expensive despite palette and worker optimization; the selected dimensions are intentionally honored rather than silently reduced.

### Iteration 22 — Stronger Particle Depth

- Request: Strengthen contrast between particles so current color differences create more apparent volume and visual depth.
- Task type: Tier 3 post-first-working renderer refinement touching shared frame tone/size mapping, Canvas/SVG cross geometry, acceptance, targeted performance wording, browser evidence, and worklog.
- User-visible result: Depth now pushes middle tones more decisively toward `#222629` or `#BEBDC1`, makes weak particles recede and strong particles advance across a wider bounded size range, and keeps cross stroke width constant as cross length changes.
- Source/reference checked: Current CHEVAL NOIR DITHER renderer, Depth schema and acceptance rows, Canvas and SVG export paths, prior glow/flicker feedback, and the existing reference-video study.
- Reference inputs: Latest user request for stronger particle contrast, volume, and depth; prior user requirement that `+` particles retain constant thickness regardless of size; existing screen-recording reference and generated app output.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `acceptance-testing.md`, and `performance.md`; required workflow skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Keep the saved `dither.contrast` target, visible `Depth` label, `0..2` range, and requested palette endpoints; replace the maximum-depth linear tone remap with a stronger bounded S-curve; expand apparent scale from `0.72..1.28` to `0.60..1.40`; derive tone/size from stable field intensity rather than per-cell visibility flicker; store base cross thickness separately from depth-scaled length; export crosses as paired SVG rectangles matching Canvas geometry.
- Alternatives rejected: Extending particle colors beyond the requested palette was rejected because `#222629` and `#BEBDC1` remain the exact weak/strong bounds; adding another control was rejected because the existing Depth control owns this behavior; time-varying brightness was rejected because it would amplify the previously reported glow flicker; increasing particle count or spacing contrast was rejected because those are separate controls.
- State/output mapping: `dither.contrast = 0` still produces midpoint color and scale `1`; values toward `2` interpolate into the stronger S-curve and sculpted scale; `particleTone` uses intensity plus normalized source/procedural tone; each glyph carries a fixed base thickness used by Canvas and SVG cross drawing; PNG/JPG, MP4/WebM, and GIF continue through the shared Canvas frame path.
- Files changed: `src/app/ascii-pattern.ts`, `src/app/app-schema.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted app matrix tests passed with 219/219 tests; `pnpm verify:quick` and `pnpm build` passed; real-browser visual QA confirmed stronger dark/mid/light separation without incoherent overlap; targeted Dither SVG acceptance proved flat versus sculpted size/color output plus constant cross stroke width; targeted Depth drag performance passed.
- Skipped checks: Full performance checkpoint is not required because the new bounded arithmetic and SVG geometry do not increase glyph count, canvas dimensions, render scale, or animation/export frame count; the dedicated Depth drag scenario covers the touched renderer path.
- Risks: The wider size range can create intentional overlap in extreme dense negative-spacing settings, but remains bounded to `0.60..1.40`; SVG crosses now use vector rectangles instead of font glyphs so their shape matches Canvas more closely while other particle families remain SVG text.

### Iteration 23 — Media-Linked Tonal Depth

- Request: Correct Depth so it reveals more particle color tonalities tied to the uploaded image/video information instead of trying to create volume through particle size.
- Task type: Tier 3 renderer regression correction touching source-luminance mapping, shared Canvas/SVG/image/video/GIF frame output, schema semantics, acceptance, tests, targeted performance, and worklog.
- User-visible result: Uploaded media shadows, midtones, and highlights now produce many ordered particle colors between `#222629` and `#BEBDC1`; Depth controls the amplitude of that tonal range while every particle keeps its normal geometry.
- Source/reference checked: Current Depth renderer path, source sampler auto-levels, threshold/strength intensity calculation, Canvas/SVG shared frame model, prior glow feedback, and a measured 64-step grayscale media fixture.
- Reference inputs: Latest user clarification that Depth should reveal more colors connected to media data; synthetic grayscale gradient used to isolate the renderer behavior; existing image/video upload workflow.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `acceptance-testing.md`, and `performance.md`; required workflow skills `systematic-debugging`, `brainstorming`, and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Keep the persisted `dither.contrast` target and visible `Depth` label; remove all depth-driven glyph scaling; map source-media particles directly from auto-leveled local luminance; linearly expand the luminance range that survives Threshold/Strength across the full requested palette; use the procedural normalized field only when no media sampler exists; let Depth interpolate from one neutral midpoint color at `0` to the full tonal mapping at `2`.
- Alternatives rejected: More random colors were rejected because tones must reflect media information; retaining intensity as the primary color source was rejected because Threshold/Strength had already crushed media nuances; nonlinear high-contrast curves were rejected because they reduce distinguishable midtones; a separate tonal-range control was rejected because the user explicitly clarified the existing Depth control.
- State/output mapping: `sourceTone` now directly drives `particleTone` for uploaded image/video frames; the visible threshold floor is remapped to tone `0` and media highlight `1`; `dither.contrast` controls interpolation around midpoint; `glyph.size` remains the particle-type base size for every Depth value; Canvas preview, SVG, PNG/JPG, MP4/WebM, and GIF share the corrected frame colors.
- Files changed: `src/app/ascii-pattern.ts`, `src/app/app-schema.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: The regression baseline recorded 341 distinct glyph sizes and only `0.68` source/color correlation; the corrected fixture records one glyph size, 35 media-derived colors, full palette use, and measured `0.999` source/color correlation. The targeted app matrices pass with 220/220 tests; `pnpm verify:quick`, `pnpm build`, real-browser grayscale-media visual QA, image/video acceptance, SVG tonal export coverage, and targeted Depth drag performance passed.
- Skipped checks: Full performance checkpoint is not required because source sampling, glyph count, canvas size, and export frame count are unchanged; the dedicated media acceptance and Depth drag scenarios cover the touched renderer path.
- Risks: Threshold still controls whether dark source regions contain particles at all; Depth controls the tonal variety of particles that survive that cutoff, while Density and Threshold remain the correct controls for spatial presence.

### Iteration 24 — Extended Tonal Depth To 3

- Request: Extend Depth to `3` so the user can create more tonal depth beyond the current maximum.
- Task type: Tier 3 post-first-working renderer/control refinement touching the slider range, shared color mapping, Canvas/SVG/image/video/GIF output, acceptance, tests, targeted performance, and worklog.
- User-visible result: Depth now runs from `0` to `3`; existing value `2` preserves the approved media-linked tonal rendering, while `2..3` progressively deepens shadows and lifts highlights without changing particle size or palette endpoints.
- Source/reference checked: Current media-linked tonal mapping, grayscale regression fixture, Dither schema/acceptance rows, SVG export evidence, and the latest user request.
- Reference inputs: User request to increment the control to `3`; existing grayscale media fixture and the approved `#222629` to `#BEBDC1` particle palette.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `acceptance-testing.md`, and `performance.md`; required workflow skills `brainstorming` and `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Keep default Depth at `2` and preserve all `0..2` output; increase schema and settings clamps to `3`; blend the media tone toward a bounded smoothstep curve only across `2..3`; keep the requested low/high colors as exact endpoints and keep glyph size invariant.
- Alternatives rejected: Changing the default to `3` was rejected because existing saved/default output should remain stable; extending RGB values beyond the requested palette was rejected; a hard contrast multiplier was rejected because clipping would discard midtones; particle-size depth was rejected because the preceding correction established tonal-only behavior.
- State/output mapping: `dither.contrast <= 2` keeps the existing neutral-to-linear media tone interpolation; `dither.contrast > 2` blends toward the smooth tonal-depth curve; `getAsciiPatternSettings` accepts values through `3`; preview and every export path consume the same corrected glyph colors.
- Files changed: `src/app/ascii-pattern.ts`, `src/app/app-schema.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted app matrices pass with 220/220 tests; unit evidence proves Depth `3` makes a 25% tone darker and a 75% tone brighter than Depth `2` while preserving ordered tonal values. `pnpm verify:quick`, `pnpm build`, targeted browser Dither/SVG acceptance through value `3`, and targeted Depth drag performance passed.
- Skipped checks: Full performance checkpoint is not required because the extra curve adds constant per-glyph arithmetic without changing source sampling, glyph count, canvas dimensions, or export frame count; the Depth drag scenario covers the touched path.
- Risks: The stronger `2..3` range intentionally compresses tones near the palette endpoints, but smooth interpolation preserves midtone ordering and avoids hard clipping.

### Iteration 25 — Horse-Coat Shadow Detail

- Request: Make increasing Depth reveal the slightly lighter nuances in the black coat of the supplied horse video, which currently remains an empty dark silhouette.
- Task type: Tier 3 renderer regression correction with a new video reference study, source-media shadow mapping, shared preview/export behavior, acceptance, targeted performance, and worklog evidence.
- User-visible result: At Depth `3`, subtle highlights on a predominantly black subject can survive the dither cutoff and appear as ordered dark-to-mid particle tones, while Depth `2` remains the approved global media mapping and particle geometry remains unchanged.
- Source/reference checked: `/Users/pierrevoisin/Desktop/🏇 CHEVAL NOIR/FILM/generated_clips/01_horse_landscape.mp4`; decoded browser frames at `0.00s`, `1.26s`, `2.52s`, `3.78s`, and `4.79s`; contact sheet at `docs/toolcraft/reference-horse-depth/contact-sheet.png`; current source sampler, auto-level histogram, Threshold/Strength cutoff, Depth mapping, Canvas preview, and export paths.
- Reference inputs: 1280x720 H.264-style browser-decoded MP4, duration `5.041667s`; five-frame storyboard; per-frame global and dark-subject luminance distributions; real app reproduction with the supplied video at Depth `3`.
- Video Reference Study: At `0.00s` the full horse enters in profile with highlights on the neck, shoulder, ribs, flank, and hindquarter; at `1.26s` those highlights shift with the gallop while the pale background remains stable; at `2.52s` the torso is centered and the rib/flank highlights remain readable; at `3.78s` the stride opens and softer neck/body reflections persist; at `4.79s` the horse exits left while dark leg and hindquarter detail remains visible. Transitions are forward motion and pose deformation, not global exposure changes; the coat highlight structure moves with the horse and must therefore come from each decoded media frame.
- Behavior decomposition: The global frame is bimodal, with dark horse/shadow pixels and a dominant pale environment. Across the storyboard, global p02 is `13–16`, p50 is `197–199`, and p98 is `210–213`; dark-subject p50 is `21–23`, p90 is `50–59`, and p98 is `101–107`. Global auto-leveling maps dark-subject p50 to `0.04–0.05`, p90 to `0.185–0.23`, and p98 to `0.44–0.47`. With default Threshold `0.6` and Strength `1.6`, the visible lower edge is about `0.3875`, so almost all coat nuance is discarded before particle color mapping.
- Acceptance mapping: A dark-media gradient fixture represents black coat shadows/highlights; Depth `2` records the existing sparse cutoff; Depth `3` must increase visible shadow-detail particles and distinct ordered tones while keeping bright-media output bounded, glyph sizes invariant, and cross stroke width stable. Browser acceptance imports source video, verifies rendered-frame changes, and shared SVG/image/video/GIF exports continue consuming the same corrected frame model.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `acceptance-testing.md`, and `performance.md`; required workflow skills `systematic-debugging`, `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `video-reference-analysis`, `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Preserve all behavior through Depth `2`; across `2..3`, apply a bounded gamma shadow lift to imported source luminance before Threshold/Strength and before tonal color mapping; do not apply the lift to the procedural fallback; keep palette endpoints and glyph geometry unchanged.
- Alternatives rejected: Lowering the global Threshold default was rejected because it changes every composition and floods the pale background; changing source auto-level percentiles alone was rejected because the dominant background still allocates too little normalized range to the black coat; local random brightness was rejected because detail must follow the media; particle-size depth was rejected because the user explicitly wants tonal information.
- State/output mapping: `dither.contrast - 2` controls imported-media shadow lift strength; source luminance remains unchanged at Depth `2`; at Depth `3` low normalized media values are lifted smoothly into the existing cutoff range, then the same lifted value drives particle color; source image/video preview and all export formats share this path.
- Files changed: Reference contact sheet, `src/app/ascii-pattern.ts`, schema/acceptance/performance evidence, targeted unit/browser tests, and `docs/toolcraft/agent-worklog.md`.
- Verification: The supplied-video baseline at Depth `3` records a mostly empty horse silhouette; measured luminance evidence explains the cutoff. The corrected dark-media fixture increases visible shadow particles by more than `1.5x`, preserves more than 10 ordered tones and one glyph size, and the supplied horse video visually restores dark gray coat highlights at Depth `3`. `pnpm verify:quick` passes with 221 app tests; `pnpm build`, targeted image/video/SVG/animation acceptance, and dark-source Depth drag performance pass.
- Skipped checks: Full performance checkpoint is not required because the correction adds constant per-cell arithmetic without increasing sampler resolution, grid size, glyph count limit, render scale, or export frame count; targeted source-video and Depth scenarios cover the touched path.
- Risks: Shadow lift intentionally reveals more particles in very dark imported media at Depth above `2`; Threshold remains available to reduce their presence, and the effect is bounded and absent at the default Depth `2`.

### Iteration 26 — Continuous Shadow Depth Across 0–3

- Request: Apply the horse-coat shadow-detail behavior across the entire Depth scale instead of restricting it to values `2..3`.
- Task type: Tier 3 renderer refinement touching the full source-media Depth curve, shared preview/export output, acceptance fixtures, targeted performance, visual reference evidence, and worklog.
- User-visible result: Imported-media shadow detail now emerges continuously: Depth `0` keeps the flattest/sparsest dark-subject treatment, `1` introduces initial coat highlights, `2` reveals a fuller tonal structure, and `3` reaches maximum bounded shadow detail without changing particle geometry.
- Source/reference checked: Supplied horse MP4, previous five-frame study, dark-media regression fixture, and same-frame app comparison at Depth `0`, `1`, `2`, and `3` stored in `docs/toolcraft/reference-horse-depth/depth-0-1-2-3.png`.
- Reference inputs: `/Users/pierrevoisin/Desktop/🏇 CHEVAL NOIR/FILM/generated_clips/01_horse_landscape.mp4`; contact sheet and measured coat luminance from Iteration 25; latest user clarification about continuous scale semantics.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `acceptance-testing.md`, and `performance.md`; required workflow skills `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser`.
- Contract rules applied: `video-reference-analysis`, `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Map Depth `0..3` linearly to the bounded imported-media shadow-lift amount; interpolate gamma from `1` at Depth `0` to `0.24` at Depth `3`; retain the existing neutral-to-full color-depth mapping and extra tonal contrast above `2`; keep procedural fallback, palette endpoints, grid, glyph size, and cross stroke width unchanged.
- Alternatives rejected: Keeping a dead zone through Depth `2` was rejected because it splits one control into two unrelated behaviors; applying maximum lift at the default was rejected because it removes art-direction range; lowering Threshold was rejected because it changes global particle presence rather than specifically exposing source shadow information.
- State/output mapping: `dither.contrast / 3` now drives imported source gamma continuously; the lifted source tone feeds Threshold/Strength and particle color at every nonzero value; Canvas preview, SVG, PNG/JPG, MP4/WebM, and GIF continue through the shared frame model.
- Files changed: `src/app/ascii-pattern.ts`, `src/app/app-schema.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, visual evidence under `docs/toolcraft/reference-horse-depth`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Targeted app matrices pass with 221/221 tests; dark-media fixture particle counts increase strictly at Depth `0`, `1`, `2`, and `3`; browser Dither/SVG acceptance proves increases at `0`, `1.5`, and `3`; supplied-video same-frame visual comparison confirms progressive horse-coat detail across all four integer values. `pnpm verify:quick`, `pnpm build`, source-video animation/export acceptance, and dark-source Depth drag performance passed.
- Skipped checks: Full performance checkpoint is not required because only the interpolation input changed and per-cell complexity, source sampling, grid limits, canvas size, and export frame count are unchanged; dark-source Depth drag remains the targeted performance path.
- Risks: The default Depth `2` now reveals more imported-media shadow detail than the preceding iteration; this is the explicitly requested continuous-scale behavior, and users can reduce Depth toward `0` for the earlier sparse silhouette.

### Iteration 27 — Native-Cadence Source Video Playback

- Request: Remove the visibly choppy rendering that appears after importing a video source.
- Task type: Tier 3 performance and renderer correction touching source-video timing, decoded-frame scheduling, sampler reuse, procedural workload caching, acceptance, browser cadence coverage, performance scenarios, and reference evidence.
- User-visible result: Uploaded videos now play at their native speed, loop when shorter than the Toolcraft timeline, and redraw the ASCII canvas once per presented decoded frame; paused timeline scrubbing remains deterministic.
- Source/reference checked: User screen recording `Enregistrement de l'ecran 2026-08-26 a 13.28.43.mov`, 31 extracted evidence frames under `docs/toolcraft/reference-video-stutter`, current source-video renderer, timeline clock mapping, shared preview/export sampler, and the 1920x1080 browser fixture.
- Reference inputs: `/var/folders/82/tv61vryj3bd9t7hvnqzfp96h0000gn/T/TemporaryItems/NSIRD_screencaptureui_ov9ilB/Enregistrement de l'ecran 2026-08-26 a 13.28.43.mov`, plus the app's generated 1920x1080 24 fps source-video fixture for deterministic cadence measurement.
- Reference study: `docs/toolcraft/reference-video-stutter/study.md` records storyboard states from 0 to 3 seconds, hold-and-catch-up transitions, behavior decomposition, acceptance mapping, and root-cause evidence.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `acceptance-testing.md`, and `performance.md`; required workflow skills `systematic-debugging`, `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `video-reference-analysis`, `timeline-enabled-behavior`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Root cause: Source time was stretched over the Toolcraft timeline, reducing a short clip's effective frame cadence; the preview also coupled full Canvas redraws to React timeline updates, recreated sampling storage, and used coarse media events instead of decoded-frame presentation.
- Decision: Play source video at rate `1`; map source time with native-duration modulo; schedule active-video redraws with `requestVideoFrameCallback` and a current-time rAF fallback; keep React state out of the frame callback; reuse one sampler surface; retain deterministic paused seeks; cache spatial grid topology and organic values in a bounded LRU; batch Canvas glyph geometry by particle color.
- Alternatives rejected: Frame interpolation was rejected because it invents media content and adds latency; reducing render scale or sampler quality was rejected because it would violate the selected output quality; stretching the video to timeline duration was rejected because it caused the reported slow cadence; a WebGL rewrite was rejected because decoded-frame synchronization and CPU duplication were the measured causes, while the product still requires shared text/vector SVG output.
- State/output mapping: Toolcraft playback still owns play, pause, scrub, loop, and export duration; active preview uses native video time and decoded frames; paused scrub uses `timeline.currentTimeSeconds % sourceDuration`; preview, SVG, PNG/JPG, MP4/WebM, and GIF continue to share the same source luminance and particle frame model.
- Files changed: `src/app/ascii-pattern-renderer.tsx`, `src/app/ascii-pattern.ts`, `src/app/ascii-export.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, the reference study/evidence frames, and this worklog.
- Verification: Targeted source-video lifecycle and 1920x1080 24 fps cadence tests pass; the cadence test observes repeated decoded-frame canvas updates and enforces frame-gap/long-task budgets. Scale drag is stable across three repeated warm-interaction runs after the separately covered cold render, and animated viewport drag is stable across three runs at its documented smooth target. Final quick, build, browser, and full performance results are recorded in Verification below.
- Skipped checks: None; the full performance checkpoint is required for this explicit playback-performance correction and was run in addition to targeted acceptance, quick verification, and production build.
- Risks: When the Toolcraft timeline is longer than a source clip, the clip intentionally loops at native speed instead of playing once in slow motion; very dense combinations above documented smooth targets remain available as experimental art-direction ranges.

### Iteration 28 — Source Image Inversion

- Request: Add a checkbox option that interchanges the colors of an uploaded image.
- Task type: Tier 3 source-media renderer change touching schema controls, normalized luminance sampling, preview, all export paths, acceptance, targeted performance, and browser verification.
- User-visible result: The Source Image section now includes an `Invert` checkbox. Off preserves the existing image mapping; on swaps normalized light and dark image values before dithering, without modifying the uploaded file or changing source-video rendering.
- Source/reference checked: Current Source Image fileDrop flow, transform-aware image sampler, image/video source precedence, shared Canvas/SVG/image/video/GIF export factories, and the asymmetric high-contrast browser fixture.
- Reference inputs: User request for a checkbox-driven image color inversion; no new external visual reference was supplied.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `renderer-technique.md`, and `performance.md`; required workflow skills `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser`.
- Contract rules applied: `controls-product-coverage`, `controls-layout-heuristics`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Add persisted boolean target `source.image.invert`, default `false`, as a built-in checkbox in the Source Image section; invert after percentile auto-level normalization so low-contrast images visibly reverse; carry the flag on the still-image sampler only; keep video sampling unchanged.
- Alternatives rejected: CSS/canvas `filter: invert()` was rejected because it would not update the shared vector/export frame model; inverting raw RGB before auto-leveling was rejected because percentile normalization could partially cancel the requested effect; applying the option to video was rejected because the request explicitly names an image and image/video controls are separate.
- State/output mapping: `source.image.invert` maps normalized source luminance from `tone` to `1 - tone`; the shared source sampler feeds Canvas preview, SVG, PNG/JPG, GIF, MP4, and WebM when the uploaded image is the active source; section and global Reset restore `false`.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/ascii-pattern-renderer.tsx`, `src/app/ascii-export.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance.test.ts`, `e2e/app-controls.spec.ts`, and this worklog.
- Verification: `pnpm verify:quick` passed with 222/222 app tests; `pnpm build` passed; targeted Chromium acceptance proved the checkbox, preview change, SVG byte change, and Source Image reset; the targeted responsiveness scenario passed its interaction, frame-gap, and long-task budgets.
- Skipped checks: Full `pnpm verify:perf` is not required for this post-first-working feature because inversion adds one constant operation per already-sampled luminance value, does not change media dimensions, grid size, glyph count limits, render scale, or export frame count, and the touched control-change scenario passed.
- Risks: Invert remains configured while a source video overrides the image, but intentionally has no effect until the video is removed and the still image becomes active again.

### Iteration 29 — Source Video Inversion

- Request: Add the same light/dark inversion option for imported videos.
- Task type: Tier 3 animated-media renderer change touching schema controls, decoded-frame sampling during pause/playback/scrub, all export paths, acceptance, targeted performance, and browser verification.
- User-visible result: The Source Video section now includes its own `Invert` checkbox. Off preserves the existing video mapping; on swaps normalized light and dark values for every decoded frame without changing the uploaded file or the Source Image inversion setting.
- Source/reference checked: Existing Source Image inversion, Source Video fileDrop lifecycle, paused static sampler, native-cadence `requestVideoFrameCallback` renderer, timeline scrub mapping, and shared SVG/image/GIF/MP4/WebM export factories.
- Reference inputs: User request to provide the same inversion behavior for video imports; no new external visual reference was supplied.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `renderer-technique.md`, and `performance.md`; required workflow skills `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `controls-product-coverage`, `controls-layout-heuristics`, `timeline-enabled-behavior`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Add persisted boolean target `source.video.invert`, default `false`, as a built-in checkbox in the Source Video section; apply it after per-frame percentile auto-level normalization in paused preview, active decoded-frame playback, deterministic scrub, and both real-time and frame-stepped export samplers.
- Alternatives rejected: Reusing `source.image.invert` was rejected because image and video art direction must remain independent; a CSS/canvas filter was rejected because SVG and encoded exports would diverge; inverting raw frame pixels before auto-leveling was rejected because normalization could diminish the requested reversal.
- State/output mapping: `source.video.invert` maps each normalized decoded-frame tone from `tone` to `1 - tone`; it feeds Canvas preview, SVG, PNG/JPG, GIF, MP4, and WebM while video is the active source; Source Video section reset and global Reset restore `false`.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/ascii-pattern-renderer.tsx`, `src/app/ascii-export.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance.test.ts`, `e2e/app-controls.spec.ts`, and this worklog.
- Verification: Targeted app matrices pass with 223/223 tests; targeted Chromium acceptance proves visible inversion on an imported video, changed SVG bytes, scrub persistence, and section reset; the targeted video-inversion responsiveness scenario passes its interaction, frame-gap, and long-task budgets. Final quick and production-build results are recorded below.
- Skipped checks: Full `pnpm verify:perf` is not required for this post-first-working feature because inversion adds one constant operation per already-sampled video luminance value, does not change decode cadence, sampler dimensions, grid size, glyph limits, render scale, or export frame count, and the touched control-change scenario passed.
- Risks: Both Source Image and Source Video expose the concise label `Invert`; they intentionally live in separately titled sections, and video continues to override image output while present.

### Iteration 30 — Standard MP4 Export

- Request: Check on the deployed version why MP4 exports do not work, then update the code and deploy it to Vercel.
- Task type: Tier 4 post-first-working export bug fix touching encoded MP4 bytes and adding the `mp4-muxer` dependency; no renderer, control, or timeline behavior change.
- User-visible result: `Export Video` with `MP4` now downloads a standard progressive H.264 file (constant 30 fps, real duration header, `moov` before `mdat`) that opens in QuickTime, Finder preview, editing software, and upload pipelines instead of only in Chromium. Export no longer runs in real time: frames are encoded as fast as they render.
- Source/reference checked: Deployed app at `https://chevalnoirdither.vercel.app` driven in the agent browser; the MP4 it exported at 1920x1080 parsed as `ftyp, moov, (moof, mdat) x4` with `mvhd` duration `0`, i.e. a fragmented MediaRecorder file; `exportAsciiVideo`, the frame-stepped GIF path, and the `mp4-muxer` type definitions.
- Reference inputs: User report that online MP4 exports do not work; exported bytes from the deployed build; no visual reference.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, export rows of `acceptance-testing.md`, `performance.md`, and `decision-contract.md`; root cause established before editing per `systematic-debugging`.
- Contract rules applied: `output-export-required`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Encode MP4 frame by frame with WebCodecs `VideoEncoder` (H.264 High, falling back to Main/Baseline, level chosen from frame size, keyframe every 2 s, even dimensions) and mux with `mp4-muxer` using in-memory fast start. Frames come from the same deterministic seek-based sampler factory as GIF. MediaRecorder stays as the fallback when no H.264 WebCodecs encoder is available, and remains the WebM path.
- Alternatives rejected: Keeping MediaRecorder and dropping the 1 s timeslice was rejected because Chromium still writes fragmented MP4 with real-time variable cadence; post-processing fragments into a progressive file by hand was rejected as more fragile than a maintained muxer; server-side transcoding was rejected because the app is a static client-only deployment.
- State/output mapping: `export.video.format = mp4` selects the WebCodecs path; `export.video.resolution` still passes through `getToolcraftVideoExportSize`; timeline duration sets frame count (`round(duration x 30)`); background inclusion, source image/video sampling, and `reportProgress` are unchanged.
- Files changed: `src/app/ascii-export.ts`, `src/app/app-schema.ts` (format description), `e2e/app-controls.spec.ts`, `package.json`, `pnpm-lock.yaml`, and this worklog.
- Verification: Agent-browser export on the local build at 1920x1080 produced `ftyp, moov, mdat` only, `mvhd` duration `11.867 s`, `video.duration` `11.867 s`, decodable seeked frame with lit particles; `pnpm ai:check`, `pnpm test` (224/224 plus Toolcraft docs/integrity checks), and `pnpm build` pass; the source-video export browser test with the new MP4 structure assertion passes. Browser suite status for this pass is listed under Risks.
- Skipped checks: Full `pnpm verify:perf` is not required for this post-first-working non-performance edit; the change does not touch preview rendering, controls, or viewport paths.
- Risks: On the unmodified tree, four browser tests already report mismatches unrelated to export (`reference.video.default-display` observable-helper row, optimized GIF export wait, persistence reload, and the dense bright default `Scale` expectation of 24 versus the shipped 14), and the source-video upload observable step is intermittently unstable; they need a separate test-alignment pass. Playwright's bundled Chromium has no H.264 encoder, so the e2e MP4 structure assertion only runs when the export is actually MP4; the progressive file is assembled in memory, so very long 4K exports hold the whole file in RAM before download; `mp4-muxer` is in maintenance mode in favor of `mediabunny`.

## Decisions

### Renderer

- Decision: Canvas 2D live preview renderer with optional normalized/invertible source-image luminance sampling, source-video luminance sampling, SVG still export, WebCodecs H.264 MP4 export (MediaRecorder fallback), MediaRecorder WebM export, and worker-based GIF export generated from the same ASCII frame model.
- Reason: The product is dense text-output: the stress state can draw many glyphs per frame, uploaded media is source material rather than a visible layer, and the user still needs a vector SVG still export with exact particle colors.
- Evidence: `src/app/ascii-pattern-renderer.tsx` renders only product canvas output and loads `source.image` plus `source.video`; `src/app/ascii-pattern.ts` generates deterministic organic glyph frames, image/video luminance sampling, `pattern.voids` mask shaping, media-linked tonal-depth mapping with invariant glyph geometry, SVG cross geometry with fixed stroke width, and SVG text for other particle families; `src/app/app-performance.ts` declares `rendererTechnique`, `rendererPipeline`, media-import coverage, and workload scenarios.

Renderer Technique Decision Matrix:

- sourceRepresentation: video-media when uploaded, image-media fallback when uploaded, procedural fallback when both are empty.
- productRepresentation: text.
- previewRenderer: canvas-2d.
- exportRenderer: WebCodecs H.264 plus progressive MP4 muxing for MP4 (media-recorder fallback), media-recorder for WebM, worker-based palette/LZW encoding for GIF, canvas-2d for PNG/JPG, and SVG vector geometry/text for still output.
- rendererWorkload: text-output.
- rendererStrategy: canvas-2d.
- whyNotAlternativeStrategies: DOM and SVG live preview create too many nodes at stress scale; WebGL/WebGPU do not improve the text glyph primitive or SVG export requirement, and source-media sampling is bounded to uploaded media frames rather than every glyph draw.
- fidelityRisks: Canvas preview rasterizes glyphs; standard MP4 depends on a WebCodecs H.264 encoder and otherwise falls back to MediaRecorder; GIF intentionally uses a 32-color palette and 12 fps cadence for compact web delivery.
- performanceRisks: Small scale, low spacing, and high density increase glyph count; uploaded source images add decode and luminance preparation; uploaded source videos add decode, seek, luminance auto-leveling, and frame-sampling work; MediaRecorder video export takes approximately the selected timeline duration; long 4K GIF exports remain expensive by nature.

Renderer Layer Inventory:

- ascii-pattern-layer: product-foreground, Canvas 2D, high primitive count, content text and dense-pattern, included in exports, visible selector `[data-ascii-pattern-canvas]`.

Render Pipeline Inventory:

- source-image-decode pass: media decode on main thread; cache key is `source.image.dataUrl`.
- source-image-sampler pass: source preprocessing on main thread; cache keys are decoded image, media transform metadata, image inversion, and canvas size.
- source-video-decode pass: media decode on main thread; cache key is `source.video.dataUrl`.
- source-video-frame-sampler pass: source-video preprocessing on main thread; cache keys are decoded presented frame, reusable sampler surface, auto levels, video inversion, and canvas size; active playback is scheduled with `requestVideoFrameCallback`, with current-time rAF fallback, while paused scrub seeks deterministically.
- field-model pass: text-layout on main thread; cache keys are source sampler, particle type, scale, spacing, void amount, density, dither strength, dither contrast, threshold, speed, timeline time, duration, canvas size, and bounded cached spatial topology.
- glyph-raster-preview pass: rasterize on main thread; cache keys are source sampler, field model, background, include background, and render scale.
- export-frame pass: export-only; cache keys are source sampler, field model, background, include background, image settings, video settings, and canvas size.
- interaction invalidation: media import invalidates source decode/sampler, field, preview, and export; control drags invalidate field/preview; timeline playback, scrub, and animation frames must not declare expensive pass invalidation; viewport drag and zoom must not invalidate field or raster caches; export invalidates only export-frame.

### Timeline

- Decision: Enable Toolcraft playback timeline with default duration 11.88166666666667s.
- Reason: The user requested an animated product and MP4 export, and the reference metadata gives the initial loop duration.
- Evidence: `src/app/app-schema.ts` sets `panels.timeline.mode: "playback"` and `defaultDurationSeconds`; `appTransferMode.animationIntent.loopDuration` cites the reference duration; acceptance row `timeline.playback` covers pause/resume, scrub, duration, loop, and rendered frame.

### Layers

- Decision: Do not enable Layers.
- Reason: The product exposes one procedural output layer with no independent objects, visibility, reorder, grouping, or selected-layer editing.
- Evidence: `src/app/app-schema.ts` omits `panels.layers`; `src/app/app-performance.ts` records one renderer layer as a product renderer inventory item, not a user-editable Layers panel entity.

### Controls

- Decision: Product controls are grouped as Source Image, Source Video, Pattern, Motion, Dither, Background, Image Export, Video Export, and sticky Export actions; both source sections contain their upload and an independent related `Invert` checkbox in explicit standalone sections.
- Reason: Each section maps to a product entity or workflow stage rather than control type; Source Image owns the still fallback upload, Source Video owns the animated override upload, and Background directly precedes export settings as required.
- Evidence: `starterControlSectionInventory` in `src/app/app-acceptance.ts` mirrors `source.image`, `source.image.invert`, `source.video`, and `source.video.invert`, plus `pattern.spacing`, `pattern.voids`, `pattern.particleType`, and `dither.contrast`; every visible control has `performanceRole`, `defaultValue`, and an acceptance row, and the Particle select covers Crosses, Mini dots, Hachures, and Mixed.

### Export

- Decision: Provide Export SVG, Export PNG, and Export Video footer actions; PNG/JPG uses Image Export settings, GIF/MP4/WebM uses Video Export settings, and all exports consume the uploaded source video plus its inversion when present or the uploaded source image fallback plus its independent inversion when no video is present.
- Reason: The user explicitly requested SVG stills and MP4 video, now including image/video source dithering, while the Toolcraft contract requires animated apps to include Export PNG and Export Video with standard settings.
- Evidence: `src/app/ascii-export.ts` reads `source.video`, `source.image`, `export.image.format`, `export.image.resolution`, `export.video.format`, and `export.video.resolution`; PNG uses `createToolcraftPngExportCanvas({ includeBackground, resolution })`; MP4/WebM uses `getToolcraftVideoExportSize`, `MediaRecorder.isTypeSupported`, and recorder error handling; GIF uses the same size helper, deterministic timeline frames, exact centisecond delays, a shared adaptive palette, and parallel module workers; browser acceptance reads the actual GIF header, dimensions, delays, loop extension, palette size, and compressed byte count.

### Performance

- Decision: Guarantee decoded-frame source-video playback at 1920x1080 and 24 fps, plus documented dense-stress targets for scale 6, spacing 0, voids 0, density 100, threshold 0.1/0.2, hatch particle switching, render scale 2, and 1920x1080 media import; expose combined all-maximum states and spacing down to -8 as experimental art-direction ranges above their measured smooth targets.
- Reason: Native source cadence directly covers the reported stutter; the remaining scenarios represent the heaviest useful preview and interaction states for the dense ASCII text-output renderer without silently reducing canvas backing resolution.
- Evidence: `src/app/app-performance.ts` declares a decoded-frame playback scenario plus `loadProfile` hard limits, smooth targets, measured degradation evidence, and workload fixtures; browser coverage measures presented-frame cadence, control drag, animation frames, animated viewport drag, zoom, media import, and exports.

## Evidence

- Source reviewed: video reference MOV metadata, extracted frame storyboard, contact sheet, local Toolcraft docs, runtime fileDrop image/file behavior, media transform actions, export helpers, timeline loop helper, CanvasShell behavior, controls panel action handler, and performance helpers.
- Video Reference Study: storyboard frames f000, f002, f004, f006, f008, and f010; transition analysis f000-f002, f002-f004, f004-f006, f006-f008, and f008-f010; behavior decomposition maps fixed black canvas, ASCII grid cells, block islands, wave bands, particle glyphs, and breathing loop to Toolcraft renderer and acceptance rows.
- Contract applied: runtime shell through `ToolcraftApp`; product output only in `canvasContent`; timeline playback for animation/video export; Background/Image Export/Video Export sections; performance fixtures read from `app-performance.ts`.

## Verification

- Run: `pnpm ai:check` passed.
- Run: `pnpm verify:final` passed.
- Run: `pnpm verify:perf` passed with playwright-fallback because no separate agent-browser control tool was available for this Toolcraft app.
- Run: Post-first-working hatch/default iteration passed targeted unit tests, `pnpm verify:quick`, `pnpm build`, targeted browser Pattern/Dither acceptance, and targeted particle-type performance.
- Run: Post-first-working spacing-default iteration passed targeted unit tests, `pnpm verify:quick`, `pnpm build`, targeted browser Pattern acceptance, and targeted Spacing performance.
- Run: Post-first-working extended negative spacing iteration passed targeted unit tests, `pnpm verify:quick`, `pnpm build`, targeted browser Pattern acceptance, and targeted Spacing performance.
- Run: Post-first-working organic void-control iteration passed targeted unit tests, `pnpm verify:quick`, `pnpm build`, targeted browser Pattern acceptance, and targeted Voids performance.
- Run: Post-first-working `-8px` spacing-range iteration passed targeted unit tests, `pnpm verify:quick`, `pnpm build`, targeted browser Pattern acceptance, and targeted Spacing performance.
- Run: Source-image iteration passed targeted unit tests (`node_modules/.bin/vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`), `npm run ai:check`, `npm test`, `npm run build`, targeted browser source upload/transform/clear/reset/SVG/video acceptance, and targeted browser media-import performance.
- Run: Source-video iteration passed `npm run ai:check`, `npm test`, `npm run build`, targeted browser source-video upload/clear/reset/timeline/SVG/video acceptance, and targeted browser source-video media-import performance.
- Run: Source section-label iteration passed targeted schema/acceptance tests, targeted browser source image/video acceptance, and `npm run build`.
- Run: Source-video auto-level iteration passed `npm run typecheck`, targeted browser source-video and dark-video acceptance, targeted browser source-video performance, `npm test`, and `npm run build`.
- Run: Cross-thickness iteration passed `npm run typecheck`, targeted app schema test, `npm test`, `npm run build`, and targeted browser Pattern plus footer export acceptance.
- Run: Cross-weight restore iteration passed `npm run typecheck`, targeted app matrix tests, `npm test`, `npm run build`, and targeted browser Pattern plus footer export acceptance.
- Run: Video export duration-lock iteration passed `npm run typecheck`, targeted app matrix tests, and targeted browser source-video plus video-duration export acceptance.
- Run: Video export playback-fallback iteration passed `npm run typecheck`, targeted app matrix tests, and `npm run build`; the separate browser-server permission returned an out-of-credits error before targeted export exercise startup.
- Run: Video export freeze-fix iteration passed `npm run typecheck`, targeted app matrix tests, targeted browser source-video export checks, targeted browser export performance check, and `npm run build`.
- Run: Depth-control iteration passed `pnpm verify:quick` (219 app tests), `pnpm build`, real-browser min/max visual comparison, targeted SVG depth acceptance, and targeted Depth control-drag performance.
- Run: Optimized-GIF iteration passed `pnpm verify:quick` (219 app tests plus Toolcraft checks), `pnpm typecheck`, `pnpm build`, real-browser GIF byte/metadata acceptance at 1920x1080, and the targeted optimized-GIF export performance scenario.
- Run: Stronger-depth iteration passed `pnpm verify:quick` (219 app tests plus Toolcraft checks), `pnpm build`, real-browser 1440x900 visual QA, targeted Dither SVG color/size/cross-stroke acceptance, and targeted Depth control-drag performance.
- Run: Media-linked tonal-depth correction passed `pnpm verify:quick` (220 app tests plus Toolcraft checks), `pnpm build`, measured grayscale regression coverage, real-browser 1440x900 tonal-gradient visual QA, targeted image/video and SVG acceptance, and targeted Depth control-drag performance.
- Run: Extended tonal-depth iteration passed `pnpm verify:quick` (220 app tests plus Toolcraft checks), `pnpm build`, targeted browser Depth `0/2/3` SVG acceptance, and targeted Depth control-drag performance.
- Run: Horse-coat shadow-detail correction passed `pnpm verify:quick` (221 app tests plus Toolcraft checks), `pnpm build`, five-frame reference study and luminance measurements, real-browser supplied-video comparison at Depth `3`, targeted bimodal dark-source SVG acceptance, source-video animation/export acceptance, and dark-source Depth control-drag performance.
- Run: Continuous shadow-depth iteration passed `pnpm verify:quick` (221 app tests plus Toolcraft checks), `pnpm build`, supplied-video same-frame Depth `0/1/2/3` comparison, monotonic dark-media unit/SVG acceptance, source-video animation/export acceptance, and dark-source Depth control-drag performance.
- Run: Native-cadence source-video correction passed `pnpm verify:quick` (221/221 app tests plus Toolcraft checks), `pnpm build`, targeted source-video upload/play/pause/scrub/reset acceptance, and `pnpm verify:perf` with 29/29 sequential browser scenarios including the 1920x1080 24 fps decoded-frame cadence fixture. Playwright fallback was used for the deterministic file-upload and frame-probe suite; the agent-controlled in-app browser completed final visual QA at 1920x1080 with resolution scale 2, a visible 7680x4320 backing canvas, the correct product title, and no console warnings or errors.
- Run: Source-image inversion passed `pnpm verify:quick` (222/222 app tests plus Toolcraft checks), `pnpm build`, targeted Chromium preview/SVG/reset acceptance, and the targeted inversion responsiveness scenario.
- Run: Source-video inversion passed `pnpm verify:quick` (223/223 app tests plus Toolcraft checks), `pnpm build`, targeted Chromium video preview/SVG/scrub/reset acceptance, and the targeted video-inversion responsiveness scenario.
- Note: Direct `pnpm verify:quick` was not used in this desktop session because `pnpm` is not exposed in PATH and the script recursively calls `pnpm`; equivalent local checks passed with npm and local Playwright/Vitest binaries.
- Browser: fallback Playwright tests cover controls, product observable changes, SVG/image/video exports, timeline duration metadata, persistence reload, and performance scenarios.

## Risks

- Risk: Standard MP4 export needs a WebCodecs H.264 encoder; without one the app falls back to MediaRecorder MP4 (fragmented) and then to WebM when `MediaRecorder.isTypeSupported` rejects MP4.
### Iteration 14 — Framer Interactive Video Component

- Request: Begin a React Code Component for the agency's Framer site, using a background video that reacts to pointer and mobile touch interaction.
- Task type: Tier 3 standalone website-renderer addition; no Toolcraft runtime or product-schema change.
- User-visible result: Added a Framer-selectable video with an interactive ASCII overlay, pointer/touch inertia, Repel/Reveal/Wave modes, idle motion, responsive quality, and reduced-motion behavior.
- Source/reference checked: Current Canvas 2D ASCII renderer and source-video sampler, current package dependencies, Framer Code Component, Property Controls, file asset, and auto-sizing documentation.
- Reference inputs: The user's approved interactive-video direction; no new visual reference media.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md`; required skills `brainstorming` and `writing-plans`.
- Contract rules applied: `renderer-technique-inventory`, `performance-coverage-levels`, `canvas-no-app-ui`, and `workflow-required` where applicable; the component remains outside Toolcraft state and surfaces.
- Decision: Build a self-contained Framer component using an HTML video layer, grid-resolution Canvas 2D luminance sampling, and a glyph overlay whose single interaction field is updated independently from video decode.
- Alternatives rejected: Per-glyph DOM animation was rejected because glyph count is too high; full-resolution Canvas pixel distortion was rejected for the first version because it increases mobile cost; WebGL is reserved for a later fluid-video displacement version.
- State/output mapping: Framer Property Controls map source, motif, composition, interaction, and quality props directly to the live component. Pointer/touch input updates transient renderer state only and does not mutate Toolcraft state.
- Files changed: Superseded by the fidelity-corrected `framer/ChevalNoirDither.tsx`; initial tests and preview harness retained and updated in Iteration 15.
- Verification: `pnpm ai:check`, `pnpm verify:quick` (223 Toolcraft tests), and `pnpm build` passed; the focused Framer component suite passed 4/4 tests; standalone Framer bundle and local preview production build passed; agent-controlled Chromium verification passed on 1440x900 desktop and 390x844 touch/mobile layouts, including decoded video, visible glyph output, pointer/touch field movement, 60/30 FPS targets, and zero uncaught page errors.
- Skipped checks: The full Toolcraft performance checkpoint is not required because the existing Toolcraft renderer, schema, controls, canvas, timeline, exports, and runtime are unchanged. The new standalone renderer received focused desktop/mobile browser coverage instead.
- Risks: External video URLs without suitable CORS headers cannot be sampled; Framer's file picker is the supported path.

### Iteration 15 — Framer Renderer Fidelity Correction

- Request: Correct the Framer component because its generic ASCII-photo output does not match the established rendering at `https://chevalnoirdither.vercel.app/`.
- Task type: Tier 3 visual mismatch and standalone renderer correction.
- User-visible result: The Framer component now uses CHEVAL NOIR's geometric particles, organic void field, palette, threshold/density model, and defaults, with video acting as a luminance source and the raw video always hidden.
- Source/reference checked: User screenshot of the mismatched Framer output, live published CHEVAL NOIR page at 1440x900, local `ascii-pattern.ts`, app schema defaults, renderer spec, and existing browser evidence.
- Reference inputs: `https://chevalnoirdither.vercel.app/` and `/var/folders/82/tv61vryj3bd9t7hvnqzfp96h0000gn/T/TemporaryItems/NSIRD_screencaptureui_aPVlxW/Capture d’écran 2026-09-04 à 11.03.26.png`.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md`; required skills `systematic-debugging`, `brainstorming`, and `writing-plans`.
- Contract rules applied: `reference-clone-source-of-truth`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required` where applicable to the standalone component.
- Decision: Port the established field model directly rather than tuning the generic character-ramp prototype. The component is named `ChevalNoirDither`, uses the exact default model when no video is selected, and keeps transient pointer/touch deformation downstream and disabled by default.
- Alternatives rejected: Merely changing the glyph string or opacity was rejected because the mismatch comes from the field model, raw-video underlay, color mapping, and glyph geometry together; screenshot-only imitation was rejected because the local published renderer source is available.
- State/output mapping: Framer controls mirror CHEVAL NOIR particle type, scale, spacing, density, voids, dither threshold, strength, contrast, palette, and media invert values; interaction mode/radius/strength/inertia then modifies the final particle positions or visibility.
- Files changed: `framer/ChevalNoirDither.tsx`, `framer/ChevalNoirDither.test.ts`, `framer/README.md`, `framer-preview/main.tsx`, `framer-preview/interaction.spec.ts`, `docs/framer-interactive-video-plan.md`, and `docs/toolcraft/agent-worklog.md`.
- Verification: Focused component suite passed 4/4; standalone Framer bundle and preview production build passed; Chromium comparison passed for procedural desktop, interactive desktop/mobile, and media-source output with no raw-video visibility and no uncaught page errors. Visual inspection matched the published page's cross geometry, organic voids, background, density, and particle palette.
- Skipped checks: Full performance checkpoint is not required for this post-first-working non-performance edit because the Toolcraft renderer was used as source of truth but not modified; targeted Framer desktop/mobile renderer checks cover the new standalone surface.
- Risks: The standalone component duplicates the portable renderer math because Framer cannot import the Toolcraft app module directly; future changes to `src/app/ascii-pattern.ts` should be mirrored deliberately.

### Iteration 16 — Framer Cursor Activation and Latency Correction

- Request: Diagnose why cursor hover produced no response, then remove the visible lag between the real cursor and particle interaction.
- Task type: Tier 3 standalone renderer interaction regression and Framer-instance correction.
- User-visible result: The selected Framer instance is interactive, and zero inertia is defined as immediate pointer tracking rather than a slow spring.
- Source/reference checked: The user’s 5.18-second screen recording, six extracted storyboard frames, the live Framer `TEASING PAGE` project, selected component Property Controls, and the interaction spring implementation.
- Reference inputs: `/var/folders/82/tv61vryj3bd9t7hvnqzfp96h0000gn/T/TemporaryItems/NSIRD_screencaptureui_CiJauL/Enregistrement de l’écran 2026-09-04 à 11.15.53.mov`.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `assembly-workflow.md`, `acceptance-testing.md`; required skills `systematic-debugging`, `brainstorming`, `writing-plans`, and `computer-use`.
- Contract rules applied: `video-reference-analysis`, `reference-clone-source-of-truth`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required` where applicable to the standalone component.
- Root cause: `Interactive` was set to `No` on the live Framer instance. After activation, `Inertia = 1` mapped to a weak spring (`0.025`) and very high damping (`0.955`), creating substantial positional delay; the old mapping also retained spring delay at `Inertia = 0`.
- Decision: Keep exact CHEVAL NOIR rendering at rest, enable interaction for new instances, make zero inertia copy the target coordinates immediately, and reserve bounded spring smoothing for positive values only.
- Alternatives rejected: Increasing interaction strength was rejected because it changes displacement amplitude rather than tracking latency; reducing video quality was rejected because the pointer lag comes from coordinate smoothing, not decode resolution.
- State/output mapping: `Interactive` gates the local influence field; pointer/touch updates `targetX/targetY`; inertia `0` maps rendered `x/y` directly to the target, while positive inertia maps through the spring; renderer geometry and video sampling remain unchanged.
- Verification tier: Tier 3. Run focused Framer tests, standalone component bundle, desktop/mobile browser interaction checks, `pnpm verify:quick`, and `pnpm build`; skip the full Toolcraft performance suite because Toolcraft runtime and renderer are unchanged, but measure the touched interaction path.
- Verification: The focused component contract suite passed 5/5; the standalone Framer preview production build passed; desktop and mobile browser scenarios passed 3/3 applicable cases, asserting `Interactive = true`, a rendered-to-target cursor delta below 1 px at zero inertia, a non-zero locally influenced particle count, 60 fps desktop target, 30 fps mobile target, and video-source rendering without raw footage. `pnpm verify:quick` passed with 223/223 Toolcraft app tests and `pnpm build` passed. Direct Framer inspection confirmed the selected instance remains `Interactive = Yes`, `Inertia = 0`, the corrected zero-inertia branch and bounded spring coefficients were saved in `InteractivePattern.tsx`, and the page/component preview recompiles without a component error.
- Risks: Existing Framer instances preserve their explicit `Interactive` value; the selected live instance has been set to `Yes`.

### Iteration 17 — Framer Scroll-Follow Correction

- Request: Replace the apparently automatic/random movement with interaction that visibly follows real page scrolling on desktop and touch scrolling on mobile.
- Task type: Tier 3 standalone renderer interaction regression; scroll input, animation state, and browser behavior change while the CHEVAL NOIR field model remains unchanged.
- User-visible result: Idle motion is off by default, zero inertia stays immediate, and scroll events move the interaction field from the last real pointer/touch viewport position (or the viewport center before the first input).
- Source/reference checked: Live Framer instance values and the standalone component pointer/render loop. The selected instance had `Idle Motion = Yes` and `Inertia = 0.54`, while the component had no scroll listener.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, renderer/performance/acceptance contracts; required skills `systematic-debugging`, `brainstorming`, and `writing-plans`.
- Root cause: The renderer only updated its interaction target from pointer events. During native page scroll, touch pointer delivery can be cancelled, while the enabled idle oscillator continued producing an autonomous trajectory; positive inertia then amplified the perceived mismatch.
- Decision: Treat captured window/nested-container scroll as a short-lived real interaction, recompute local coordinates from the last client-space pointer/touch anchor on every scroll event, never recenter an inactive pointer, and leave autonomous motion as an explicit opt-in only.
- Alternatives rejected: Mapping interaction to an arbitrary accumulated scroll phase was rejected because it would not remain spatially tied to the user’s finger/cursor; preventing native touch scroll was rejected because the selected `Page Scroll` behavior must remain native.
- State/output mapping: Pointer/touch updates client-space and local targets; scroll recomputes the same local targets against the component’s new bounding rectangle; `scrollActiveUntil` keeps influence active only during the gesture; `Idle Motion` alone gates the optional oscillator.
- Verification tier: Tier 3. Run focused component tests, preview build, desktop/mobile browser scroll acceptance, `pnpm verify:quick`, and `pnpm build`. Skip the full Toolcraft performance suite because the Toolcraft renderer/runtime is unchanged; the touched Framer interaction path receives focused browser timing coverage.
- Files changed: `framer/ChevalNoirDither.tsx`, `framer/ChevalNoirDither.test.ts`, `framer-preview/main.tsx`, `framer-preview/interaction.spec.ts`, `framer/README.md`, and this worklog; the same behavior was mirrored into the live Framer `InteractivePattern.tsx` component and selected instance.
- Verification: Focused component tests passed 5/5; the standalone Framer preview production build passed; desktop and mobile Chromium interaction coverage passed 5 applicable tests with 3 project-specific skips, including a measured 160 px native page scroll, same-frame zero-inertia tracking, non-zero particle influence, touch input, and media rendering. `pnpm verify:quick` passed with 223/223 app tests and `pnpm build` passed. The live Framer code component saved without a compile error and the selected instance was verified at `Interactive = Yes`, `Inertia = 0`, `Idle Motion = No`, and `Touch = Page Scroll`.
- Skipped checks: The full Toolcraft performance checkpoint is not required for this post-first-working standalone Framer edit because Toolcraft runtime, schema, renderer, canvas, timeline, and exports are unchanged; focused browser timing covers the touched interaction path.
- Risks: Existing Framer instances retain explicit property values, so other previously placed instances should also use `Idle Motion = No` and `Inertia = 0` when deterministic scroll-follow behavior is desired.

### Iteration 18 — Framer Background Hit-Testing Correction

- Request: Keep the interactive component as the last/background layer in Framer while preserving cursor interaction through all foreground text, navigation, and visual layers.
- Task type: Tier 3 standalone renderer input-routing correction; the visual field, layer order, links, and foreground hit targets must remain unchanged.
- User-visible result: Cursor and touch input reach the background effect anywhere inside its bounds even when another Framer layer is visually above it, while foreground links and controls remain clickable.
- Source/reference checked: User screenshot of the Framer layer stack and the component’s element-local pointer handlers.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, renderer/performance/acceptance contracts; required skills `systematic-debugging`, `brainstorming`, and `writing-plans`.
- Root cause: Element-local `onPointerMove` only receives events when the background wins browser hit-testing. Foreground layers correctly win that hit test, so the background never receives the cursor event.
- Decision: Add passive window-level pointer listeners in capture phase, test the pointer against each component instance’s bounds, and update the same transient pointer field without stopping propagation or preventing defaults. Keep the existing element handlers for direct/captured touch behavior.
- Alternatives rejected: Moving the background above content was rejected because it breaks visual stacking; applying `pointer-events: none` to all foreground layers was rejected because it disables links and buttons; a transparent top proxy layer was rejected because it duplicates page structure and still competes with interactive content.
- State/output mapping: Captured client-space pointer coordinates are converted to component-local coordinates; mouse activity is enabled only inside component bounds; touch remains active during its gesture and scroll continues through the existing Page Scroll path.
- Verification tier: Tier 3. Add a foreground interception fixture, verify same-frame interaction through it on desktop, retain mobile/scroll coverage, run focused component tests, preview build, `pnpm verify:quick`, and `pnpm build`; no full Toolcraft performance checkpoint because its runtime and renderer are unchanged.
- Files changed: `framer/ChevalNoirDither.tsx`, `framer/ChevalNoirDither.test.ts`, `framer-preview/interaction.spec.ts`, `framer/README.md`, and this worklog; the passive capture listeners were mirrored into the live Framer `InteractivePattern.tsx` component.
- Verification: Focused component tests passed 5/5; the standalone Framer preview build passed; desktop/mobile Chromium coverage passed 6 applicable tests with 4 project-specific skips. The new foreground interception test proves the top layer receives its click while the background target simultaneously tracks the exact pointer coordinates. The live Framer component saved and rendered without a compile error.
- Skipped checks: The full Toolcraft performance checkpoint is not required for this post-first-working standalone Framer interaction edit because Toolcraft runtime, schema, renderer, canvas, timeline, and exports are unchanged.
- Risks: None for ordinary Framer layers; content rendered inside a separate cross-origin iframe cannot expose its internal pointer coordinates to the parent window, although the outer iframe surface still participates in normal hit-testing.

### Iteration 19 — Framer Non-Bouncy Pointer Smoothing

- Request: Remove the dry rebound/overshoot after particle movement while retaining a smooth, premium trailing response.
- Task type: Tier 3 standalone renderer motion correction; pointer interpolation changes without altering the CHEVAL NOIR field, media sampling, layer routing, or controls.
- User-visible result: Positive Inertia eases toward the real pointer smoothly and monotonically, with no overshoot or velocity rebound; Inertia zero remains immediate.
- Source/reference checked: Current Framer instance (`Inertia = 0.15`) and the component’s velocity spring/damping loop.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, renderer/performance/acceptance contracts; required skills `systematic-debugging`, `brainstorming`, and `writing-plans`.
- Root cause: The under-damped velocity integrator accumulates momentum, crosses the target, then reverses direction. Low positive inertia makes that correction especially short and visually dry.
- Decision: Replace velocity integration with frame-rate-independent exponential smoothing. Map Inertia to a bounded time constant, keep the zero-inertia direct branch, and clear legacy velocities so no stored momentum can reappear.
- Alternatives rejected: Raising damping inside the spring was rejected because it remains sensitive to frame cadence and parameter combinations; clamping after overshoot was rejected because it creates a visible hard stop; forcing Inertia to zero was rejected because it removes the user’s requested smooth trail.
- State/output mapping: `Inertia = 0` copies target coordinates; positive Inertia maps to a 24–204 ms exponential time constant and advances by `1 - exp(-elapsed / timeConstant)` each rendered frame.
- Verification tier: Tier 3. Add a monotonic/no-overshoot browser assertion at positive inertia, retain zero-inertia, scroll, foreground-layer, touch, and media cases, run focused tests, preview build, `pnpm verify:quick`, and `pnpm build`; skip the full Toolcraft performance checkpoint because its renderer is unchanged.
- Files changed: `framer/ChevalNoirDither.tsx`, `framer/ChevalNoirDither.test.ts`, `framer-preview/main.tsx`, `framer-preview/interaction.spec.ts`, `framer/README.md`, and this worklog; the same interpolation was mirrored into the live Framer `InteractivePattern.tsx` component.
- Verification: Focused component tests passed 6/6; the standalone Framer preview build passed; desktop/mobile Chromium coverage passed 7 applicable tests with 5 project-specific skips. The positive-inertia test sampled 24 animation frames and proved monotonic convergence without crossing the pointer target, while zero-inertia, foreground interception, native scroll, touch, and video-source cases remained green. The live Framer component saved and rendered without a compile error.
- Skipped checks: The full Toolcraft performance checkpoint is not required for this post-first-working standalone Framer motion edit because Toolcraft runtime, schema, renderer, canvas, timeline, and exports are unchanged.
- Risks: High Inertia values intentionally add more delay, but the new interpolation cannot overshoot or rebound at any value in the exposed 0–1 range.

### Iteration 20 — Framer Video Crop Controls

- Request: Add Framer-native controls to crop and reframe the selected video directly from the component panel.
- Task type: Tier 3 standalone renderer/media behavior addition; video sampling geometry and Framer Property Controls change while the particle field and interaction remain unchanged.
- User-visible result: The component exposes Video Fit (`Crop` or `Contain`), Video Zoom, Crop X, and Crop Y. Defaults reproduce the existing centered cover crop exactly.
- Source/reference checked: Current grid-resolution video sampling function, live Framer component panel, and selected media flow.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, renderer/performance/acceptance contracts; required skills `brainstorming`, `writing-plans`, and `systematic-debugging` for regression prevention.
- Decision: Apply crop geometry while drawing the decoded frame into the small luminance-sampling canvas. Use component dimensions as the crop window, cover/contain base scale, 1–3× zoom, and normalized 0–100% alignment on both axes.
- Alternatives rejected: CSS `object-position` was rejected because the raw video is hidden and does not drive sampled pixels; full-resolution intermediate cropping was rejected because it adds unnecessary mobile cost; freeform source rectangles were rejected because four numeric edges are less usable in Framer than zoom plus focal position.
- State/output mapping: `videoFit` selects max/min base scale; `videoZoom` multiplies it; `videoPositionX/Y` align overflow or letterbox space; the resulting sampled luminance drives the existing particles and exports/preview behavior.
- Verification tier: Tier 3. Add source contracts and browser-observable crop state, verify centered defaults plus non-default zoom/position media rendering, retain interaction/mobile/scroll tests, run focused tests, preview build, `pnpm verify:quick`, and `pnpm build`; skip full Toolcraft performance because its renderer is unchanged.
- Files changed: `framer/ChevalNoirDither.tsx`, `framer/ChevalNoirDither.test.ts`, `framer-preview/main.tsx`, `framer-preview/interaction.spec.ts`, `framer/README.md`, and this worklog; matching types, sampling geometry, defaults, and Property Controls were mirrored into the live Framer `InteractivePattern.tsx` component.
- Verification: Focused component tests passed 6/6; the standalone Framer preview build passed; desktop/mobile Chromium coverage passed 8 applicable tests with 6 project-specific skips. The media-crop scenario rendered with `Contain`, `Zoom 1.8`, `Crop X 18%`, and `Crop Y 82%`, while the existing video, pointer, foreground-layer, smooth-inertia, scroll, and touch cases remained green. The live Framer component saved and rendered without a compile error.
- Skipped checks: The full Toolcraft performance checkpoint is not required for this standalone Framer media-framing addition because Toolcraft runtime, schema, renderer, canvas, timeline, and exports are unchanged; the crop is performed on the existing grid-resolution sampling canvas.
- Risks: `Contain` can intentionally introduce empty bands when source and component aspect ratios differ; `Crop` is the default for edge-to-edge backgrounds.

### Iteration 21 — Framer Particle Opacity Entrance

- Request: Reproduce the supplied reference’s smooth particle appearance as an opacity-only transition from 0% to 100%.
- Task type: Tier 3 standalone renderer entrance animation informed by a video reference; particle canvas presentation and Framer Property Controls change.
- User-visible result: Particles fade smoothly into view when the component enters the viewport, remain fully visible afterward, and can optionally replay after leaving and re-entering.
- Source/reference checked: User attachment `Enregistrement de l’écran 2026-09-04 à 14.06.00.mov`; corresponding 3-second recording inspected in QuickTime at seven timecodes from 0.0s through 3.0s.
- Video Reference Study: storyboard frames at 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, and 3.0 seconds show invisible, early, intermediate, near-final, and stable-final states; frame transitions show a continuous decelerating visibility rise with no rebound. The reference’s spatial/density propagation is intentionally omitted because the user explicitly requested only opacity 0%–100%.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `docs/toolcraft/assembly-workflow.md`, renderer/performance/acceptance contracts; required skills `brainstorming`, `writing-plans`, and `computer-use` for the reference inspection.
- Decision: Animate only the particle canvas CSS opacity through a viewport-triggered state change, use a non-overshooting cubic-bezier ease, expose Entrance/Duration/Delay/Replay, show 100% in the Framer canvas, and resolve instantly under reduced motion.
- Animation intent: One-shot autonomous decorative entrance; no playback, scrub, loop, keyframes, restart command, or video export, so no timeline is added.
- Alternatives rejected: Page-level Framer variants were rejected because they duplicate breakpoint wiring and cannot remain encapsulated with the particle renderer; per-particle opacity staggering was rejected because the user narrowed the request to a smooth global opacity fade; changing density was rejected because it alters the motif.
- State/output mapping: IntersectionObserver toggles transient reveal state; Entrance gates it; Duration and Delay map to the CSS transition; Replay resets only after leaving the viewport; video sampling, pointer interaction, and particle geometry continue independently.
- Verification tier: Tier 3. Add initial/intermediate/final opacity browser assertions, replay and reduced-motion coverage, retain media/crop/pointer/scroll/touch checks, run focused component tests, preview build, `pnpm verify:quick`, and `pnpm build`; skip full Toolcraft performance because its renderer is unchanged.
- Files changed: `framer/ChevalNoirDither.tsx`, `framer/ChevalNoirDither.test.ts`, `framer-preview/main.tsx`, `framer-preview/interaction.spec.ts`, `framer/README.md`, the reference study/plan, and this worklog. Matching entrance behavior and controls were added to the live Framer `InteractivePattern.tsx` component.
- Verification: Focused component tests passed 7/7 and the standalone build passed. Desktop/mobile Chromium coverage passed 10 applicable cases with 8 project-specific skips, including measured initial opacity `0`, a strict intermediate opacity between `0` and `1`, final opacity `1`, and immediate reduced-motion rendering with a `0s` transition; pointer, upper-layer interception, non-overshooting inertia, scroll, touch, video-source, and crop cases remained green. Live Framer inspection confirmed the selected `ChevalNoirDither` instance exposes `Entrance = Yes`, `Fade Duration = 1.8s`, `Fade Delay = 0s`, and `Replay = No`; Preview reload visibly showed the particles during their intermediate fade before reaching the full final state.
- Skipped checks: The full Toolcraft performance checkpoint is not required for this post-first-working standalone Framer presentation edit because Toolcraft runtime, schema, renderer workload, canvas, timeline, and exports are unchanged. The transition is compositor-only CSS opacity and the touched path has focused browser coverage.
- Risks: Existing Framer instances inherit the new defaults unless they later override the controls. `Replay = Yes` intentionally fades the canvas back out when it leaves the viewport; keep it off for the reference’s one-shot entrance.

### Iteration 22 — Independent Per-Particle Entrance Correction

- Request: Correct the previous whole-canvas fade so every particle independently fades from 0% to 100% of its own final visual value, matching the supplied reference behavior.
- Task type: Tier 3 visual-mismatch correction in the standalone Canvas 2D renderer; entrance timing and particle compositing change without changing the field topology, media sampling, pointer interaction, or Framer controls.
- Root cause: Iteration 21 applied CSS `opacity` to the canvas element, forcing every particle to share one composited opacity value and erasing the reference’s staggered individual appearance.
- Source/reference checked: The existing seven-frame Video Reference Study, the user’s explicit clarification, the canvas draw batching path, and the live Framer entrance controls.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md`, and `decision-contract.md`; required skills `systematic-debugging`, `brainstorming`, and `writing-plans`.
- Contract rules applied: `video-reference-analysis`, `reference-clone-source-of-truth`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required` where applicable to the standalone Framer surface.
- Decision: Remove canvas-level opacity animation. Track one viewport entrance clock, derive a stable per-cell delay from deterministic grid noise, ease each particle locally from zero to one, and batch drawing by color plus quantized opacity so the independent fades remain efficient.
- Control inventory: Keep the existing particle-entrance group unchanged—Entrance gates the behavior, Fade Duration controls the full convergence window, Fade Delay offsets the clock, and Replay resets the same deterministic particle sequence after exit.
- Animation intent: One-shot autonomous decorative particle entrance; no playback timeline, scrubber, keyframes, reverse, or export-at-time behavior.
- Alternatives rejected: Per-frame random alpha was rejected because it flickers and never reproduces a stable replay; changing density was rejected because it removes particles rather than fading their own values; drawing every particle as an individual fill call was rejected because color-plus-alpha buckets preserve the effect with bounded Canvas 2D state changes.
- State/output mapping: IntersectionObserver owns the entrance clock; each grid cell maps to a deterministic delay; global progress plus that delay maps to a local smooth opacity multiplier; final particle tone/color and all geometry remain unchanged.
- Verification tier: Tier 3. Replace CSS-opacity assertions with per-particle alpha-bucket acceptance, prove initial/mixed/final phases plus reduced motion, retain pointer/layer/inertia/scroll/touch/media/crop coverage, run focused tests, `pnpm verify:quick`, build, and live Framer Preview inspection. Skip the full performance checkpoint unless targeted frame behavior regresses because the particle workload and draw cadence remain bounded by the existing grid.
- Files changed: `framer/ChevalNoirDither.tsx`, its focused contract test, the standalone preview and browser acceptance, the Framer README, the corrected Video Reference Study, and this worklog. Equivalent per-particle compositing was applied to the live Framer `InteractivePattern.tsx` file.
- Verification: Focused component tests passed 7/7 and the production build passed. Desktop/mobile Chromium coverage passed all 10 applicable cases with 8 project-specific skips. Entrance acceptance proves the canvas itself remains at CSS opacity 1 with no CSS transition, begins with zero visible particle alpha, exposes more than two simultaneous per-particle opacity levels during the transition, and converges to one alpha level at exactly 1.0; reduced motion resolves immediately. Existing pointer, foreground interception, non-overshooting inertia, native scroll, touch, video, and crop tests remained green. Live Framer Preview was inspected at the selected instance’s preserved `Fade Duration = 3s` and `Fade Delay = 1s`: the first frame showed no particles, the intermediate frame showed independently varied particle strengths across the same fixed topology, and the final frame showed every particle at its own full tone.
- Skipped checks: The full Toolcraft performance checkpoint is not required for this post-first-working standalone Framer correction because Toolcraft runtime, schema, and export paths are unchanged. The renderer keeps the same eligible particle count and frame cadence; color-plus-24-alpha batching bounds compositing state changes, and the full standalone interaction suite exercised the animated path on desktop and mobile.
- Risks: Opacity is quantized to 24 levels to retain efficient Canvas 2D batching; this is visually smooth at the existing 30/60 fps targets while avoiding one fill call per particle.

### Iteration 23 — Sharper Two-Second Particle Cascade

- Request: Make the reference-based entrance more pronounced: approximately two seconds for the complete effect, but only a very short 0%–100% fade for each individual particle.
- Task type: Tier 3 visual timing correction in the standalone Canvas 2D particle renderer.
- Root cause: The previous `entranceStaggerSpan = 0.72` left 28% of the total duration for each particle’s local fade—roughly 560ms in a two-second sequence—so too many particles appeared to dissolve gradually together.
- Source/reference checked: The supplied entrance recording and its seven-frame study, the user’s timing clarification, the current per-cell entrance formula, and the live Framer instance.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, renderer/performance/acceptance and decision contracts; required skills `systematic-debugging`, `brainstorming`, and `writing-plans`.
- Decision: Set the entrance duration default to 2 seconds, distribute deterministic particle start times across the first 92% of that window, and reserve the final 8% (about 160ms) for each particle’s own smoothstep fade.
- Control inventory: Keep Entrance, Fade Duration, Fade Delay, and Replay unchanged; `Fade Duration` continues to control the complete sequence rather than the local per-particle fade.
- Alternatives rejected: Instant on/off particles were rejected because the user still requested individual 0%–100% fades; a 300–600ms local fade was rejected because it recreates the overly soft result; adding another designer control was rejected because the requested reference timing is specific and should remain simple.
- State/output mapping: The global entrance clock spans `Fade Duration`; deterministic offsets span 92% of its normalized progress; each particle maps the remaining 8% through smoothstep to its quantized opacity bucket.
- Verification tier: Tier 3. Assert the 2-second defaults and 8% local window in source tests, prove concurrent zero/partial/full particle states during browser playback, retain full interaction/media coverage, run `pnpm verify:quick` and build, then inspect the first, intermediate, and final states in live Framer Preview.
- Files changed: `framer/ChevalNoirDither.tsx`, `framer/ChevalNoirDither.test.ts`, `framer-preview/main.tsx`, `framer-preview/interaction.spec.ts`, `framer/README.md`, the Framer implementation plan, and this worklog. The same 92% stagger / 8% local fade timing and 2-second default were applied to the live Framer `InteractivePattern.tsx` component.
- Verification: Focused component tests passed 7/7, the production build passed, and the standalone desktop/mobile Chromium suite passed all 10 applicable cases with 8 project-specific skips. The strengthened entrance assertion proves that zero-opacity, partially faded, and fully visible particles coexist at mid-sequence while the canvas remains at CSS opacity 1. Live Framer inspection confirmed `Fade Duration = 2s` and `Fade Delay = 0s`; reloaded Preview frames showed a pronounced mixed on/off cascade followed by the fully resolved field.
- Skipped checks: The full Toolcraft performance checkpoint is not required for this post-first-working standalone Framer timing adjustment because the grid size, draw cadence, batching strategy, Toolcraft runtime, schema, and export paths are unchanged.
- Risks: The 24-level opacity quantization is more noticeable only within the deliberately short 160ms local fade, but at the existing 30/60 fps targets it presents as a crisp smooth reveal rather than a whole-field dissolve.

### Iteration 24 — Near-Instant Individual Particle Reveal

- Request: Make the already sharpened two-second particle entrance even more pronounced against the supplied reference.
- Task type: Tier 3 visual timing refinement in the standalone Canvas 2D particle renderer.
- Root cause: An 8% local window still lasts about 160ms at the two-second default, spanning roughly ten 60fps frames and leaving the individual fades visibly soft.
- Source/reference checked: The supplied entrance recording and its existing frame study, the live Framer Preview from Iteration 23, and the current deterministic per-cell timing formula.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md`, and `decision-contract.md`; required skills `systematic-debugging`, `brainstorming`, and `writing-plans`.
- Decision: Keep the full sequence at 2 seconds, spread deterministic start times across 97% of the duration, and compress each particle's smoothstep fade to 3%—about 60ms at the default.
- Control inventory: Entrance, Fade Duration, Fade Delay, and Replay remain unchanged; Fade Duration still represents the whole cascade.
- Alternatives rejected: A hard opacity step was rejected because it would remove the requested smooth 0%–100% transition; retaining 80–160ms was rejected because it still reads as a soft dissolve; changing density or tone was rejected because the issue is timing rather than motif structure.
- State/output mapping: The entrance clock and deterministic cell hash are unchanged; only the split between stagger span and local fade window changes from 92/8 to 97/3.
- Verification tier: Tier 3. Update source contracts and browser timing expectations, retain the complete interaction/media suite, run focused tests, `pnpm verify:quick`, build, and inspect the live Framer Preview.
- Files changed: `framer/ChevalNoirDither.tsx`, its focused contract test, the standalone README, the Framer implementation plan, and this worklog. The live Framer `InteractivePattern.tsx` timing split was updated to the same 97/3 values without changing instance settings.
- Verification: Focused component tests passed 7/7 and the production build passed. Desktop/mobile Chromium coverage passed all 10 applicable cases with 8 project-specific skips, including independent zero/partial/full particle alpha states; pointer, foreground interception, monotonic inertia, touch, scroll, video, and crop remained green. Live Framer Preview rendered successfully with the selected instance's user-set `Fade Duration = 1.3s`, producing an approximately 39ms local fade while preserving every other instance value.
- Skipped checks: The full Toolcraft performance checkpoint is not required for this post-first-working timing-only edit because the eligible particle count, frame cadence, renderer batching, runtime, schema, and export paths are unchanged.
- Risks: At low Fade Duration values the 3% window approaches a frame or two, intentionally reading as a crisp reveal; smoothstep still prevents a hard discontinuity whenever the display samples an intermediate frame.

### Iteration 25 — Directional Particle Entrance

- Request: Let the same independent particle-entrance effect sweep spatially from bottom to top, while exposing bottom/top and left/right directions in Framer.
- Task type: Tier 3 renderer and component-control feature; one new enum maps to Canvas 2D compositing order without changing particle count, geometry, media sampling, or interaction behavior.
- Source/reference checked: Existing individual-particle entrance study, prior live Framer Preview, current hash-only offset formula, and the user's explicit spatial-order request.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, renderer, performance, acceptance, and decision contracts; required skills `systematic-debugging`, `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `controls-product-coverage`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Add an Entrance Direction enum with bottom-to-top as default. Derive the start offset from a normalized cell axis, retain a small deterministic cross-axis jitter, preserve the existing 97% stagger and 3% local fade, and report the visible-particle centroid so browser tests can prove each direction semantically.
- Control inventory: Existing Entrance group gains one semantic Enum—Entrance Direction—shown only when Entrance is enabled. No layer, timeline, persistence, or export path changes because this is a one-shot autonomous decorative animation.
- Alternatives rejected: A pure hash offset was rejected because it cannot express direction; a perfectly rigid scanline was rejected because it loses the reference's independent-particle quality; a second duration/easing control was rejected because direction should reuse the established timing.
- State/output mapping: Direction maps `cell.x/y` to normalized progress; that progress and bounded deterministic jitter map to each particle's local smoothstep start time. The final opacity multiplier remains 1 for every direction.
- Verification tier: Tier 3. Add component/source contracts plus desktop browser assertions that the visible centroid is in the requested canvas half at matching intermediate timing for all four directions; retain complete interaction/media coverage, run focused tests, `pnpm verify:quick`, build, and inspect the live Framer property control and Preview. Full performance is skipped unless this O(1)-per-cell axis calculation produces a measured regression.
- Files changed: `framer/ChevalNoirDither.tsx`, `framer/ChevalNoirDither.test.ts`, `framer-preview/main.tsx`, `framer-preview/interaction.spec.ts`, `framer/README.md`, the Framer implementation plan, and this worklog.
- Verification: Focused component tests passed 7/7; the production build passed; and the standalone desktop/mobile Chromium suite passed all 11 applicable cases with 9 project-specific skips. The new directional scenario uses the real rendered canvas and, at the same intermediate progress, proves the visible-particle centroid sits in the requested lower, upper, left, or right half for every exposed value. Pointer, foreground interception, inertia, touch, scroll, media sampling, and crop coverage remained green. `pnpm verify:quick` also passed with 223 Toolcraft tests.
- Skipped checks: The full Toolcraft performance checkpoint is not required for this post-first-working visual-order feature: each cell adds only bounded scalar axis math and no particles, canvases, media reads, frames, or render passes are added. The live Framer component was subsequently synchronized and its selected instance exposes `Entrance Direction = Bottom → Top` alongside all four enum options; Desktop Preview renders successfully. A separate existing breakpoint instance still reports `ChevalNoirDither Component file does not exist`, which is outside the selected component's live update and requires a dedicated instance/file relink repair.
- Risks: The small deterministic 3.5% cross-axis jitter makes each sweep organic rather than a rigid straight line; it is deliberately bounded below the directional span so no opposite edge can appear first.

### Iteration 26 — Fast, Soft Directional Entrance

- Request: Make the directional entrance faster overall but smoother, avoiding the current visibly drawn, abrupt scanline.
- Task type: Tier 3 visual-timing correction in the Canvas 2D entrance path and selected Framer instance.
- Root cause: The 97% direction span makes the wave consume nearly the complete duration, while a 3% local fade is only 39ms at the selected 1.3-second value; together they create a slow but sharp line.
- Source/reference checked: Current selected Framer instance (`Fade Duration = 1.3s`), live directional behavior, existing 97/3 timing split, and the user's smoothness feedback.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, renderer/performance/acceptance and decision contracts; required skills `systematic-debugging`, `brainstorming`, `writing-plans`, and `browser`.
- Decision: Use the selected instance at 0.8 seconds; rebalance the local code to an 88% spatial span, 6% deterministic cross-axis jitter, and 12% per-particle smoothstep fade (~96ms at 0.8 seconds).
- Alternatives rejected: Retaining the 3% local fade was rejected because it remains a near-step at 60fps; merely reducing Fade Duration was rejected because that makes the same hard line faster; removing direction jitter was rejected because it reinforces the scanline artifact.
- State/output mapping: Fade Duration changes the full clock only; the 88/6/12 split maps each cell’s directional coordinate and fixed jitter into a softened per-particle smoothstep without changing final opacity, media, density, or interaction behavior.
- Verification tier: Tier 3. Update timing source contracts and directional browser assertions, retain interaction/media coverage, run focused tests, browser preview, `pnpm verify:quick`, and build; skip full performance because the number of cells and draw operations remain unchanged.
- Files changed: `framer/ChevalNoirDither.tsx`, `framer/ChevalNoirDither.test.ts`, `framer-preview/main.tsx`, `framer/README.md`, `docs/framer-interactive-video-plan.md`, and this worklog.
- Verification: Focused component contracts passed 7/7; the production build passed; `pnpm verify:quick` passed with 223 Toolcraft tests; and the standalone Chromium suite passed all 11 applicable desktop/mobile scenarios with 9 intentional project skips. The directional scenario still proves the correct edge releases first, while the independent-alpha scenario covers the softened local fade.
- Skipped checks: The full performance checkpoint is not required for this post-first-working non-performance edit because the per-cell workload, canvas size, draw cadence, and alpha-bucket batching are unchanged. The standalone component test and real browser coverage validate the changed Canvas path.
- Live synchronization: Framer Agent applied the equivalent `InteractivePattern.tsx` update: 88% directional sequence, 12% individual fade, ±6% stable jitter, and a `Fade Duration` default of `0.8`; it also preserved the existing Contrast default. Existing instance values remain intentionally unchanged.
- Risks: Existing Framer instances keep their authored duration. An existing 1.3-second instance therefore has a ~156ms local fade, while the recommended 0.8-second instance has a ~96ms local fade.

### Iteration 27 — Restore Random Particle Entrance

- Request: Restore the preferred organic random particle-loading version rather than the directional sweep.
- Task type: Tier 3 visual-order correction in the standalone and live Framer Canvas 2D entrance paths.
- Decision: Remove the `Entrance Direction` prop and Framer control. Each cell now derives a replay-stable start offset from `hashNoise(column, row, 97)` across 88% of the full clock and uses the remaining 12% for its own smoothstep fade; the 0.8-second default remains unchanged.
- Alternatives rejected: Keeping an unused direction selector was rejected because it misrepresents the active behavior; per-replay randomization was rejected because the effect must not flicker or change unpredictably on redraw.
- State/output mapping: `Fade Duration` still controls the full entrance sequence, `Fade Delay` still offsets it, and `Replay` retains its observer-driven behavior. Direction no longer influences a particle start time.
- Verification tier: Tier 3. Update source contracts and the real-browser entrance assertion, run focused component tests, production build, complete standalone browser coverage, and `pnpm verify:quick`; skip full performance because the per-cell workload does not increase.
- Live synchronization: Framer Agent confirmed that `Entrance Direction` was removed from `InteractivePattern.tsx` and its Property Controls, with random stable per-particle offsets restored while all video, crop, cursor/touch, inertia, and entrance timing behavior stayed intact.
- Verification: Focused component contracts pass 7/7 and the production build passes. The changed desktop entrance scenario passes in the real browser. The wider standalone browser suite has one pre-existing mobile scroll-target assertion failure (`interactionTargetY` remains `520` after programmatic scroll; expected greater than `before + 120`), reproduced in a focused retry; it is unrelated to entrance timing and was not modified in this scoped visual-order change.

### Iteration 28 — Dense Bright Default From Second Reference Video

- Request: Make the Toolcraft app's default display resemble the second screen recording supplied on 2026-09-14.
- Task type: Tier 3 schema-default, persistence, renderer-fallback, acceptance, and workload-fixture update.
- Source/reference checked: Six evenly spaced original-resolution frames from both 2026-09-14 recordings, the existing procedural renderer, and eight deterministic candidate renders. The full storyboard, transition analysis, behavior decomposition, and acceptance mapping are recorded in `docs/toolcraft/reference-default-display/study.md`.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, schema, renderer, acceptance, and performance contracts; required skills `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser`.
- Contract rules applied: `controls-product-coverage`, `renderer-technique-inventory`, `video-reference-analysis`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Use candidate F as the fresh and reset state: Crosses, Scale 24, Spacing -8px, Voids 1, Density 100%, Speed 1, Strength 2.4, Depth 3, and Threshold 0.1. Keep the existing background, palette, deterministic organic-void algorithm, timeline motion, and constant cross geometry unchanged.
- Alternatives rejected: Scale 28 was rejected because it produced fewer and visibly larger columns than the target; Voids 1.5 and 2 removed too much of the dense field; a renderer rewrite was rejected because the current algorithm already reproduced the target family when driven by the selected values.
- State/output mapping: Schema defaults and renderer fallbacks share the same values, so preview, reset, SVG, PNG, and video begin from one frame model. Persistence moved from state v1 to v2 so prior saved settings do not conceal the requested new default.
- Verification tier: Tier 3. Run focused unit/default-frame coverage, `pnpm verify:quick`, `pnpm build`, targeted browser default/reset/SVG and timeline motion acceptance, and the targeted heavy animation scenario. Skip the full performance suite because this is a post-first-working non-performance visual-default edit and the changed default uses a coarser 16px grid step than the previous 12px step.
- Files changed: `src/app/app-schema.ts`, `src/app/ascii-pattern.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, their focused tests, `e2e/app-controls.spec.ts`, the reference study and candidate evidence folder, the implementation plan, and this worklog.
- Verification: The focused default-frame test passed and proves more than 4,000 fixed-size cross particles with more than 30 real colors. `pnpm verify:quick` passed all 224 app tests plus Toolcraft docs, integrity, and port checks. The production build passed. Chromium acceptance passed the fresh defaults, Pattern/Dither section reset, dense SVG particle count/color spread, and timeline frame changes. The targeted heavy animation scenario passed its 120-frame probe after its documented spacing-0 workload was made explicit.
- Debug evidence: The first targeted performance run timed out because Scale 6 inherited the new default Spacing -8 and created an unintended 3px-step extreme. The product renderer was not the cause; explicitly applying the scenario's already-documented Spacing 0 fixture restored the intended measured workload and passed on rerun.
- Skipped checks: Full `pnpm verify:perf` is not required for this post-first-working non-performance edit because renderer architecture and per-cell math are unchanged, the requested default evaluates fewer grid cells than before, and the touched animation workload passed its focused browser budget.
- Risks: Existing saved v1 settings intentionally no longer restore under v2. Users can still recreate or import those values manually, while fresh and reset states now match the latest visual direction.
