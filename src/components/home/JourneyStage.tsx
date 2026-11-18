"use client";

import { useEffect, useState } from "react";

import { GuitarStage } from "@/components/guitar/GuitarStage";
import { sampleLight, type StopId } from "@/components/guitar/journey";
import { READING_LINE, useScrollProgress } from "@/components/guitar/useScrollProgress";

/**
 * Lights the fret of the show row (`[data-fret]` inside `#rowsId`) crossing the
 * reading line (viewport middle); no fret is lit while no row is there. Out-of-range indices are
 * clamped by the guitar itself. Re-observes when the row count changes.
 */
export function JourneyStage({
  route,
  rowsId,
  rowCount,
}: {
  route: readonly StopId[];
  rowsId: string;
  rowCount: number;
}) {
  const position = useScrollProgress(route);
  const [litFret, setLitFret] = useState(-1);

  useEffect(() => {
    if (rowCount === 0 || typeof IntersectionObserver === "undefined") return;
    const container = document.getElementById(rowsId);
    if (!container) return;
    const rows = container.querySelectorAll<HTMLElement>("[data-fret]");
    const visible = new Set<number>();
    // A 10%-tall band around the reading line.
    const line = READING_LINE * 100;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const fret = Number((entry.target as HTMLElement).dataset.fret);
          if (!Number.isFinite(fret)) continue;
          if (entry.isIntersecting) visible.add(fret);
          else visible.delete(fret);
        }
        setLitFret(visible.size > 0 ? Math.min(...visible) : -1);
      },
      { rootMargin: `-${line - 5}% 0px -${100 - line - 5}% 0px` },
    );
    rows.forEach((row) => observer.observe(row));
    return () => {
      observer.disconnect();
      // Rows changed or went away: nothing is in view until the new observer reports.
      setLitFret(-1);
    };
  }, [rowsId, rowCount]);

  return (
    <>
      {/* The light and haze ride the same per-frame scroll position as the camera. */}
      <GuitarStage
        route={route}
        position={position}
        litFret={litFret}
        light={sampleLight(route, position)}
        hazeShift={position}
      />
      {/*
        Readability over the full-screen stage. Phones: the guitar sits right
        under the text, so it dims as the reader leaves the hero. md+: the text
        column is on the left, so only that side darkens.
      */}
      <div
        className="pointer-events-none absolute inset-0 bg-bg md:hidden"
        style={{ opacity: 0.3 + 0.45 * Math.min(Math.max(position, 0), 1) }}
      />
      <div className="journey-scrim pointer-events-none absolute inset-0" />
    </>
  );
}
