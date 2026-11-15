import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JourneyStage } from "./JourneyStage";

vi.mock("@/components/guitar/GuitarStage", () => ({
  GuitarStage: function GuitarStageMock({ litFret }: { litFret: number }) {
    return <div data-testid="guitar-stage" data-lit-fret={litFret} />;
  },
}));

type Callback = (entries: Array<{ target: Element; isIntersecting: boolean }>) => void;

class FakeObserver {
  static instances: FakeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(public callback: Callback) {
    FakeObserver.instances.push(this);
  }
  observe(element: Element) {
    this.observed.push(element);
  }
  disconnect() {
    this.disconnected = true;
  }
}

function Rows({ count, id = "rows" }: { count: number; id?: string }) {
  return (
    <ol id={id}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} data-fret={index} />
      ))}
    </ol>
  );
}

beforeEach(() => {
  FakeObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const lit = () => screen.getByTestId("guitar-stage").getAttribute("data-lit-fret");

describe("JourneyStage", () => {
  it("lights no fret until a show row is in view and resets when none is", () => {
    render(
      <>
        <Rows count={3} />
        <JourneyStage route={["hero", "neck", "outro"]} rowsId="rows" rowCount={3} />
      </>,
    );
    expect(lit()).toBe("-1");

    const observer = FakeObserver.instances.at(-1) as FakeObserver;
    const [first, second] = observer.observed as [Element, Element];
    act(() => observer.callback([{ target: first, isIntersecting: true }]));
    expect(lit()).toBe("0");
    act(() =>
      observer.callback([
        { target: first, isIntersecting: false },
        { target: second, isIntersecting: true },
      ]),
    );
    expect(lit()).toBe("1");
    act(() => observer.callback([{ target: second, isIntersecting: false }]));
    expect(lit()).toBe("-1");
  });

  it("observes only rows inside the scoped container and re-observes when rows change", () => {
    const { rerender } = render(
      <>
        <Rows count={2} />
        <ul>
          <li data-fret={9} />
        </ul>
        <JourneyStage route={["hero", "neck", "outro"]} rowsId="rows" rowCount={2} />
      </>,
    );
    const firstObserver = FakeObserver.instances.at(-1) as FakeObserver;
    expect(firstObserver.observed).toHaveLength(2);

    rerender(
      <>
        <Rows count={4} />
        <ul>
          <li data-fret={9} />
        </ul>
        <JourneyStage route={["hero", "neck", "outro"]} rowsId="rows" rowCount={4} />
      </>,
    );
    expect(firstObserver.disconnected).toBe(true);
    expect((FakeObserver.instances.at(-1) as FakeObserver).observed).toHaveLength(4);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(
      <>
        <Rows count={1} />
        <JourneyStage route={["hero", "neck", "outro"]} rowsId="rows" rowCount={1} />
      </>,
    );
    const observer = FakeObserver.instances.at(-1) as FakeObserver;
    unmount();
    expect(observer.disconnected).toBe(true);
  });
});
