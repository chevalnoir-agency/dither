import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { seekAsciiSourceVideo } from "./ascii-pattern";

class VideoFrameFixture extends EventTarget {
  duration = 4;
  currentTime = 0;
  readyState = 1;
  seeking = false;
}

describe("source video frame readiness", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", { setTimeout, clearTimeout });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("ignores a queued loadeddata event while the requested frame is still seeking", async () => {
    const video = new VideoFrameFixture();
    let finished = false;
    const pending = seekAsciiSourceVideo(video as unknown as HTMLVideoElement, 1).then(() => { finished = true; });
    video.seeking = true;
    video.dispatchEvent(new Event("loadeddata"));
    await vi.advanceTimersByTimeAsync(0);
    expect(finished).toBe(false);
    video.readyState = 4;
    video.seeking = false;
    video.dispatchEvent(new Event("seeked"));
    await pending;
    expect(finished).toBe(true);
  });

  it("waits past the old 1500ms fallback for a decoded frame", async () => {
    const video = new VideoFrameFixture();
    let finished = false;
    const pending = seekAsciiSourceVideo(video as unknown as HTMLVideoElement, 0).then(() => { finished = true; });
    await vi.advanceTimersByTimeAsync(1600);
    expect(finished).toBe(false);
    video.readyState = 2;
    video.dispatchEvent(new Event("loadeddata"));
    await pending;
    expect(finished).toBe(true);
  });

  it("does not reuse a stale decoded frame during an active seek", async () => {
    const video = new VideoFrameFixture();
    video.readyState = 4;
    video.seeking = true;
    let finished = false;
    const pending = seekAsciiSourceVideo(video as unknown as HTMLVideoElement, 0).then(() => { finished = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(finished).toBe(false);
    video.seeking = false;
    video.dispatchEvent(new Event("seeked"));
    await pending;
  });

  it("rejects when no decoded frame becomes available", async () => {
    const video = new VideoFrameFixture();
    const pending = seekAsciiSourceVideo(video as unknown as HTMLVideoElement, 0);
    const outcome = pending.then(() => "resolved", (error: Error) => error.message);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await outcome).toContain("Source video seek failed");
  });
});
