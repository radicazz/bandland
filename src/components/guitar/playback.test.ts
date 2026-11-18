import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSimulatedPlayback,
  readStoredVolume,
  VOLUME_STORAGE_KEY,
  type PlaybackSignal,
} from "./playback";
import { memoryStorage } from "@/test/memoryStorage";

const BEAT_MS = 500; // bpm 120

describe("readStoredVolume", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("falls back to 0.8 for missing, malformed, out-of-range and throwing storage", () => {
    const fallback = { volume: 0.8, muted: false };
    expect(readStoredVolume()).toEqual(fallback);
    window.localStorage.setItem(VOLUME_STORAGE_KEY, "abc");
    expect(readStoredVolume()).toEqual(fallback);
    window.localStorage.setItem(VOLUME_STORAGE_KEY, '{"volume":7}');
    expect(readStoredVolume().volume).toBe(1);
    window.localStorage.setItem(VOLUME_STORAGE_KEY, '{"volume":-1}');
    expect(readStoredVolume().volume).toBe(0);
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readStoredVolume()).toEqual(fallback);
  });
});

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

  it("setVolume clamps and ignores NaN", () => {
    playback = createSimulatedPlayback({ bpm: 120 });
    expect(playback.volume).toBe(0.8);
    playback.setVolume(3);
    expect(playback.volume).toBe(1);
    playback.setVolume(-2);
    expect(playback.volume).toBe(0);
    playback.setVolume(Number.NaN);
    expect(playback.volume).toBe(0);
  });

  it("toggleMute flips muted and notifies", () => {
    playback = createSimulatedPlayback({ bpm: 120 });
    const listener = vi.fn();
    playback.subscribe(listener);
    playback.toggleMute();
    expect(playback.muted).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    playback.setVolume(0.5);
    expect(playback.muted).toBe(false);
  });

  it("started becomes true on first toggle and stays true after pause", () => {
    playback = createSimulatedPlayback({ bpm: 120 });
    expect(playback.started).toBe(false);
    playback.toggle();
    expect(playback.started).toBe(true);
    playback.toggle();
    expect(playback.started).toBe(true);
  });

  it("readWaveform returns false", () => {
    playback = createSimulatedPlayback({ bpm: 120 });
    expect(playback.readWaveform(new Uint8Array(8))).toBe(false);
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
    volume = 1;
    muted = false;
    duration = Number.NaN;
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
    vi.stubGlobal("localStorage", memoryStorage());
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

  it("sends volume and mute to the element without Web Audio", async () => {
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    playback.toggle();
    const audio = FakeAudio.instances[0];
    playback.setVolume(0.5);
    expect(audio?.volume).toBe(0.5);
    playback.toggleMute();
    expect(audio?.muted).toBe(true);
    expect(playback.muted).toBe(true);
    playback.dispose();
  });

  it("persists volume to localStorage", async () => {
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    playback.setVolume(0.3);
    expect(JSON.parse(window.localStorage.getItem(VOLUME_STORAGE_KEY) ?? "null")).toEqual({
      volume: 0.3,
      muted: false,
    });
    playback.toggleMute();
    expect(JSON.parse(window.localStorage.getItem(VOLUME_STORAGE_KEY) ?? "null")).toEqual({
      volume: 0.3,
      muted: true,
    });
    playback.dispose();
  });

  it("applies the stored volume when the element is created", async () => {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, '{"volume":0.4,"muted":true}');
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    playback.toggle();
    expect(FakeAudio.instances[0]?.volume).toBe(0.4);
    expect(FakeAudio.instances[0]?.muted).toBe(true);
    playback.dispose();
  });

  it("seek is a no-op while duration is NaN and clamps once known", async () => {
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    playback.toggle();
    const audio = FakeAudio.instances[0];
    playback.seek(50);
    expect(audio?.currentTime).toBe(0);
    if (audio) audio.duration = 200;
    audio?.emit("durationchange");
    playback.seek(500);
    expect(playback.currentTime).toBe(200);
    playback.seek(-3);
    expect(playback.currentTime).toBe(0);
    playback.dispose();
  });

  it("timeupdate and durationchange notify subscribers", async () => {
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    playback.toggle();
    const listener = vi.fn();
    playback.subscribe(listener);
    FakeAudio.instances[0]?.emit("timeupdate");
    FakeAudio.instances[0]?.emit("durationchange");
    expect(listener).toHaveBeenCalledTimes(2);
    playback.dispose();
  });

  it("readWaveform returns false without an analyser", async () => {
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    playback.toggle();
    expect(playback.readWaveform(new Uint8Array(8))).toBe(false);
    playback.dispose();
  });

  it("started stays true after pausing", async () => {
    const { createAudioPlayback } = await import("./playback");
    const playback = createAudioPlayback({ src: "/audio/song.mp3" });
    expect(playback.started).toBe(false);
    playback.toggle();
    playback.toggle();
    expect(playback.started).toBe(true);
    playback.dispose();
  });

  describe("with Web Audio", () => {
    const calls: string[] = [];
    const gainNode = { gain: { value: 1 }, connect: vi.fn() };

    function node(name: string, extra: object = {}) {
      return {
        ...extra,
        connect: vi.fn((target: { name?: string }) => {
          calls.push(`${name}->${target.name ?? "?"}`);
        }),
        name,
      };
    }

    beforeEach(() => {
      calls.length = 0;
      gainNode.gain.value = 1;
      class FakeContext {
        sampleRate = 44100;
        destination = { name: "destination" };
        createMediaElementSource() {
          return node("source");
        }
        createAnalyser() {
          return node("analyser", {
            frequencyBinCount: 512,
            getByteFrequencyData: vi.fn(),
            getByteTimeDomainData: (buffer: Uint8Array) => buffer.fill(128),
          });
        }
        createGain() {
          return Object.assign(node("gain"), { gain: gainNode.gain });
        }
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      }
      vi.stubGlobal("AudioContext", FakeContext);
      (window as unknown as { AudioContext: unknown }).AudioContext = FakeContext;
    });

    afterEach(() => {
      delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    });

    it("routes volume through the gain node with the analyser pre-gain", async () => {
      const { createAudioPlayback } = await import("./playback");
      const playback = createAudioPlayback({ src: "/audio/song.mp3" });
      playback.toggle();
      expect(calls).toEqual(["source->analyser", "analyser->gain", "gain->destination"]);
      playback.setVolume(0.5);
      expect(gainNode.gain.value).toBe(0.5);
      playback.toggleMute();
      expect(gainNode.gain.value).toBe(0);
      expect(FakeAudio.instances[0]?.volume).toBe(1);
      expect(FakeAudio.instances[0]?.muted).toBe(false);
      playback.dispose();
    });

    it("readWaveform fills the buffer and returns true", async () => {
      const { createAudioPlayback } = await import("./playback");
      const playback = createAudioPlayback({ src: "/audio/song.mp3" });
      playback.toggle();
      const buffer = new Uint8Array(16);
      expect(playback.readWaveform(buffer)).toBe(true);
      expect(Array.from(buffer).every((byte) => byte === 128)).toBe(true);
      playback.dispose();
    });
  });
});
