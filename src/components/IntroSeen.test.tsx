import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IntroSeen } from "./IntroSeen";

const root = document.documentElement;

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  root.classList.remove("reveal-ready", "intro-seen");
  sessionStorage.clear();
});

describe("IntroSeen", () => {
  it("adds reveal-ready on mount", () => {
    render(<IntroSeen />);
    expect(root).toHaveClass("reveal-ready");
    expect(sessionStorage.getItem("bandland-intro")).toBe("1");
  });

  it("adds intro-seen only after the intro has finished", () => {
    render(<IntroSeen />);
    expect(root).not.toHaveClass("intro-seen");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(root).not.toHaveClass("intro-seen");
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(root).toHaveClass("intro-seen");
  });

  it("does not add intro-seen after unmounting early", () => {
    const { unmount } = render(<IntroSeen />);
    unmount();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(root).not.toHaveClass("intro-seen");
  });

  it("survives a throwing sessionStorage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => render(<IntroSeen />)).not.toThrow();
    expect(root).toHaveClass("reveal-ready");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(root).toHaveClass("intro-seen");
  });
});
