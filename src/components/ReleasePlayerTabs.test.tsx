import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ReleasePlayerTabs } from "./ReleasePlayerTabs";
import { translations } from "@/i18n/translations";

afterEach(() => {
  cleanup();
});

describe("ReleasePlayerTabs", () => {
  const labels = {
    playerTabsLabel: translations.en.home.playerTabsLabel,
    playerSpotifyLabel: translations.en.home.playerSpotifyLabel,
    playerAppleLabel: translations.en.home.playerAppleLabel,
    playerLoadLabel: translations.en.home.playerLoadLabel,
    playerFallbackHint: translations.en.home.playerFallbackHint,
  };

  it("switches tabs and keeps hidden panel semantics", () => {
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
    expect(screen.getByRole("button", { name: /load player spotify/i })).toBeInTheDocument();
    expect(screen.queryByTitle(/apple music player/i)).not.toBeInTheDocument();

    fireEvent.click(appleTab);

    expect(spotifyTab).toHaveAttribute("aria-selected", "false");
    expect(appleTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /load player apple music/i })).toBeInTheDocument();
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

  it("loads the selected iframe on demand", () => {
    render(
      <ReleasePlayerTabs
        title="Test Release"
        spotifyUrl="https://open.spotify.com/embed/track/example"
        appleUrl="https://embed.music.apple.com/za/album/example"
        labels={labels}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /load player spotify/i }));

    expect(screen.getByTitle(/spotify player/i)).toBeInTheDocument();
  });
});
