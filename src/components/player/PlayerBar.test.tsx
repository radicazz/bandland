import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatTime } from "./formatTime";
import { PlayerBar } from "./PlayerBar";
import { PlaybackProvider, usePlayback } from "@/components/guitar/PlaybackProvider";
import { createSimulatedPlayback, type PlaybackSignal } from "@/components/guitar/playback";
import { translations } from "@/i18n/translations";
import { memoryStorage } from "@/test/memoryStorage";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

const labels = translations.en.player;

beforeEach(() => {
  navigation.pathname = "/";
  vi.stubGlobal("localStorage", memoryStorage());
  // jsdom has no 2D canvas; the waveform skips drawing without a context.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderBar(createDriver: () => PlaybackSignal = () => createSimulatedPlayback()) {
  let signal: PlaybackSignal | null = null;
  function Probe() {
    const current = usePlayback();
    useEffect(() => {
      signal = current;
    }, [current]);
    return null;
  }
  const utils = render(
    <PlaybackProvider createDriver={createDriver}>
      <Probe />
      <PlayerBar labels={labels} />
    </PlaybackProvider>,
  );
  const current = () => {
    if (!signal) throw new Error("signal not captured");
    return signal;
  };
  return { ...utils, signal: current, play: () => act(() => current().toggle()) };
}

const region = () => screen.queryByRole("region", { name: labels.region });

describe("PlayerBar", () => {
  it("renders nothing before playback has started", () => {
    const { container } = renderBar();
    expect(region()).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it("appears after the first toggle as a labelled region", () => {
    const { play } = renderBar();
    play();
    expect(region()).toBeInTheDocument();
    expect(screen.getByText("Engel uit die Hemel")).toBeInTheDocument();
  });

  it("play/pause button toggles the signal and its label", () => {
    const { play, signal } = renderBar();
    play();
    fireEvent.click(screen.getByRole("button", { name: labels.pause }));
    expect(signal().playing).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: labels.play }));
    expect(signal().playing).toBe(true);
    expect(screen.getByRole("button", { name: labels.pause })).toBeInTheDocument();
  });

  it("mute button flips aria-pressed and label", () => {
    const { play, signal } = renderBar();
    play();
    const mute = screen.getByRole("button", { name: labels.mute });
    expect(mute).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(mute);
    expect(signal().muted).toBe(true);
    const unmute = screen.getByRole("button", { name: labels.unmute });
    expect(unmute).toHaveAttribute("aria-pressed", "true");
  });

  it("volume slider calls setVolume with the slider value / 100", () => {
    const { play, signal } = renderBar();
    play();
    const setVolume = vi.spyOn(signal(), "setVolume");
    const slider = screen.getByRole("slider", { name: labels.volume });
    expect(slider).toHaveValue("80");
    fireEvent.change(slider, { target: { value: "40" } });
    expect(setVolume).toHaveBeenCalledWith(0.4);
    expect(signal().volume).toBeCloseTo(0.4);
  });

  it("seek slider is disabled while duration is unknown", () => {
    const { play } = renderBar();
    play();
    const seek = screen.getByRole("slider", { name: labels.seek });
    expect(seek).toBeDisabled();
    expect(seek).toHaveAttribute("aria-valuetext", "0:00 of 0:00");
  });

  it("seek slider seeks within a known duration, in 5 s steps from the keyboard", () => {
    const driver = createSimulatedPlayback();
    const seekSpy = vi.fn();
    const timed: PlaybackSignal = Object.create(driver, {
      currentTime: { get: () => 62 },
      duration: { get: () => 187 },
      seek: { value: seekSpy },
    });
    const { play } = renderBar(() => timed);
    play();
    const seek = screen.getByRole("slider", { name: labels.seek });
    expect(seek).toBeEnabled();
    expect(seek).toHaveAttribute("aria-valuetext", "1:02 of 3:07");
    fireEvent.change(seek, { target: { value: "90.5" } });
    expect(seekSpy).toHaveBeenCalledWith(90.5);
    fireEvent.keyDown(seek, { key: "ArrowRight" });
    expect(seekSpy).toHaveBeenLastCalledWith(67);
    fireEvent.keyDown(seek, { key: "ArrowLeft" });
    expect(seekSpy).toHaveBeenLastCalledWith(57);
  });

  it("close pauses playback and hides the bar; it reappears on the next play", () => {
    const { play, signal } = renderBar();
    play();
    fireEvent.click(screen.getByRole("button", { name: labels.close }));
    expect(signal().playing).toBe(false);
    expect(region()).toBeNull();
    play();
    expect(region()).toBeInTheDocument();
  });

  it("renders nothing on /admin routes", () => {
    navigation.pathname = "/admin/shows";
    const { play } = renderBar();
    play();
    expect(region()).toBeNull();
  });

  it("reserves its height at the bottom of the page while shown", () => {
    const { play } = renderBar();
    play();
    expect(document.body.style.getPropertyValue("--player-clear")).toMatch(/px$/);
    fireEvent.click(screen.getByRole("button", { name: labels.close }));
    expect(document.body.style.getPropertyValue("--player-clear")).toBe("");
  });
});

describe("formatTime", () => {
  it.each([
    [Number.NaN, "0:00"],
    [Number.POSITIVE_INFINITY, "0:00"],
    [-3, "0:00"],
    [0, "0:00"],
    [187, "3:07"],
    [187.9, "3:07"],
    [3661, "61:01"],
  ])("formats %s as %s", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });
});
