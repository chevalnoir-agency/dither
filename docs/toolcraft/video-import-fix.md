# Video import correction

Verification tier: Tier 3
Reason: Source-video decode/seek readiness and canvas upload routing; no renderer quality or runtime-template changes.
Run: seek regression unit tests, app unit suite, build, focused source-video browser acceptance/performance, supplied H.264 reproduction.
Skip: Full performance checkpoint is not required for this post-first-working functional correction.

## Spec and evidence

The supplied 616892-byte H.264 MP4 has valid 1280×720 metadata and a 4.041667-second duration. Picker import while playing succeeds on the deployed app. Paused reimport fails on both deployed and local versions: the file is attached but the product canvas stays at its procedural output. The seek helper resolves on a queued `loadeddata` event even when `readyState` has returned to 1 during a seek, and also resolves unconditionally after 1500ms. Canvas drops are independently disabled by `canvas.upload: false` despite uploader copy advertising that workflow.

## Implementation plan

Goal: Imported source videos produce a decoded frame while paused and can be dropped onto the canvas.
Architecture: Preserve Toolcraft media state and existing Canvas2D sampling. Correct the source seek promise, then enable schema-owned canvas upload routing.
Tech stack: TypeScript, React, Vitest, Playwright.
Constraints: Preserve preview resolution, output dimensions, timeline state, exports and source-target routing. Do not publish the user's MP4 or its absolute path.
Review focus: queued media events; slow decode; failed decode; a seek already in progress; video drops routed to Source Video.

### Task 1 — Wait for a decoded source frame

- [x] Add unit regressions in `src/app/ascii-source-video.test.ts` proving a queued event while seeking does not settle, an undecoded frame does not settle, a delayed decoded frame settles, and decode timeout rejects.
- [x] Run the regressions and observe the existing premature-resolution failures.
- [x] Update `seekAsciiSourceVideo(video, timeSeconds): Promise<void>` in `src/app/ascii-pattern.ts` to require a decoded, non-seeking frame at the requested time. Avoid resetting the same seek and reject after a bounded timeout instead of returning an invalid frame.
- [x] Run unit, supplied-file paused/playback, and existing source-video browser checks.

### Task 2 — Restore advertised canvas drop behavior

- [x] Assert `appSchema.canvas.upload` is true and add a real canvas video-drop browser regression in `e2e/app-controls.spec.ts`; observe the failure before changing the schema.
- [x] Enable `canvas.upload` in `src/app/app-schema.ts` so existing runtime routing sends video to `source.video`.
- [x] Run focused drop, media lifecycle and media import performance coverage; build; update the worklog and prepare a reviewable branch.

Execution: Native in this isolated archive checkout; no approval pause under the project contract. Diagnostic files containing the private sample path stay local and are excluded from the review branch.

## Validation result

The scoped regressions, supplied MP4, 228 app tests and build pass. The broader functional suite has five failures also reproduced on unchanged main; exact names and budget measurements are recorded in the worklog. This is a review draft rather than a release-ready delivery.
