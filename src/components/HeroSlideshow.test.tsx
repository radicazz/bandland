import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HeroSlideshow } from "./HeroSlideshow";

describe("HeroSlideshow", () => {
  it("renders all slides and rotates through any slide count", () => {
    vi.useFakeTimers();

    try {
      const { container } = render(
        <HeroSlideshow
          slides={[
            "/slideshow/01-hero.jpg",
            "/slideshow/02-hero.jpg",
            "/slideshow/03-hero.jpg",
            "/slideshow/04-hero.jpg",
          ]}
          intervalSeconds={1}
        />,
      );

      const images = Array.from(container.querySelectorAll("img"));
      expect(images).toHaveLength(4);
      expect(images[0]).toHaveClass("object-cover");
      expect(images[0]?.parentElement).toHaveClass("opacity-100");
      expect(images[3]?.parentElement).toHaveClass("opacity-0");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(images[1]?.parentElement).toHaveClass("opacity-100");
      expect(images[0]?.parentElement).toHaveClass("opacity-0");

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(images[0]?.parentElement).toHaveClass("opacity-100");
    } finally {
      vi.useRealTimers();
    }
  });
});
