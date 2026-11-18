import { act, cleanup, render, screen } from "@testing-library/react";
import React, { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fiberMock = vi.hoisted(() => ({ throwOnRender: false }));

// Mimics the parts of R3F's <Canvas> the stage relies on: onCreated fires once
// after mount, render errors are rethrown, and unmount forces a context loss on
// the old canvas asynchronously (R3F calls gl.forceContextLoss() after a delay).
vi.mock("@react-three/fiber", () => ({
  Canvas: ({
    onCreated,
  }: {
    onCreated?: (state: { gl: { domElement: HTMLElement }; scene: object }) => void;
  }) => {
    if (fiberMock.throwOnRender) throw new Error("renderer failed");
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      const element = ref.current;
      if (element) onCreated?.({ gl: { domElement: element }, scene: {} });
      return () => {
        if (element) setTimeout(() => element.dispatchEvent(new Event("webglcontextlost")), 0);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- onCreated runs once, like R3F
    }, []);
    return React.createElement("div", { "data-testid": "r3f-canvas", ref });
  },
  useFrame: vi.fn(),
  useThree: vi.fn(),
}));

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

function stubMatchMedia(reduced: boolean) {
  const listeners = new Set<() => void>();
  const state = { reduced };
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return query.includes("prefers-reduced-motion") ? state.reduced : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  return {
    set(next: boolean) {
      state.reduced = next;
      for (const l of [...listeners]) l();
    },
  };
}

function stubWebGL(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() =>
    available ? {} : null) as unknown as HTMLCanvasElement["getContext"]);
}

async function renderStage() {
  vi.resetModules();
  const { GuitarStage } = await import("./GuitarStage");
  const { PlaybackProvider } = await import("./PlaybackProvider");
  return render(
    <PlaybackProvider>
      <GuitarStage route={["hero", "release", "neck", "body", "outro"]} position={0} litFret={0} />
    </PlaybackProvider>,
  );
}

afterEach(() => {
  cleanup();
  fiberMock.throwOnRender = false;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GuitarStage", () => {
  it("under prefers-reduced-motion renders the canvas pinned to the hero pose above the aria-hidden poster", async () => {
    stubMatchMedia(true);
    stubWebGL(true);
    const { container } = await renderStage();
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    expect(img?.getAttribute("src")).toContain("guitar-poster.webp");
    expect(img?.closest("[aria-hidden='true']")).not.toBeNull();
    const canvas = await screen.findByTestId("r3f-canvas");
    expect(canvas.closest("[data-motion]")).toHaveAttribute("data-motion", "reduced");
  });

  it("renders the poster fallback when WebGL is unavailable", async () => {
    stubMatchMedia(false);
    stubWebGL(false);
    const { container } = await renderStage();
    expect(container.querySelector("img[alt='']")).not.toBeNull();
    await flush();
    expect(screen.queryByTestId("r3f-canvas")).toBeNull();
  });

  it("toggles reduced motion on then off at runtime and ends with the canvas mounted and scrubbing", async () => {
    const media = stubMatchMedia(false);
    stubWebGL(true);
    const { container } = await renderStage();
    const canvas = await screen.findByTestId("r3f-canvas");
    expect(canvas.closest("[data-motion]")).toHaveAttribute("data-motion", "full");
    act(() => media.set(true));
    expect(screen.getByTestId("r3f-canvas").closest("[data-motion]")).toHaveAttribute(
      "data-motion",
      "reduced",
    );
    act(() => media.set(false));
    await flush();
    expect(screen.getByTestId("r3f-canvas").closest("[data-motion]")).toHaveAttribute(
      "data-motion",
      "full",
    );
    expect(container.querySelector("img[alt='']")).not.toBeNull();
  });

  it("falls back to the poster when the canvas throws", async () => {
    stubMatchMedia(false);
    stubWebGL(true);
    fiberMock.throwOnRender = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = await renderStage();
    await flush();
    expect(screen.queryByTestId("r3f-canvas")).toBeNull();
    expect(container.querySelector("img[alt='']")).not.toBeNull();
  });
});

