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
    let observer: IntersectionObserver | undefined;
    const observeRows = () => {
      observer?.disconnect();
      const visible = new Set<number>();
      const height = document.documentElement.clientHeight || window.innerHeight;
      const above = Math.round(height * (READING_LINE - 0.05));
      const below = Math.round(height * (1 - READING_LINE - 0.05));
      observer = new IntersectionObserver(
        (entries, current) => {
          if (observer !== current) return;
          for (const entry of entries) {
            const fret = Number((entry.target as HTMLElement).dataset.fret);
            if (!Number.isFinite(fret)) continue;
            if (entry.isIntersecting) visible.add(fret);
            else visible.delete(fret);
          }
          setLitFret(visible.size > 0 ? Math.min(...visible) : -1);
        },
        { rootMargin: `-${above}px 0px -${below}px 0px` },
      );
      rows.forEach((row) => observer?.observe(row));
    };
    observeRows();
    window.addEventListener("resize", observeRows);
    return () => {
      window.removeEventListener("resize", observeRows);
      observer?.disconnect();
      observer = undefined;
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
