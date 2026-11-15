"use client";

import { useEffect, useState } from "react";

import { GuitarStage } from "@/components/guitar/GuitarStage";
import type { StopId } from "@/components/guitar/journey";

/**
 * Lights the fret of whichever show row (`[data-fret]`) crosses the middle of
 * the viewport. Out-of-range indices are clamped by the guitar itself.
 */
export function JourneyStage({
  route,
  initialFret,
}: {
  route: readonly StopId[];
  initialFret: number;
}) {
  const [litFret, setLitFret] = useState(initialFret);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const rows = document.querySelectorAll<HTMLElement>("[data-fret]");
    if (rows.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const fret = Number((entry.target as HTMLElement).dataset.fret);
          if (Number.isFinite(fret)) setLitFret(fret);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  return <GuitarStage route={route} litFret={litFret} />;
}
