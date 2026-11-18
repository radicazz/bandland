import { describe, expect, it } from "vitest";
import { createMoteField, MOTE_COUNT, stepMotes } from "./motes";

describe("motes", () => {
  it("createMoteField is deterministic for a seed and has count*3 values", () => {
    const a = createMoteField(MOTE_COUNT.phone, 7);
    expect(a).toHaveLength(MOTE_COUNT.phone * 3);
    expect(Array.from(createMoteField(MOTE_COUNT.phone, 7))).toEqual(Array.from(a));
    expect(Array.from(createMoteField(MOTE_COUNT.phone, 8))).not.toEqual(Array.from(a));
  });

  it("all motes lie inside the volume", () => {
    const field = createMoteField(MOTE_COUNT.desktop, 3);
    for (let i = 0; i < MOTE_COUNT.desktop; i += 1) {
      expect(Math.abs(field[i * 3] ?? 99)).toBeLessThanOrEqual(2.2);
      expect(field[i * 3 + 1]).toBeGreaterThanOrEqual(-3.6);
      expect(field[i * 3 + 1]).toBeLessThanOrEqual(3.6);
      expect(field[i * 3 + 2]).toBeGreaterThanOrEqual(-1.5);
      expect(field[i * 3 + 2]).toBeLessThanOrEqual(2.5);
    }
  });

  it("stepMotes with zero energy leaves positions equal to base", () => {
    const base = createMoteField(50, 1);
    const positions = new Float32Array(base.length);
    stepMotes(positions, base, 12.3, 0);
    expect(Array.from(positions)).toEqual(Array.from(base));
  });

  it("stepMotes displacement grows with energy and stays under 0.15", () => {
    const base = createMoteField(50, 1);
    const maxShift = (energy: number) => {
      const positions = new Float32Array(base.length);
      stepMotes(positions, base, 4.2, energy);
      let max = 0;
      for (let i = 0; i < base.length; i += 1) {
        max = Math.max(max, Math.abs((positions[i] ?? 0) - (base[i] ?? 0)));
      }
      return max;
    };
    expect(maxShift(0.5)).toBeGreaterThan(maxShift(0.1));
    expect(maxShift(0.1)).toBeGreaterThan(0);
    expect(maxShift(1)).toBeLessThan(0.15);
    expect(maxShift(50)).toBeLessThan(0.15);
  });
});
