import type { WidgetSetting } from "@/content/schema";

export type StopId = "hero" | "release" | "neck" | "body" | "outro";
export type Vec3 = [number, number, number];
export type CameraPose = { position: Vec3; target: Vec3 };

// Guitar stands upright along +y: headstock at the top (~3.2), body at the
// bottom (~-3.6). Hero/outro sit far enough back (fov 35) for the whole guitar to
// fit a portrait stage, yawed to opposite sides so the bevels and depth read and
// the end of the journey is not a repeat of its start.
/**
 * md+: the stage spans the viewport behind a left-hand text column, so the
 * render is shifted right by this fraction of its width. The CSS backdrop and
 * the poster (`.guitar-stage` in globals.css, GuitarStage) mirror it.
 */
export const STAGE_SHIFT = 0.2;
export const STAGE_SHIFT_MIN_WIDTH = 768;

export const CAMERA_POSES: Record<StopId, CameraPose> = {
  hero: { position: [-2.8, 0.1, 12.2], target: [0, -0.1, 0] },
  release: { position: [0.9, 2.95, 2.6], target: [0.05, 2.7, 0.3] },
  neck: { position: [1.2, 1, 2.6], target: [0, 1, 0] },
  body: { position: [-1.4, -1.8, 5.6], target: [0, -1.95, 0.2] },
  outro: { position: [2.8, 0.1, 12.2], target: [0, -0.1, 0] },
};

/** Peak sideways and outward camera offset halfway between two stops. */
export const TRANSITION_ARC = { side: 0.9, out: 1.4 } as const;

const WIDGET_STOP: Partial<Record<WidgetSetting["id"], StopId>> = {
  nextShow: "neck",
  merch: "body",
};

export function buildRoute(widgets: readonly WidgetSetting[]): StopId[] {
  const enabled = widgets.filter((widget) => widget.enabled);
  const route: StopId[] = ["hero"];
  if (enabled.some((widget) => widget.id === "release")) route.push("release");
  for (const widget of enabled) {
    const stop = WIDGET_STOP[widget.id];
    if (stop) route.push(stop);
  }
  route.push("outro");
  return route;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

type Segment = { index: number; from: StopId; to: StopId | undefined; t: number };

/** Locates a fractional route position as a stop index plus progress toward the next stop. */
function locateSegment(route: readonly StopId[], position: number): Segment | undefined {
  const last = route.length - 1;
  if (last < 0) return undefined;
  const p = Math.min(Math.max(position, 0), last);
  const index = Math.min(Math.floor(p), last);
  const from = route[index];
  if (from === undefined) return undefined;
  return { index, from, to: route[index + 1], t: p - index };
}

export function sampleCamera(route: readonly StopId[], position: number): CameraPose {
  const segment = locateSegment(route, position);
  if (!segment) return CAMERA_POSES.hero;
  const from = CAMERA_POSES[segment.from];
  if (segment.to === undefined || segment.t === 0) return from;
  const to = CAMERA_POSES[segment.to];
  const { index } = segment;
  const t = smoothstep(segment.t);
  const eye = lerpVec3(from.position, to.position, t);
  // Between stops the camera swings out and to the side instead of dollying in a
  // straight line, alternating sides so consecutive moves do not repeat.
  const swing = Math.sin(Math.PI * t);
  const side = index % 2 === 0 ? 1 : -1;
  eye[0] += TRANSITION_ARC.side * side * swing;
  eye[2] += TRANSITION_ARC.out * swing;
  return { position: eye, target: lerpVec3(from.target, to.target, t) };
}

export type LightPose = { x: number; y: number; size: number };

/**
 * Light pool per stop: x is percent of the stage relative to the guitar centre
 * (0 = centre), y is percent from the top, size is the ellipse width in percent.
 */
export const LIGHT_POSES: Record<StopId, LightPose> = {
  hero: { x: 0, y: 38, size: 55 },
  release: { x: -4, y: 18, size: 38 },
  neck: { x: 2, y: 40, size: 32 },
  body: { x: 0, y: 62, size: 48 },
  outro: { x: 0, y: 40, size: 60 },
};

/** Blends the light pool between stops with the same clamping and easing as sampleCamera. */
export function sampleLight(route: readonly StopId[], position: number): LightPose {
  const segment = locateSegment(route, position);
  if (!segment) return LIGHT_POSES.hero;
  const from = LIGHT_POSES[segment.from];
  if (segment.to === undefined || segment.t === 0) return from;
  const to = LIGHT_POSES[segment.to];
  const t = smoothstep(segment.t);
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    size: lerp(from.size, to.size, t),
  };
}
