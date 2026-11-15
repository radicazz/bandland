import { describe, expect, it } from "vitest";
import { proceduralAnchors } from "./guitarModel";

describe("proceduralAnchors", () => {
  it("fretPosition clamps index above fretCount-1 and below 0", () => {
    const { fretCount, fretPosition } = proceduralAnchors;
    expect(fretCount).toBeGreaterThan(1);
    expect(fretPosition(fretCount + 5)).toEqual(fretPosition(fretCount - 1));
    expect(fretPosition(-3)).toEqual(fretPosition(0));
    expect(fretPosition(1)).not.toEqual(fretPosition(0));
  });

  it("orders frets from the headstock down toward the body", () => {
    const { fretCount, fretPosition, headstock, soundHole } = proceduralAnchors;
    const first = fretPosition(0)[1];
    const last = fretPosition(fretCount - 1)[1];
    expect(headstock[1]).toBeGreaterThan(first);
    expect(first).toBeGreaterThan(last);
    expect(last).toBeGreaterThan(soundHole[1]);
  });
});
