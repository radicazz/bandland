import { act, render, screen } from "@testing-library/react";
import React, { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ onCreated }: { onCreated?: (state: { gl: { domElement: HTMLElement } }) => void }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      if (ref.current) onCreated?.({ gl: { domElement: ref.current } });
    }, [onCreated]);
    return React.createElement("div", { "data-testid": "r3f-canvas", ref });
  },
  useFrame: vi.fn(),
  useThree: vi.fn(),
}));

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
      <GuitarStage route={["hero", "release", "neck", "body", "outro"]} litFret={0} />
    </PlaybackProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GuitarStage", () => {
  it('renders a poster <img alt=""> with aria-hidden wrapper and no canvas when matchMedia(prefers-reduced-motion) matches', async () => {
    stubMatchMedia(true);
    stubWebGL(true);
    const { container } = await renderStage();
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    expect(img?.getAttribute("src")).toContain("guitar-poster.jpg");
    expect(img?.closest("[aria-hidden='true']")).not.toBeNull();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(screen.queryByTestId("r3f-canvas")).toBeNull();
  });

  it("renders the poster fallback when WebGL is unavailable", async () => {
    stubMatchMedia(false);
    stubWebGL(false);
    const { container } = await renderStage();
    expect(container.querySelector("img[alt='']")).not.toBeNull();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(screen.queryByTestId("r3f-canvas")).toBeNull();
  });

  it("mounts the canvas above the poster when WebGL works and motion is allowed, and unmounts it when reduced motion turns on", async () => {
    const media = stubMatchMedia(false);
    stubWebGL(true);
    const { container } = await renderStage();
    expect(await screen.findByTestId("r3f-canvas")).toBeInTheDocument();
    expect(container.querySelector("img[alt='']")).not.toBeNull();
    act(() => media.set(true));
    expect(screen.queryByTestId("r3f-canvas")).toBeNull();
    expect(container.querySelector("img[alt='']")).not.toBeNull();
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
