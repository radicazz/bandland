import type { Vec3 } from "./journey";

/**
 * Named points on the guitar. The procedural model below implements them; a GLB
 * model can replace it later by exporting another `GuitarAnchors` value.
 * The guitar stands upright along +y: headstock on top, body at the bottom.
 */
export type GuitarAnchors = {
  headstock: Vec3;
  /** Body focal point (the neck pickup on the procedural electric). */
  soundHole: Vec3;
  fretCount: number;
  fretPosition(index: number): Vec3; // clamps index to [0, fretCount-1]
};

// Shared dimensions for the procedural geometry (scene units). The body outline
// is authored around `bodyCenterY`; the neck joins it near fret 16.
export const GUITAR_DIMENSIONS = {
  bodyCenterY: -1.8,
  bodyDepth: 0.22,
  neckLift: 0.06, // gap between the body top and the fretboard underside
  fretboardThickness: 0.02,
  neckWidthAtNut: 0.21,
  neckWidthAtEnd: 0.28,
  neckBottomY: -1.25, // end of the fretboard, just past the last fret
  nutY: 2.2,
  headstockLength: 1.02,
  scaleLength: 4.8, // nut to bridge; fret 12 sits at half of it
  stringCount: 6,
  totalFrets: 21, // fret wires drawn on the neck
  neckPickupY: -1.52,
  bridgePickupY: -2.32,
} as const;

// Frets 1..12 map to show rows and can light up; the rest are decoration.
const FRET_COUNT = 12;
export const BODY_FRONT_Z = GUITAR_DIMENSIONS.bodyDepth;
export const FRETBOARD_BACK_Z = BODY_FRONT_Z + GUITAR_DIMENSIONS.neckLift;
export const NECK_FRONT_Z = FRETBOARD_BACK_Z + GUITAR_DIMENSIONS.fretboardThickness;
export const BRIDGE_Y = GUITAR_DIMENSIONS.nutY - GUITAR_DIMENSIONS.scaleLength;
export const HEADSTOCK_TOP_Y = GUITAR_DIMENSIONS.nutY + GUITAR_DIMENSIONS.headstockLength;

/** Distance from the nut to fret `n` (1-based), equal temperament. */
export function fretY(fretNumber: number): number {
  return GUITAR_DIMENSIONS.nutY - GUITAR_DIMENSIONS.scaleLength * (1 - 2 ** (-fretNumber / 12));
}

/** Fretboard width at height `y` (tapers linearly from the nut to its end). */
export function neckWidthAt(y: number): number {
  const { nutY, neckBottomY, neckWidthAtNut, neckWidthAtEnd } = GUITAR_DIMENSIONS;
  const t = Math.min(Math.max((nutY - y) / (nutY - neckBottomY), 0), 1);
  return neckWidthAtNut + (neckWidthAtEnd - neckWidthAtNut) * t;
}

function clampIndex(index: number): number {
  if (!Number.isFinite(index)) return index > 0 ? FRET_COUNT - 1 : 0;
  return Math.min(Math.max(Math.round(index), 0), FRET_COUNT - 1);
}

function fretPosition(index: number): Vec3 {
  return [0, fretY(clampIndex(index) + 1), NECK_FRONT_Z];
}

export const proceduralAnchors: GuitarAnchors = {
  headstock: [0, (GUITAR_DIMENSIONS.nutY + HEADSTOCK_TOP_Y) / 2, NECK_FRONT_Z],
  soundHole: [0, GUITAR_DIMENSIONS.neckPickupY, BODY_FRONT_Z],
  fretCount: FRET_COUNT,
  fretPosition,
};
