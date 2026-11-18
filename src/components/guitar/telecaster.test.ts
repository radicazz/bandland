import { describe, expect, it } from "vitest";
import { BRIDGE_Y, GUITAR_DIMENSIONS as D, fretY, neckWidthAt } from "./guitarModel";
import {
  BODY_OUTLINE,
  BRIDGE_PLATE_SIZE,
  CONTROL_PLATE,
  HEADSTOCK_OUTLINE,
  HUMBUCKER_SIZE,
  PICKGUARD_OUTLINE,
  pointInOutline,
  postPosition,
  stringX,
  tunerButtonX,
  type Outline,
} from "./telecaster";

function bounds(outline: Outline) {
  const xs = outline.map(([x]) => x);
  const ys = outline.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/** Highest y where the closed outline crosses the vertical line at `x`. */
function topEdgeAt(outline: Outline, x: number): number {
  let top = -Infinity;
  for (const [i, [x1, y1]] of outline.entries()) {
    const [x2, y2] = outline[(i + 1) % outline.length] ?? [x1, y1];
    if ((x1 <= x && x <= x2) || (x2 <= x && x <= x1)) {
      const y = x1 === x2 ? Math.max(y1, y2) : y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
      top = Math.max(top, y);
    }
  }
  return top;
}

const STRINGS = Array.from({ length: D.stringCount }, (_, index) => index);

describe("telecaster body", () => {
  it("is ≈2.40 wide and ≈2.96 long", () => {
    const { minX, maxX, minY, maxY } = bounds(BODY_OUTLINE);
    expect(maxX - minX).toBeGreaterThanOrEqual(2.35);
    expect(maxX - minX).toBeLessThanOrEqual(2.45);
    expect(maxY - minY).toBeGreaterThanOrEqual(2.9);
    expect(maxY - minY).toBeLessThanOrEqual(3.02);
  });

  it("has nearly parallel sides", () => {
    const lower = BODY_OUTLINE.filter(([, y]) => y >= -1.1 && y <= -0.3);
    for (const side of [-1, 1]) {
      const reach = lower.filter(([x]) => Math.sign(x) === side).map(([x]) => Math.abs(x));
      expect(reach.length).toBeGreaterThan(1);
      expect(Math.max(...reach) - Math.min(...reach)).toBeLessThan(0.08);
    }
  });

  it("has a treble horn shorter than the bass shoulder", () => {
    const horn = Math.max(...BODY_OUTLINE.filter(([x]) => x > 0.3).map(([, y]) => y));
    const shoulder = Math.max(...BODY_OUTLINE.filter(([x]) => x < -0.3).map(([, y]) => y));
    expect(shoulder - horn).toBeGreaterThanOrEqual(0.2);
  });

  it("meets the fretboard near fret 16", () => {
    const pocket = topEdgeAt(BODY_OUTLINE, 0) + D.bodyCenterY;
    expect(Math.abs(pocket - fretY(16))).toBeLessThan(0.12);
  });

  it("keeps the pickguard inside the body", () => {
    for (const [x, y] of PICKGUARD_OUTLINE) {
      expect(pointInOutline(BODY_OUTLINE, x, y)).toBe(true);
    }
  });

  it("keeps both control plate ends inside the body", () => {
    const { x, y, angle, length } = CONTROL_PLATE;
    // The plate's long axis is its local +y, rotated by `angle` about z.
    const dx = -Math.sin(angle) * (length / 2);
    const dy = Math.cos(angle) * (length / 2);
    expect(pointInOutline(BODY_OUTLINE, x + dx, y + dy)).toBe(true);
    expect(pointInOutline(BODY_OUTLINE, x - dx, y - dy)).toBe(true);
  });
});

describe("telecaster strings", () => {
  it("fan within the neck", () => {
    const lastFret = fretY(D.totalFrets);
    for (const index of STRINGS) {
      expect(Math.abs(stringX(index, D.nutY))).toBeLessThan(D.neckWidthAtNut / 2 - 0.02);
      expect(Math.abs(stringX(index, lastFret))).toBeLessThan(neckWidthAt(lastFret) / 2 - 0.02);
    }
  });

  it("sit inside the humbuckers and the bridge plate", () => {
    const outer = [0, D.stringCount - 1];
    for (const index of outer) {
      for (const y of [D.neckPickupY, D.bridgePickupY]) {
        expect(Math.abs(stringX(index, y)) + 0.03).toBeLessThan(HUMBUCKER_SIZE.width / 2);
      }
      expect(Math.abs(stringX(index, BRIDGE_Y)) + 0.03).toBeLessThan(BRIDGE_PLATE_SIZE.width / 2);
    }
  });

  it("run from low E on the bass side to high E on the treble side", () => {
    expect(stringX(0, D.nutY)).toBeLessThan(0);
    expect(stringX(D.stringCount - 1, D.nutY)).toBeGreaterThan(0);
  });
});

describe("telecaster headstock", () => {
  it("is ≈0.55 wide and wider than the nut", () => {
    const { minX, maxX } = bounds(HEADSTOCK_OUTLINE);
    expect(maxX - minX).toBeGreaterThanOrEqual(0.5);
    expect(maxX - minX).toBeLessThanOrEqual(0.6);
    expect(maxX - minX).toBeGreaterThan(D.neckWidthAtNut);
  });

  it("carries the tuner posts, with the buttons hugging the bass edge", () => {
    for (const index of STRINGS) {
      const [x, y] = postPosition(index);
      expect(pointInOutline(HEADSTOCK_OUTLINE, x, y - D.nutY)).toBe(true);
    }
    const { minX } = bounds(HEADSTOCK_OUTLINE);
    expect(tunerButtonX()).toBeLessThan(minX);
    expect(minX - tunerButtonX()).toBeLessThanOrEqual(0.08);
  });
});

describe("pointInOutline", () => {
  const square: Outline = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];

  it("separates inside from outside", () => {
    expect(pointInOutline(square, 0, 0)).toBe(true);
    expect(pointInOutline(square, 0.9, -0.9)).toBe(true);
    expect(pointInOutline(square, 1.1, 0)).toBe(false);
    expect(pointInOutline(square, 0, -2)).toBe(false);
  });
});
