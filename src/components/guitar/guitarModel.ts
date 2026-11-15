import type { Vec3 } from "./journey";

/**
 * Named points on the guitar. The procedural model below implements them; a GLB
 * model can replace it later by exporting another `GuitarAnchors` value.
 * The guitar stands upright along +y: headstock on top, body at the bottom.
 */
export type GuitarAnchors = {
  headstock: Vec3;
  soundHole: Vec3;
  fretCount: number;
  fretPosition(index: number): Vec3; // clamps index to [0, fretCount-1]
};

// Shared dimensions for the procedural geometry (scene units).
export const GUITAR_DIMENSIONS = {
  bodyCenterY: -1.6,
  bodyDepth: 0.36,
  neckWidth: 0.24,
  neckDepth: 0.12,
  neckBottomY: -0.5,
  nutY: 2.2,
  headstockTopY: 3.05,
  headstockWidth: 0.38,
  scaleLength: 4.8, // nut to bridge; fret 12 sits at half of it
  stringCount: 6,
} as const;

const FRET_COUNT = 12;
// Front faces: the body is extruded from z=0 to bodyDepth, the neck sits on top of it.
export const BODY_FRONT_Z = GUITAR_DIMENSIONS.bodyDepth;
export const NECK_FRONT_Z = BODY_FRONT_Z + GUITAR_DIMENSIONS.neckDepth;
export const BRIDGE_Y = GUITAR_DIMENSIONS.nutY - GUITAR_DIMENSIONS.scaleLength;

function clampIndex(index: number): number {
  if (!Number.isFinite(index)) return index > 0 ? FRET_COUNT - 1 : 0;
  return Math.min(Math.max(Math.round(index), 0), FRET_COUNT - 1);
}

function fretPosition(index: number): Vec3 {
  // Equal-temperament spacing: fret n sits at L * (1 - 2^(-n/12)) from the nut.
  const fretNumber = clampIndex(index) + 1;
  const fromNut = GUITAR_DIMENSIONS.scaleLength * (1 - 2 ** (-fretNumber / 12));
  return [0, GUITAR_DIMENSIONS.nutY - fromNut, NECK_FRONT_Z];
}

export const proceduralAnchors: GuitarAnchors = {
  headstock: [0, (GUITAR_DIMENSIONS.nutY + GUITAR_DIMENSIONS.headstockTopY) / 2, NECK_FRONT_Z],
  soundHole: [0, -1.2, BODY_FRONT_Z],
  fretCount: FRET_COUNT,
  fretPosition,
};
