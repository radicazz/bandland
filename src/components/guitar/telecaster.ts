import { GUITAR_DIMENSIONS as D } from "./guitarModel";

/**
 * Telecaster geometry (scene units, 1 unit ≈ 135 mm), kept free of three.js so
 * it can be tested. Outlines are closed control polygons; `Guitar.tsx` smooths
 * them with a centripetal Catmull-Rom curve, which passes through every point.
 * Bass side is -x (low E), treble side is +x (high E).
 */
export type Outline = ReadonlyArray<readonly [number, number]>;

/**
 * Body slab, authored around (0, 0) and placed at `bodyCenterY`. Flat neck
 * pocket across the top, a deep tight cutaway into a short pointed treble horn,
 * near-parallel sides, a squarish lower bout with ≈0.35 corners and a single
 * rounded bass shoulder.
 */
export const BODY_OUTLINE: Outline = [
  // Neck pocket.
  [0, 1.46],
  [0.21, 1.46],
  // Cutaway: down the side of the neck, then out to the horn.
  [0.215, 1.26],
  [0.225, 1.06],
  [0.26, 0.92],
  [0.34, 0.84],
  [0.46, 0.815],
  [0.58, 0.85],
  [0.69, 0.95],
  [0.79, 1.08],
  [0.88, 1.18],
  // Treble horn tip.
  [0.95, 1.225],
  [1.02, 1.2],
  [1.08, 1.1],
  // Treble side.
  [1.12, 0.94],
  [1.145, 0.7],
  [1.165, 0.4],
  [1.18, 0.1],
  [1.19, -0.3],
  [1.2, -0.7],
  [1.2, -1.0],
  // Lower treble corner (radius ≈0.35 around (0.85, -1.13)).
  [1.2, -1.13],
  [1.153, -1.305],
  [1.025, -1.433],
  [0.85, -1.48],
  // Bottom edge, faintly crowned.
  [0.42, -1.488],
  [0, -1.49],
  [-0.42, -1.488],
  [-0.85, -1.48],
  // Lower bass corner.
  [-1.025, -1.433],
  [-1.153, -1.305],
  [-1.2, -1.13],
  // Bass side.
  [-1.2, -1.0],
  [-1.2, -0.7],
  [-1.19, -0.3],
  [-1.18, 0.1],
  [-1.165, 0.4],
  // Bass shoulder, rolling into the top edge at the pocket.
  [-1.14, 0.7],
  [-1.08, 0.98],
  [-0.97, 1.2],
  [-0.82, 1.36],
  [-0.63, 1.45],
  [-0.42, 1.48],
  [-0.21, 1.46],
];

/**
 * One-piece HH guard in the body frame: follows the cutaway, wraps both
 * humbuckers, and stops short of the bridge plate and the control plate.
 */
export const PICKGUARD_OUTLINE: Outline = [
  [0.19, 1.15],
  [0.2, 0.96],
  [0.24, 0.85],
  [0.32, 0.79],
  [0.45, 0.77],
  [0.57, 0.8],
  [0.66, 0.84],
  [0.72, 0.7],
  [0.74, 0.45],
  [0.7, 0.15],
  [0.6, -0.12],
  [0.48, -0.3],
  [0.3, -0.36],
  [0, -0.36],
  [-0.3, -0.36],
  [-0.55, -0.3],
  [-0.75, -0.1],
  [-0.88, 0.2],
  [-0.95, 0.55],
  [-0.94, 0.9],
  [-0.85, 1.15],
  [-0.65, 1.3],
  [-0.42, 1.34],
  [-0.22, 1.3],
  [-0.18, 1.18],
];

/**
 * Headstock, authored from the nut (y = 0) upward: a straight bass edge that
 * carries the six tuners, and a treble edge that bulges out toward the rounded
 * tip. It dips just below the nut to overlap the neck.
 */
export const HEADSTOCK_OUTLINE: Outline = [
  [0.155, -0.06],
  [0.16, 0.1],
  [0.19, 0.26],
  [0.25, 0.42],
  [0.3, 0.58],
  [0.33, 0.74],
  [0.33, 0.88],
  [0.3, 0.98],
  [0.22, 1.05],
  [0.1, 1.08],
  [-0.04, 1.08],
  [-0.14, 1.06],
  [-0.195, 1.0],
  [-0.21, 0.9],
  [-0.21, 0.6],
  [-0.21, 0.3],
  [-0.2, 0.12],
  [-0.17, 0.02],
  [-0.155, -0.06],
  [0, -0.08],
];

/** Chrome control plate on the lower treble bout (body frame), long axis tilted by `angle`. */
export const CONTROL_PLATE = {
  x: 0.86,
  y: -0.84,
  angle: -0.22,
  length: 0.86,
  width: 0.22,
} as const;

/** Bevel size and thickness of the body's crisp slab edge. */
export const BODY_EDGE = 0.035;

export const HUMBUCKER_SIZE = { width: 0.52, height: 0.28 } as const;
export const BRIDGE_PLATE_SIZE = { width: 0.62, height: 0.34 } as const;

// Half the string spread at the nut and at the bridge saddles.
const NUT_SPREAD = 0.12;
const BRIDGE_SPREAD = 0.19;

/** String x at height y: strings fan out from the nut to the bridge. */
export function stringX(index: number, y: number): number {
  const t = D.stringCount > 1 ? index / (D.stringCount - 1) : 0.5;
  const nutX = -NUT_SPREAD + t * 2 * NUT_SPREAD;
  const bridgeX = -BRIDGE_SPREAD + t * 2 * BRIDGE_SPREAD;
  const u = (D.nutY - y) / D.scaleLength;
  return nutX + (bridgeX - nutX) * u;
}

// Tuner posts in a line just inside the straight bass edge.
const POST_X = -0.12;
const FIRST_POST = 0.2; // above the nut
const POST_SPACING = 0.14;

/** Tuner post (x, y) on the headstock face; low E (index 0) sits nearest the nut. */
export function postPosition(index: number): [number, number] {
  return [POST_X, D.nutY + FIRST_POST + index * POST_SPACING];
}

/** x of the tuner buttons, just off the bass edge of the headstock. */
export function tunerButtonX(): number {
  return -0.27;
}

/** Even-odd ray cast: is (x, y) inside the closed `outline`? */
export function pointInOutline(outline: Outline, x: number, y: number): boolean {
  let inside = false;
  let previous = outline[outline.length - 1];
  for (const point of outline) {
    if (previous) {
      const [xi, yi] = point;
      const [xj, yj] = previous;
      if (yi > y !== yj > y && x < xj + ((y - yi) / (yj - yi)) * (xi - xj)) inside = !inside;
    }
    previous = point;
  }
  return inside;
}
