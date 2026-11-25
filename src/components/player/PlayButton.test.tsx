import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PlaybackProvider } from "./PlaybackProvider";
import { PlayButton } from "./PlayButton";
import { createSimulatedPlayback, type PlaybackSignal, type PlaybackStatus } from "./playback";

afterEach(() => cleanup());

const labels = {
  play: "Play",
  pause: "Pause",
  trackIdle: "Song: {track}",
  trackLoading: "Loading {track}",
  trackPlaying: "Now playing: {track}",
  trackError: "{track} didn't load",
};

describe("PlayButton", () => {
  it("toggles pressed state, label and the status line", () => {
    render(
      <PlaybackProvider createDriver={() => createSimulatedPlayback()}>
        <PlayButton labels={labels} track="Engel" />
      </PlaybackProvider>,
    );
    const play = screen.getByRole("button", { name: "Play" });
    expect(play.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Song: Engel")).toBeTruthy();
    fireEvent.click(play);
    const pause = screen.getByRole("button", { name: "Pause" });
    expect(pause.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Now playing: Engel")).toBeTruthy();
    fireEvent.click(pause);
    expect(screen.getByRole("button", { name: "Play" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("shows the error line when the track fails", () => {
    const failed: PlaybackSignal = {
      playing: false,
      status: "error" satisfies PlaybackStatus,
      level: 0,
      volume: 0.8,
      muted: false,
      currentTime: 0,
      duration: Number.NaN,
      started: false,
      pluck: () => {},
      subscribe: () => () => {},
      toggle: () => {},
      setVolume: () => {},
      toggleMute: () => {},
      seek: () => {},
      readWaveform: () => false,
      dispose: () => {},
    };
    render(
      <PlaybackProvider createDriver={() => failed}>
        <PlayButton labels={labels} track="Engel" />
      </PlaybackProvider>,
    );
    expect(screen.getByText("Engel didn't load")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });

  it("zine variant keeps the accessible name and renders its children beside the button", () => {
    render(
      <PlaybackProvider createDriver={() => createSimulatedPlayback()}>
        <PlayButton labels={labels} track="Engel" variant="zine">
          <span data-testid="beside" />
        </PlayButton>
      </PlaybackProvider>,
    );
    const play = screen.getByRole("button", { name: "Play" });
    expect(play.id).toBe("featured-track-play");
    expect(screen.getByTestId("beside")).toBeTruthy();
    fireEvent.click(play);
    expect(screen.getByRole("button", { name: "Pause" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Now playing: Engel")).toBeTruthy();
  });
});
