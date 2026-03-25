import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReleasePlayerTabs } from "./ReleasePlayerTabs";
import { translations } from "@/i18n/translations";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.useFakeTimers();
});

describe("ReleasePlayerTabs", () => {
  const labels = {
    playerTabsLabel: translations.en.home.playerTabsLabel,
    playerSpotifyLabel: translations.en.home.playerSpotifyLabel,
    playerAppleLabel: translations.en.home.playerAppleLabel,
    playerFallbackHint: translations.en.home.playerFallbackHint,
  };

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("loads the active player immediately and keeps hidden panel semantics", () => {
    render(
      <ReleasePlayerTabs
        title="Test Release"
        spotifyUrl="https://open.spotify.com/embed/track/example"
        appleUrl="https://embed.music.apple.com/za/album/example"
        labels={labels}
      />,
    );

    const spotifyTab = screen.getByRole("tab", { name: /spotify/i });
    const appleTab = screen.getByRole("tab", { name: /apple music/i });

    expect(spotifyTab).toHaveAttribute("aria-selected", "true");
    expect(appleTab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTitle(/spotify player/i)).toBeInTheDocument();
    expect(screen.queryByTitle(/apple music player/i)).not.toBeInTheDocument();

    fireEvent.click(appleTab);

    expect(spotifyTab).toHaveAttribute("aria-selected", "false");
    expect(appleTab).toHaveAttribute("aria-selected", "true");
  });

  it("supports arrow-key navigation between tabs", () => {
    render(
      <ReleasePlayerTabs
        title="Test Release"
        spotifyUrl="https://open.spotify.com/embed/track/example"
        appleUrl="https://embed.music.apple.com/za/album/example"
        labels={labels}
      />,
    );

    const spotifyTab = screen.getByRole("tab", { name: /spotify/i });
    const appleTab = screen.getByRole("tab", { name: /apple music/i });

    spotifyTab.focus();
    fireEvent.keyDown(spotifyTab, { key: "ArrowRight" });

    expect(appleTab).toHaveAttribute("aria-selected", "true");
    expect(appleTab).toHaveFocus();
    expect(spotifyTab).toHaveAttribute("tabindex", "-1");
    expect(appleTab).toHaveAttribute("tabindex", "0");
  });

  it("preloads the inactive player shortly after mount", () => {
    render(
      <ReleasePlayerTabs
        title="Test Release"
        spotifyUrl="https://open.spotify.com/embed/track/example"
        appleUrl="https://embed.music.apple.com/za/album/example"
        labels={labels}
      />,
    );

    expect(screen.queryByTitle(/apple music player/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(950);
    });

    expect(screen.getByTitle(/apple music player/i)).toBeInTheDocument();
  });
});
