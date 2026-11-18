import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaybackSignal } from "./playback";
import { useStagePulse } from "./useStagePulse";

type FakeSignal = Pick<PlaybackSignal, "playing" | "level" | "subscribe"> & {
  set(next: { playing?: boolean; level?: number }): void;
};

function fakeSignal(initial: { playing: boolean; level: number }): FakeSignal {
  const listeners = new Set<() => void>();
  const state = { ...initial };
  return {
    get playing() {
      return state.playing;
    },
    get level() {
      return state.level;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next) {
      Object.assign(state, next);
      for (const listener of [...listeners]) listener();
    },
  };
}

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const cancelFrame = vi.fn((id: number) => frames.delete(id));

function runFrame() {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(performance.now());
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 1;
  cancelFrame.mockClear();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", cancelFrame);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup(signal: FakeSignal, reducedMotion: boolean) {
  const element = document.createElement("div");
  const ref = { current: element };
  const hook = renderHook(({ reduced }) => useStagePulse(ref, signal, reduced), {
    initialProps: { reduced: reducedMotion },
  });
  return { element, ...hook };
}

describe("useStagePulse", () => {
  it("writes the signal level while playing", () => {
    const signal = fakeSignal({ playing: true, level: 0.5 });
    const { element } = setup(signal, false);
    act(() => runFrame());
    expect(element.style.getPropertyValue("--pulse")).toBe("0.500");
    signal.set({ level: 0.25 });
    act(() => runFrame());
    expect(element.style.getPropertyValue("--pulse")).toBe("0.250");
    expect(frames.size).toBe(1);
  });

  it("writes 0 and cancels the frame when playback stops", () => {
    const signal = fakeSignal({ playing: true, level: 0.8 });
    const { element } = setup(signal, false);
    act(() => runFrame());
    expect(element.style.getPropertyValue("--pulse")).toBe("0.800");
    act(() => signal.set({ playing: false, level: 0.6 }));
    expect(element.style.getPropertyValue("--pulse")).toBe("0");
    expect(cancelFrame).toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("never starts a loop under reduced motion", () => {
    const signal = fakeSignal({ playing: true, level: 0.9 });
    const { element } = setup(signal, true);
    act(() => signal.set({ level: 1 }));
    expect(frames.size).toBe(0);
    expect(element.style.getPropertyValue("--pulse")).toBe("0");
  });
});
