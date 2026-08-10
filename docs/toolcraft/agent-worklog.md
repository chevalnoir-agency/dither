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

## Decisions

### Renderer

- Decision: Canvas 2D live preview renderer with optional source-image/source-video luminance sampling and SVG still export generated from the same ASCII frame model.
- Reason: The product is dense text-output: the stress state can draw many glyphs per frame, uploaded media is source material rather than a visible layer, and the user still needs a vector SVG still export with exact particle colors.
- Evidence: `src/app/ascii-pattern-renderer.tsx` renders only product canvas output and loads `source.image` plus `source.video`; `src/app/ascii-pattern.ts` generates deterministic organic glyph frames, image/video luminance sampling, `pattern.voids` mask shaping, depth-aware tone/size mapping, and SVG text with the CHEVAL NOIR color ramp; `src/app/app-performance.ts` declares `rendererTechnique`, `rendererPipeline`, media-import coverage, and workload scenarios.

Renderer Technique Decision Matrix:

- sourceRepresentation: video-media when uploaded, image-media fallback when uploaded, procedural fallback when both are empty.
- productRepresentation: text.
- previewRenderer: canvas-2d.
- exportRenderer: media-recorder for video, canvas-2d for PNG/JPG, SVG text for still vector output.
- rendererWorkload: text-output.
- rendererStrategy: canvas-2d.
- whyNotAlternativeStrategies: DOM and SVG live preview create too many nodes at stress scale; WebGL/WebGPU do not improve the text glyph primitive or SVG export requirement, and source-media sampling is bounded to uploaded media frames rather than every glyph draw.
- fidelityRisks: Canvas preview rasterizes glyphs; MP4 support depends on browser MediaRecorder capabilities.
- performanceRisks: Small scale, low spacing, and high density increase glyph count; uploaded source images add decode and luminance preparation; uploaded source videos add decode, seek, luminance auto-leveling, and frame-sampling work; video export takes approximately the selected timeline duration.

Renderer Layer Inventory:

- ascii-pattern-layer: product-foreground, Canvas 2D, high primitive count, content text and dense-pattern, included in exports, visible selector `[data-ascii-pattern-canvas]`.

Render Pipeline Inventory:

- source-image-decode pass: media decode on main thread; cache key is `source.image.dataUrl`.
- source-image-sampler pass: source preprocessing on main thread; cache keys are decoded image, media transform metadata, and canvas size.
- source-video-decode pass: media decode on main thread; cache key is `source.video.dataUrl`.
- source-video-frame-sampler pass: source-video preprocessing on main thread; cache keys are decoded video, timeline time/duration, auto levels, and canvas size.
- field-model pass: text-layout on main thread; cache keys are source sampler, particle type, scale, spacing, void amount, density, dither strength, dither contrast, threshold, speed, timeline time, duration, and canvas size.
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

- Decision: Product controls are grouped as Source Image, Source Video, Pattern, Motion, Dither, Background, Image Export, Video Export, and sticky Export actions.
- Reason: Each section maps to a product entity or workflow stage rather than control type; Source Image owns the still fallback upload, Source Video owns the animated override upload, and Background directly precedes export settings as required.
- Evidence: `starterControlSectionInventory` in `src/app/app-acceptance.ts` mirrors the schema targets including split `source.image` and `source.video` sections with workflow-stage split reasons, `pattern.spacing`, `pattern.voids`, `pattern.particleType`, and `dither.contrast`; every visible control has `performanceRole`, `defaultValue`, and an acceptance row, and the Particle select covers Crosses, Mini dots, Hachures, and Mixed.

### Export

- Decision: Provide Export SVG, Export PNG, and Export Video footer actions; PNG/JPG uses Image Export settings, video uses Video Export settings, and all exports consume the uploaded source video when present or the uploaded source image fallback when no video is present.
- Reason: The user explicitly requested SVG stills and MP4 video, now including image/video source dithering, while the Toolcraft contract requires animated apps to include Export PNG and Export Video with standard settings.
- Evidence: `src/app/ascii-export.ts` reads `source.video`, `source.image`, `export.image.format`, `export.image.resolution`, `export.video.format`, and `export.video.resolution`; PNG uses `createToolcraftPngExportCanvas({ includeBackground, resolution })`; video uses `getToolcraftVideoExportSize`, `shouldIncludeToolcraftExportBackground`, live source-video playback during recording, timeline-targeted frame scheduling, `MediaRecorder.isTypeSupported`, and recorder error handling; browser source acceptance exports SVG and a short video after upload.

### Performance

- Decision: Guarantee smooth dense-stress targets for scale 6, spacing 0, voids 0, density 100, threshold 0.1/0.2, hatch particle switching, render scale 2, 1920x1080 source-image import, and 1920x1080 source-video import; expose spacing down to -8 as an experimental art-direction range above the guaranteed stress target.
- Reason: These values represent the heaviest useful guaranteed preview states for a dense ASCII text-output renderer; source-image and source-video imports are separate media-import workloads, depth is covered as a responsiveness drag because it changes tone/size mapping without increasing glyph count, while extra-negative spacing and lower void values can multiply visible glyph count at low Scale.
- Evidence: `src/app/app-performance.ts` declares `loadProfile` with `hardLimit`, `smoothTarget`, and `smoothTargetRatio`; scenarios cover image/video media import, control drag including `contrast-control-drag` and `voids-control-drag`, hatch particle select changes, spacing with a recorded degraded smooth target, animation frame sampling, animated viewport drag, viewport zoom stress, and short video export.

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
- Note: Direct `pnpm verify:quick` was not used in this desktop session because `pnpm` is not exposed in PATH and the script recursively calls `pnpm`; equivalent local checks passed with npm and local Playwright/Vitest binaries.
- Browser: fallback Playwright tests cover controls, product observable changes, SVG/image/video exports, timeline duration metadata, persistence reload, and performance scenarios.

## Risks

- Risk: MP4 recording support depends on Chromium/macOS MediaRecorder capabilities; the app checks `MediaRecorder.isTypeSupported` and safely falls back to WebM if MP4 is unavailable.
