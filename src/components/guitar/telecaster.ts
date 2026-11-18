import { GUITAR_DIMENSIONS as D } from "./guitarModel";

/**
 * Telecaster geometry (scene units, 1 unit ≈ 135 mm), kept free of three.js so
 * it can be tested. Outlines are closed control polygons; `Guitar.tsx` smooths
 * them with a centripetal Catmull-Rom curve, which passes through every point.
 * Bass side is -x (low E), treble side is +x (high E).
 */
export type Outline = ReadonlyArray<readonly [number, number]>;

/**
 * Body slab, authored around (0, 0) and placed at `bodyCenterY`; traced from a
 * front photo of a Telecaster (neck axis vertical, 2.40 wide). Flat neck pocket
 * at y = 1.46, rounded bass shoulder with the waist below it, a deep cutaway into
 * the treble horn, and a lower bout that flares out to round corners.
 */
export const BODY_OUTLINE: Outline = [
  [-0.053, 1.461],
  [-0.184, 1.457],
  [-0.296, 1.402],
  [-0.414, 1.456],
  [-0.533, 1.51],
  [-0.658, 1.541],
  [-0.788, 1.531],
  [-0.905, 1.476],
  [-0.985, 1.373],
  [-1.02, 1.248],
  [-1.027, 1.117],
  [-1.006, 0.988],
  [-0.967, 0.864],
  [-0.92, 0.742],
  [-0.875, 0.619],
  [-0.85, 0.491],
  [-0.855, 0.36],
  [-0.892, 0.235],
  [-0.944, 0.115],
  [-1.0, -0.003],
  [-1.056, -0.122],
  [-1.106, -0.242],
  [-1.15, -0.366],
  [-1.184, -0.492],
  [-1.205, -0.621],
  [-1.21, -0.752],
  [-1.198, -0.882],
  [-1.163, -1.007],
  [-1.105, -1.125],
  [-1.027, -1.229],
  [-0.931, -1.318],
  [-0.818, -1.384],
  [-0.696, -1.43],
  [-0.568, -1.456],
  [-0.438, -1.473],
  [-0.307, -1.482],
  [-0.177, -1.485],
  [-0.048, -1.496],
  [0.072, -1.488],
  [0.202, -1.483],
  [0.333, -1.475],
  [0.463, -1.465],
  [0.594, -1.453],
  [0.722, -1.428],
  [0.844, -1.382],
  [0.955, -1.313],
  [1.047, -1.22],
  [1.121, -1.114],
  [1.173, -0.995],
  [1.21, -0.869],
  [1.217, -0.739],
  [1.209, -0.609],
  [1.184, -0.48],
  [1.148, -0.354],
  [1.102, -0.232],
  [1.049, -0.112],
  [0.993, 0.006],
  [0.936, 0.124],
  [0.884, 0.244],
  [0.85, 0.37],
  [0.846, 0.5],
  [0.875, 0.628],
  [0.92, 0.751],
  [0.967, 0.873],
  [1.004, 0.998],
  [1.021, 1.128],
  [1.011, 1.258],
  [0.971, 1.382],
  [0.884, 1.476],
  [0.759, 1.466],
  [0.687, 1.36],
  [0.651, 1.234],
  [0.589, 1.12],
  [0.497, 1.027],
  [0.373, 0.992],
  [0.258, 1.047],
  [0.207, 1.165],
  [0.205, 1.296],
  [0.196, 1.425],
  [0.078, 1.461],
];

/**
 * One-piece HH guard in the body frame, traced from the same photo (it runs
 * under the neck to the pocket), with the lower edge carried past the bridge
 * humbucker to the bridge plate, as on HH Teles. It stops short of the control
 * plate.
 */
export const PICKGUARD_OUTLINE: Outline = [
  [-0.021, 1.42],
  [-0.146, 1.42],
  [-0.207, 1.38],
  [-0.262, 1.289],
  [-0.361, 1.215],
  [-0.433, 1.114],
  [-0.492, 1.004],
  [-0.535, 0.887],
  [-0.57, 0.767],
  [-0.597, 0.645],
  [-0.613, 0.522],
  [-0.622, 0.398],
  [-0.62, 0.273],
  [-0.604, 0.15],
  [-0.604, 0.025],
  [-0.604, -0.1],
  [-0.604, -0.225],
  [-0.596, -0.348],
  [-0.475, -0.36],
  [-0.35, -0.36],
  [-0.225, -0.36],
  [-0.101, -0.36],
  [0.024, -0.36],
  [0.149, -0.36],
  [0.274, -0.36],
  [0.398, -0.36],
  [0.516, -0.342],
  [0.521, -0.218],
  [0.521, -0.093],
  [0.521, 0.032],
  [0.523, 0.156],
  [0.646, 0.162],
  [0.771, 0.161],
  [0.841, 0.222],
  [0.807, 0.342],
  [0.796, 0.465],
  [0.813, 0.588],
  [0.844, 0.705],
  [0.891, 0.819],
  [0.942, 0.939],
  [0.969, 1.061],
  [0.966, 1.176],
  [0.936, 1.287],
  [0.871, 1.381],
  [0.783, 1.42],
  [0.729, 1.317],
  [0.692, 1.199],
  [0.621, 1.075],
  [0.527, 0.981],
  [0.423, 0.947],
  [0.305, 0.952],
  [0.214, 1.042],
  [0.234, 1.005],
  [0.248, 0.987],
  [0.256, 0.991],
  [0.103, 1.42],
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

/** Chrome control plate on the lower treble bout (body frame), parallel to the strings; long axis tilted by `angle`. */
export const CONTROL_PLATE = {
  x: 0.69,
  y: -0.44,
  angle: 0,
  length: 1.1,
  width: 0.24,
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
