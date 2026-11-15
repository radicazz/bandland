import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSimulatedPlayback, type PlaybackSignal } from "./playback";

const BEAT_MS = 500; // bpm 120

describe("createSimulatedPlayback", () => {
  let playback: PlaybackSignal | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    playback?.dispose();
    playback = undefined;
    vi.useRealTimers();
  });

  it("starts paused with level 0", () => {
    playback = createSimulatedPlayback({ bpm: 120 });
    expect(playback.playing).toBe(false);
    expect(playback.level).toBe(0);
  });

  it("toggle() starts playing and level rises above 0 after one beat", () => {
    playback = createSimulatedPlayback({ bpm: 120 });
    playback.toggle();
    expect(playback.playing).toBe(true);
    vi.advanceTimersByTime(BEAT_MS);
    expect(playback.level).toBeGreaterThan(0);
  });

  it("pluck listener fires once per beat with an index in [0, strings)", () => {
    playback = createSimulatedPlayback({ bpm: 120, strings: 6 });
    playback.toggle();
    const listener = vi.fn();
    playback.subscribe(listener);
    vi.advanceTimersByTime(BEAT_MS * 4);
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("level decays toward 0 between beats", () => {
    playback = createSimulatedPlayback({ bpm: 120 });
    playback.toggle();
    vi.advanceTimersByTime(BEAT_MS);
    const peak = playback.level;
    vi.advanceTimersByTime(BEAT_MS / 2);
    expect(playback.level).toBeLessThan(peak);
    expect(playback.level).toBeGreaterThan(0);
  });

  it("toggle() again pauses, and level reaches 0 with no further notifications", () => {
    playback = createSimulatedPlayback({ bpm: 120 });
    const listener = vi.fn();
    playback.subscribe(listener);
    playback.toggle();
    vi.advanceTimersByTime(BEAT_MS);
    playback.toggle();
    expect(playback.playing).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(playback.level).toBe(0);
    const callsAfterPause = listener.mock.calls.length;
    vi.advanceTimersByTime(5000);
    expect(listener.mock.calls.length).toBe(callsAfterPause);
  });

  it("dispose() clears timers: advancing 10s after dispose triggers no listeners", () => {
    playback = createSimulatedPlayback({ bpm: 120 });
    const listener = vi.fn();
    playback.subscribe(listener);
    playback.toggle();
    playback.dispose();
    listener.mockClear();
    vi.advanceTimersByTime(10_000);
    expect(listener).not.toHaveBeenCalled();
  });
});
