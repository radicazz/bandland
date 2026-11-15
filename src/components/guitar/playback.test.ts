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

describe("createAudioPlayback", () => {
  type Listener = () => void;

  class FakeAudio {
    static instances: FakeAudio[] = [];
    static failPlay = false;
    preload = "";
    src = "";
    currentTime = 0;
    played = 0;
    private listeners = new Map<string, Listener[]>();
    constructor() {
      FakeAudio.instances.push(this);
    }
    addEventListener(type: string, listener: Listener) {
      this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
    }
    emit(type: string) {
      for (const listener of this.listeners.get(type) ?? []) listener();
    }
    play() {
      this.played += 1;
      return FakeAudio.failPlay ? Promise.reject(new Error("blocked")) : Promise.resolve();
    }
    pause() {}
    load() {}
    removeAttribute() {}
  }

  beforeEach(() => {
    FakeAudio.instances = [];
    FakeAudio.failPlay = false;
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("AudioContext", undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not touch the network until Play is pressed", async () => {
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    expect(FakeAudio.instances).toHaveLength(0);
    expect(playback.status).toBe("paused");
    playback.dispose();
  });

  it("goes loading -> playing -> paused and pulses the level while playing", async () => {
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3", fallbackBpm: 120 });
    playback.toggle();
    const audio = FakeAudio.instances[0];
    expect(audio?.src).toBe("/audio/song.mp3");
    expect(playback.playing).toBe(true);
    expect(playback.status).toBe("loading");
    audio?.emit("playing");
    expect(playback.status).toBe("playing");
    vi.advanceTimersByTime(BEAT_MS);
    expect(playback.level).toBe(1);
    playback.toggle();
    expect(playback.playing).toBe(false);
    expect(playback.status).toBe("paused");
    expect(playback.level).toBe(0);
    playback.dispose();
  });

  it("reports an error when the browser refuses to play, and retries on the next press", async () => {
    const { createAudioPlayback } = await import("./playback");
    FakeAudio.failPlay = true;
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    playback.toggle();
    await Promise.resolve();
    await Promise.resolve();
    expect(playback.status).toBe("error");
    expect(playback.playing).toBe(false);
    FakeAudio.failPlay = false;
    playback.toggle();
    expect(playback.status).toBe("loading");
    expect(FakeAudio.instances[0]?.played).toBe(2);
    playback.dispose();
  });

  it("returns to paused when the track ends", async () => {
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    playback.toggle();
    const audio = FakeAudio.instances[0];
    audio?.emit("playing");
    audio?.emit("ended");
    expect(playback.status).toBe("paused");
    expect(playback.playing).toBe(false);
    playback.dispose();
  });
});