describe("GuitarCanvas", () => {
  it("ignores the forced context loss R3F fires after unmount", async () => {
    vi.resetModules();
    const { GuitarCanvas } = await import("./Guitar");
    const { createSimulatedPlayback } = await import("./playback");
    const onContextLost = vi.fn();
    const { unmount } = render(
      <GuitarCanvas
        signal={createSimulatedPlayback()}
        route={["hero", "outro"]}
        position={0}
        litFret={0}
        active
        reducedMotion={false}
        onContextLost={onContextLost}
      />,
    );
    const canvas = screen.getByTestId("r3f-canvas");
    unmount();
    await flush();
    canvas.dispatchEvent(new Event("webglcontextlost"));
    expect(onContextLost).not.toHaveBeenCalled();
  });

  it("stagePose pins the hero pose under reduced motion and scrubs otherwise", async () => {
    const { stagePose } = await import("./Guitar");
    const { CAMERA_POSES, sampleCamera } = await import("./journey");
    const route = ["hero", "release", "neck", "outro"] as const;
    expect(stagePose(route, 2, true)).toEqual(CAMERA_POSES.hero);
    expect(stagePose(route, 1.5, false)).toEqual(sampleCamera(route, 1.5));
  });

  it("stagePose slides along the neck toward the lit fret only near the neck stop", async () => {
    const { stagePose } = await import("./Guitar");
    const { CAMERA_POSES, sampleCamera } = await import("./journey");
    const route = ["hero", "release", "neck", "outro"] as const;
    const fretY = CAMERA_POSES.neck.target[1] + 0.5;
    const atNeck = stagePose(route, 2, false, fretY);
    expect(atNeck.target[1]).toBeCloseTo(fretY);
    expect(atNeck.position[1]).toBeCloseTo(CAMERA_POSES.neck.position[1] + 0.5);
    expect(stagePose(route, 2.5, false, fretY).target[1]).toBeCloseTo(
      sampleCamera(route, 2.5).target[1] + 0.25,
    );
    expect(stagePose(route, 1, false, fretY)).toEqual(sampleCamera(route, 1));
    expect(stagePose(route, 2, true, fretY)).toEqual(CAMERA_POSES.hero);
    expect(stagePose(route, 2, false, null)).toEqual(sampleCamera(route, 2));
  });
});

describe("GuitarStage context loss", () => {
  it("drops the canvas and keeps the poster when the WebGL context is lost", async () => {
    stubMatchMedia(false);
    stubWebGL(true);
    const { container } = await renderStage();
    const canvas = await screen.findByTestId("r3f-canvas");
    act(() => {
      canvas.dispatchEvent(new Event("webglcontextlost"));
    });
    expect(screen.queryByTestId("r3f-canvas")).toBeNull();
    expect(container.querySelector("img[alt='']")).not.toBeNull();
  });
});

describe("PlaybackProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  async function renderProvider(listener: () => void) {
    vi.resetModules();
    const { PlaybackProvider, usePlayback } = await import("./PlaybackProvider");
    let toggle: () => void = () => {};
    function Probe() {
      const signal = usePlayback();
      useEffect(() => {
        toggle = () => signal.toggle();
        return signal.subscribe(listener);
      }, [signal]);
      return null;
    }
    const utils = render(
      <PlaybackProvider>
        <Probe />
      </PlaybackProvider>,
    );
    return { ...utils, toggle: () => toggle() };
  }

  it("disposes the signal on unmount", async () => {
    const listener = vi.fn();
    const { unmount, toggle } = await renderProvider(listener);
    act(() => toggle());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(listener).toHaveBeenCalled();
    unmount();
    listener.mockClear();
    vi.advanceTimersByTime(5000);
    expect(listener).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses and clears timers when the tab becomes hidden while playing", async () => {
    const listener = vi.fn();
    const { toggle } = await renderProvider(listener);
    act(() => toggle());
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    listener.mockClear();
    vi.advanceTimersByTime(5000);
    expect(listener).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    hidden.mockRestore();
  });

  it("PlaybackProvider forwards volume, seek and waveform to the driver", async () => {
    vi.resetModules();
    const { PlaybackProvider, usePlayback } = await import("./PlaybackProvider");
    const { createSimulatedPlayback } = await import("./playback");
    const driver = createSimulatedPlayback();
    const setVolume = vi.spyOn(driver, "setVolume");
    const seek = vi.spyOn(driver, "seek");
    const readWaveform = vi.spyOn(driver, "readWaveform");
    const toggleMute = vi.spyOn(driver, "toggleMute");
    let signal: ReturnType<typeof usePlayback> | undefined;
    function Probe() {
      const current = usePlayback();
      useEffect(() => {
        signal = current;
      }, [current]);
      return null;
    }
    render(
      <PlaybackProvider createDriver={() => driver}>
        <Probe />
      </PlaybackProvider>,
    );
    act(() => {
      signal?.setVolume(0.25);
      signal?.toggleMute();
      signal?.seek(12);
    });
    const buffer = new Uint8Array(4);
    expect(signal?.readWaveform(buffer)).toBe(false);
    expect(setVolume).toHaveBeenCalledWith(0.25);
    expect(toggleMute).toHaveBeenCalled();
    expect(seek).toHaveBeenCalledWith(12);
    expect(readWaveform).toHaveBeenCalledWith(buffer);
    expect(signal?.volume).toBe(0.25);
    expect(signal?.muted).toBe(true);
    expect(Number.isNaN(signal?.duration)).toBe(true);
  });

  it("usePlayback throws outside the provider", async () => {
    vi.resetModules();
    const { usePlayback } = await import("./PlaybackProvider");
    function Bad() {
      usePlayback();
      return null;
    }
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/PlaybackProvider/);
  });
});
