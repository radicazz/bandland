import type { WidgetSetting } from "@/content/schema";

export type StopId = "hero" | "release" | "neck" | "body" | "outro";
export type Vec3 = [number, number, number];
export type CameraPose = { position: Vec3; target: Vec3 };

// Guitar stands upright along +y: headstock at the top, body at the bottom.
// Hero/outro sit far enough back (fov 35) for the whole ~6-unit guitar to fit a
// portrait stage; release leaves room for the pulse ring at full scale.
export const CAMERA_POSES: Record<StopId, CameraPose> = {
  hero: { position: [0, -0.4, 11.5], target: [0, 0.1, 0] },
  release: { position: [0.4, 2.7, 3.2], target: [0, 2.62, 0] },
  neck: { position: [1.2, 1, 2.6], target: [0, 1, 0] },
  body: { position: [0, -1.8, 5], target: [0, -1.6, 0] },
  outro: { position: [0, -0.4, 11.5], target: [0, 0.1, 0] },
};

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

function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function sampleCamera(route: readonly StopId[], position: number): CameraPose {
  const last = route.length - 1;
  if (last < 0) return CAMERA_POSES.hero;
  const p = Math.min(Math.max(position, 0), last);
  const index = Math.min(Math.floor(p), last);
  const fromId = route[index];
  const toId = route[index + 1];
  if (fromId === undefined) return CAMERA_POSES.hero;
  const from = CAMERA_POSES[fromId];
  if (toId === undefined || p === index) return from;
  const to = CAMERA_POSES[toId];
  const t = smoothstep(p - index);
  return { position: lerp(from.position, to.position, t), target: lerp(from.target, to.target, t) };
}
