import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroSlideshow } from "./HeroSlideshow";
import { translations } from "@/i18n/translations";

const labels = translations.en.home.slideshow;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HeroSlideshow", () => {
  it("renders all slides and rotates through any slide count", () => {
    vi.useFakeTimers();

    try {
      const { container } = render(
        <HeroSlideshow
          labels={labels}
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

  it("pauses on the current photo and resumes from it", () => {
    vi.useFakeTimers();
    const { container } = render(
      <HeroSlideshow
        slides={["/one.jpg", "/two.jpg", "/three.jpg"]}
        intervalSeconds={1}
        labels={labels}
      />,
    );
    const images = container.querySelectorAll("img");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByRole("button", { name: labels.pause }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(images[1]?.parentElement).toHaveClass("opacity-100");
    const resume = screen.getByRole("button", { name: labels.resume });
    expect(resume.closest('[aria-hidden="true"]')).toBeNull();
    fireEvent.click(resume);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(images[2]?.parentElement).toHaveClass("opacity-100");
  });

  it("keeps photos still with reduced motion and responds to preference changes", () => {
    vi.useFakeTimers();
    const query = { ...window.matchMedia("(prefers-reduced-motion: reduce)"), matches: true };
    vi.spyOn(window, "matchMedia").mockReturnValue(query);
    const { container } = render(
      <HeroSlideshow slides={["/one.jpg", "/two.jpg"]} intervalSeconds={1} labels={labels} />,
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    const images = container.querySelectorAll("img");
    expect(images[0]?.parentElement).toHaveClass("opacity-100");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const listener = vi.mocked(query.addEventListener).mock.calls.at(-1)?.[1];
    act(() => {
      if (typeof listener === "function")
        listener.call(query, { matches: false } as MediaQueryListEvent);
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("button", { name: labels.pause })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(images[1]?.parentElement).toHaveClass("opacity-100");
  });

  it.each([{ slides: [] }, { slides: ["/one.jpg"] }])(
    "does not offer rotation controls for $slides",
    ({ slides }) => {
      render(<HeroSlideshow slides={slides} labels={labels} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    },
  );
});
