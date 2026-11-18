import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Reveal } from "./Reveal";

type Callback = (
  entries: Pick<IntersectionObserverEntry, "isIntersecting" | "intersectionRatio">[],
) => void;

function stubObserver() {
  const state: { callback?: Callback; disconnect: ReturnType<typeof vi.fn>; options?: unknown } = {
    disconnect: vi.fn(),
  };
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: Callback, options?: unknown) {
        state.callback = callback;
        state.options = options;
      }
      observe() {}
      unobserve() {}
      disconnect = state.disconnect;
    },
  );
  return state;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("js");
});

describe("Reveal", () => {
  it("renders children visible without the js root class", () => {
    stubObserver();
    render(<Reveal>Hello</Reveal>);
    const node = screen.getByText("Hello");
    expect(node).toBeInTheDocument();
    expect(node).toHaveAttribute("data-reveal");
    expect(document.documentElement).not.toHaveClass("js");
    expect(node.style.opacity).toBe("");
  });

  it("marks itself revealed when intersecting", () => {
    const state = stubObserver();
    render(<Reveal>Hello</Reveal>);
    const node = screen.getByText("Hello");
    expect(node).not.toHaveAttribute("data-revealed");
    expect(state.options).toEqual({ threshold: 0, rootMargin: "0px 0px -10% 0px" });
    state.callback?.([{ isIntersecting: false, intersectionRatio: 0 }]);
    expect(node).not.toHaveAttribute("data-revealed");
    state.callback?.([{ isIntersecting: true, intersectionRatio: 0.001 }]);
    expect(node).toHaveAttribute("data-revealed");
  });

  it("marks revealed immediately without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toHaveAttribute("data-revealed");
  });

  it("disconnects after revealing", () => {
    const state = stubObserver();
    render(<Reveal>Hello</Reveal>);
    state.callback?.([{ isIntersecting: true, intersectionRatio: 0.5 }]);
    expect(state.disconnect).toHaveBeenCalled();
  });

  it("renders as a list item when asked", () => {
    stubObserver();
    render(
      <ul>
        <Reveal as="li">Item</Reveal>
      </ul>,
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("Item");
  });
});
