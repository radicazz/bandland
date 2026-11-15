import { describe, expect, it } from "vitest";
import { computeRoutePosition } from "./useScrollProgress";

describe("computeRoutePosition", () => {
  const centers = [100, 500, 900, 1300];

  it("returns 0 above first center, n-1 below last, 1.5 midway between centers 1 and 2", () => {
    expect(computeRoutePosition(centers, 0)).toBe(0);
    expect(computeRoutePosition(centers, 5000)).toBe(3);
    expect(computeRoutePosition(centers, 700)).toBeCloseTo(1.5);
  });

  it("returns exact indexes on centers", () => {
    expect(computeRoutePosition(centers, 100)).toBe(0);
    expect(computeRoutePosition(centers, 900)).toBe(2);
  });

  it("returns 0 for an empty route", () => {
    expect(computeRoutePosition([], 300)).toBe(0);
  });

  it("interpolates across missing (non-finite) centers using route indexes", () => {
    expect(computeRoutePosition([0, Number.NaN, 400], 200)).toBeCloseTo(1);
  });
});
