/** Dust motes in the stage light: a fixed point field plus a tiny sinusoidal drift. */

export const MOTE_COUNT = { phone: 150, desktop: 300 } as const;

export const MOTE_VOLUME = {
  halfWidth: 2.2,
  y: [-3.6, 3.6],
  z: [-1.5, 2.5],
} as const;

/** Largest drift from a mote's base position, reached at energy 1. */
export const MOTE_MAX_DRIFT = 0.12;

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cone around the guitar: the spread narrows toward the overhead light (high y). */
function spreadAt(y: number): number {
  const [low, high] = MOTE_VOLUME.y;
  return 0.45 + (0.55 * (high - y)) / (high - low);
}

/** `count` xyz triples inside the cone volume; deterministic for a seed. */
export function createMoteField(count: number, seed: number): Float32Array {
  const random = mulberry32(seed);
  const field = new Float32Array(count * 3);
  const [yLow, yHigh] = MOTE_VOLUME.y;
  const [zLow, zHigh] = MOTE_VOLUME.z;
  for (let i = 0; i < count; i += 1) {
    const y = yLow + random() * (yHigh - yLow);
    field[i * 3] = (random() * 2 - 1) * MOTE_VOLUME.halfWidth * spreadAt(y);
    field[i * 3 + 1] = y;
    field[i * 3 + 2] = zLow + random() * (zHigh - zLow);
  }
  return field;
}

/**
 * Offsets every point from `base` by a slow drift whose amplitude follows
 * `energy` (clamped to 0..1). Zero energy puts every point back on its base.
 */
export function stepMotes(
  positions: Float32Array,
  base: Float32Array,
  time: number,
  energy: number,
): void {
  const amplitude = MOTE_MAX_DRIFT * Math.min(Math.max(energy, 0), 1);
  const count = Math.min(positions.length, base.length) / 3;
  for (let i = 0; i < count; i += 1) {
    const phase = i * 1.618;
    positions[i * 3] = (base[i * 3] ?? 0) + amplitude * Math.sin(time * 0.7 + phase);
    positions[i * 3 + 1] = (base[i * 3 + 1] ?? 0) + amplitude * Math.sin(time * 0.5 + phase * 1.3);
    positions[i * 3 + 2] = (base[i * 3 + 2] ?? 0) + amplitude * Math.cos(time * 0.6 + phase * 0.7);
  }
}
