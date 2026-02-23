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
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("switches tabs and keeps hidden panel semantics", () => {
    render(
      <ReleasePlayerTabs
        title="Test Release"
        spotifyUrl="https://open.spotify.com/embed/track/example"
        appleUrl="https://embed.music.apple.com/za/album/example"
        labels={{
          playerTabsLabel: translations.en.home.playerTabsLabel,
          playerSpotifyLabel: translations.en.home.playerSpotifyLabel,
          playerAppleLabel: translations.en.home.playerAppleLabel,
        }}
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
    expect(screen.getByTitle(/apple music player/i)).toBeInTheDocument();
  });

  it("prefetches the inactive iframe after the delay", () => {
    render(
      <ReleasePlayerTabs
        title="Test Release"
        spotifyUrl="https://open.spotify.com/embed/track/example"
        appleUrl="https://embed.music.apple.com/za/album/example"
        labels={{
          playerTabsLabel: translations.en.home.playerTabsLabel,
          playerSpotifyLabel: translations.en.home.playerSpotifyLabel,
          playerAppleLabel: translations.en.home.playerAppleLabel,
        }}
      />,
    );

    expect(screen.queryByTitle(/apple music player/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(screen.getByTitle(/apple music player/i)).toBeInTheDocument();
  });
});
