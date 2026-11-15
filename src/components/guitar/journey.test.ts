import { describe, expect, it } from "vitest";
import type { WidgetSetting } from "@/content/schema";
import { CAMERA_POSES, buildRoute, sampleCamera } from "./journey";

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

  it("returns the midpoint at 0.5 between two stops", () => {
    const a = CAMERA_POSES.hero;
    const b = CAMERA_POSES.release;
    const pose = sampleCamera(route, 0.5);
    for (const i of [0, 1, 2] as const) {
      expect(pose.position[i]).toBeCloseTo((a.position[i] + b.position[i]) / 2);
      expect(pose.target[i]).toBeCloseTo((a.target[i] + b.target[i]) / 2);
    }
  });

  it("clamps below 0 and above length-1", () => {
    expect(sampleCamera(route, -3)).toEqual(CAMERA_POSES.hero);
    expect(sampleCamera(route, 99)).toEqual(CAMERA_POSES.neck);
  });
});
