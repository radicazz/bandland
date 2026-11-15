"use client";

import { useEffect, useState } from "react";

import { GuitarStage } from "@/components/guitar/GuitarStage";
import type { StopId } from "@/components/guitar/journey";
import { readingLine } from "@/components/guitar/useScrollProgress";

/**
 * Lights the fret of the show row (`[data-fret]` inside `#rowsId`) crossing the
 * reading line (viewport middle; on mobile, the middle of the area below the
 * stage); no fret is lit while no row is there. Out-of-range indices are
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
  const [litFret, setLitFret] = useState(-1);

  useEffect(() => {
    if (rowCount === 0 || typeof IntersectionObserver === "undefined") return;
    const container = document.getElementById(rowsId);
    if (!container) return;
    const rows = container.querySelectorAll<HTMLElement>("[data-fret]");
    const visible = new Set<number>();
    // A 10%-tall band around the reading line.
    const line = readingLine() * 100;
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

  return <GuitarStage route={route} litFret={litFret} />;
}
