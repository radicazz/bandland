import { describe, expect, it } from "vitest";
import type { WidgetSetting } from "@/content/schema";
import {
  CAMERA_POSES,
  LIGHT_POSES,
  TRANSITION_ARC,
  buildRoute,
  sampleCamera,
  sampleLight,
} from "./journey";

const w = (id: WidgetSetting["id"], enabled = true): WidgetSetting => ({
  id,
  enabled,
  width: "half",
});

describe("buildRoute", () => {
  it("with default widgets returns the full route", () => {
    expect(buildRoute([w("nextShow"), w("release"), w("merch")])).toEqual([
      "hero",
      "release",
      "neck",
      "body",
      "outro",
    ]);
  });

  it("keeps release fixed at stop 2 and follows admin order for the rest", () => {
    expect(buildRoute([w("merch"), w("nextShow"), w("release")])).toEqual([
      "hero",
      "release",
      "body",
      "neck",
      "outro",
    ]);
  });

  it("skips disabled widgets", () => {
    expect(buildRoute([w("nextShow", false), w("release"), w("merch", false)])).toEqual([
      "hero",
      "release",
      "outro",
    ]);
  });

  it("returns only hero and outro when all widgets are disabled", () => {
    expect(buildRoute([w("nextShow", false), w("release", false), w("merch", false)])).toEqual([
      "hero",
      "outro",
    ]);
  });
});

describe("sampleCamera", () => {
  const route = ["hero", "release", "neck"] as const;

  it("returns the stop's pose exactly at integer positions", () => {
    expect(sampleCamera(route, 0)).toEqual(CAMERA_POSES.hero);
    expect(sampleCamera(route, 1)).toEqual(CAMERA_POSES.release);
    expect(sampleCamera(route, 2)).toEqual(CAMERA_POSES.neck);
  });

  it("aims at the midpoint at 0.5 and swings the camera out on an arc", () => {
    const a = CAMERA_POSES.hero;
    const b = CAMERA_POSES.release;
    const pose = sampleCamera(route, 0.5);
    for (const i of [0, 1, 2] as const) {
      expect(pose.target[i]).toBeCloseTo((a.target[i] + b.target[i]) / 2);
    }
    expect(pose.position[0]).toBeCloseTo((a.position[0] + b.position[0]) / 2 + TRANSITION_ARC.side);
    expect(pose.position[1]).toBeCloseTo((a.position[1] + b.position[1]) / 2);
    expect(pose.position[2]).toBeCloseTo((a.position[2] + b.position[2]) / 2 + TRANSITION_ARC.out);
  });

  it("swings to the other side on the next segment", () => {
    const a = CAMERA_POSES.release;
    const b = CAMERA_POSES.neck;
    const pose = sampleCamera(route, 1.5);
    expect(pose.position[0]).toBeCloseTo((a.position[0] + b.position[0]) / 2 - TRANSITION_ARC.side);
  });

  it("clamps below 0 and above length-1", () => {
    expect(sampleCamera(route, -3)).toEqual(CAMERA_POSES.hero);
    expect(sampleCamera(route, 99)).toEqual(CAMERA_POSES.neck);
  });
});

describe("sampleLight", () => {
  const route = ["hero", "release", "neck"] as const;

  it("every stop has a light pose", () => {
    for (const id of ["hero", "release", "neck", "body", "outro"] as const) {
      const pose = LIGHT_POSES[id];
      expect(Number.isFinite(pose.x)).toBe(true);
      expect(Number.isFinite(pose.y)).toBe(true);
      expect(pose.size).toBeGreaterThan(0);
    }
  });

  it("returns the stop pose exactly at integer positions", () => {
    expect(sampleLight(route, 0)).toEqual(LIGHT_POSES.hero);
    expect(sampleLight(route, 1)).toEqual(LIGHT_POSES.release);
    expect(sampleLight(route, 2)).toEqual(LIGHT_POSES.neck);
  });

  it("blends monotonically between hero and release", () => {
    const a = LIGHT_POSES.hero;
    const b = LIGHT_POSES.release;
    const between = (v: number, p: number, q: number) =>
      v >= Math.min(p, q) - 1e-9 && v <= Math.max(p, q) + 1e-9;
    const q1 = sampleLight(["hero", "release"], 0.25);
    const q2 = sampleLight(["hero", "release"], 0.5);
    const q3 = sampleLight(["hero", "release"], 0.75);
    for (const pose of [q1, q2, q3]) {
      expect(between(pose.x, a.x, b.x)).toBe(true);
      expect(between(pose.y, a.y, b.y)).toBe(true);
      expect(between(pose.size, a.size, b.size)).toBe(true);
    }
    // Moving forward along the segment keeps each channel moving the same way.
    for (const key of ["x", "y", "size"] as const) {
      const step = Math.sign(b[key] - a[key]);
      expect(Math.sign(q2[key] - q1[key]) * step).toBeGreaterThanOrEqual(0);
      expect(Math.sign(q3[key] - q2[key]) * step).toBeGreaterThanOrEqual(0);
    }
  });

  it("clamps outside the route and handles an empty route", () => {
    expect(sampleLight(route, -3)).toEqual(LIGHT_POSES.hero);
    expect(sampleLight(route, 99)).toEqual(LIGHT_POSES.neck);
    expect(sampleLight([], 0)).toEqual(LIGHT_POSES.hero);
  });
});
