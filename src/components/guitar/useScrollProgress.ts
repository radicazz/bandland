"use client";

import { useEffect, useState } from "react";
import type { StopId } from "./journey";

/**
 * Pure: maps the viewport center onto route index units by interpolating
 * between section centers (all in the same coordinate space, ascending).
 * Non-finite centers (missing sections) are skipped but keep their index.
 */
export function computeRoutePosition(centers: number[], viewportCenter: number): number {
  const known: Array<{ index: number; center: number }> = [];
  centers.forEach((center, index) => {
    if (Number.isFinite(center)) known.push({ index, center });
  });
  const first = known[0];
  const last = known[known.length - 1];
  if (!first || !last) return 0;
  if (viewportCenter <= first.center) return first.index;
  if (viewportCenter >= last.center) return last.index;
  for (let i = 0; i < known.length - 1; i += 1) {
    const a = known[i];
    const b = known[i + 1];
    if (!a || !b) continue;
    if (viewportCenter >= a.center && viewportCenter <= b.center) {
      const span = b.center - a.center;
      const t = span > 0 ? (viewportCenter - a.center) / span : 0;
      return a.index + (b.index - a.index) * t;
    }
  }
  return last.index;
}

// Matches Tailwind's `md` breakpoint, where the stage moves beside the text.
const SIDE_BY_SIDE_QUERY = "(min-width: 768px)";
// Below `md` the stage is pinned over the top ~half of the viewport, so text is
// read in the area under it; this is roughly that area's middle.
const STACKED_READING_LINE = 0.76;

/** Fraction of the viewport height where the reader's eye sits on the text column. */
export function readingLine(): number {
  if (typeof window.matchMedia !== "function") return 0.5;
  return window.matchMedia(SIDE_BY_SIDE_QUERY).matches ? 0.5 : STACKED_READING_LINE;
}

function measure(route: readonly StopId[]): number {
  const centers = route.map((id) => {
    const element = document.querySelector<HTMLElement>(`[data-stop="${id}"]`);
    if (!element) return Number.NaN;
    const rect = element.getBoundingClientRect();
    return rect.top + rect.height / 2;
  });
  return computeRoutePosition(centers, window.innerHeight * readingLine());
}

/** Current scroll position along `route`, in index units, read from `[data-stop]` elements. */
export function useScrollProgress(route: readonly StopId[], enabled = true): number {
  const [position, setPosition] = useState(0);
  const routeKey = route.join(",");

  useEffect(() => {
    // No canvas to drive: skip listeners, rAF and layout reads entirely.
    if (!enabled) return;
    const stops = routeKey.split(",") as StopId[];
    let frame = 0;
    const schedule = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setPosition(measure(stops));
      });
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [routeKey, enabled]);

  return position;
}
