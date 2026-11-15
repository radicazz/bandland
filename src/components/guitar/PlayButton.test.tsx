import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PlaybackProvider } from "./PlaybackProvider";
import { PlayButton } from "./PlayButton";

afterEach(() => cleanup());

describe("PlayButton", () => {
  it("toggles pressed state and label", () => {
    render(
      <PlaybackProvider>
        <PlayButton labels={{ play: "Play", pause: "Pause" }} />
      </PlaybackProvider>,
    );
    const play = screen.getByRole("button", { name: "Play" });
    expect(play.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(play);
    const pause = screen.getByRole("button", { name: "Pause" });
    expect(pause.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(pause);
    expect(screen.getByRole("button", { name: "Play" }).getAttribute("aria-pressed")).toBe("false");
  });
});
