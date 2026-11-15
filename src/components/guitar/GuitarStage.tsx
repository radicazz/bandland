"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { StopId } from "./journey";
import { usePlayback } from "./PlaybackProvider";
import { useScrollProgress } from "./useScrollProgress";

// The three.js scene is its own chunk, loaded only on the client after first paint.
const GuitarCanvas = dynamic(() => import("./Guitar").then((mod) => mod.GuitarCanvas), {
  ssr: false,
  loading: () => null,
});

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const getDocumentVisible = () => !document.hidden;

// Probed once per page load; creating WebGL contexts repeatedly is expensive and capped.
let webglSupport: boolean | undefined;
function getWebGLSupport(): boolean {
  if (webglSupport === undefined) {
    try {
      const probe = document.createElement("canvas");
      webglSupport = Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const noopSubscribe = () => () => {};
const serverTrue = () => true;
const serverFalse = () => false;

export function GuitarStage({ route, litFret }: { route: readonly StopId[]; litFret: number }) {
  const signal = usePlayback();
  // Server snapshots pick the poster-only path so hydration always matches.
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, serverTrue);
  const webgl = useSyncExternalStore(noopSubscribe, getWebGLSupport, serverFalse);
  const documentVisible = useSyncExternalStore(subscribeVisibility, getDocumentVisible, serverTrue);
  const [onScreen, setOnScreen] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const position = useScrollProgress(route);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setOnScreen(entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleContextLost = useCallback(() => setContextLost(true), []);

  const showCanvas = webgl && !reducedMotion && !contextLost;

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden bg-bg"
    >
      <Image
        src="/guitar-poster.jpg"
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        loading="eager"
        fetchPriority="high"
        className="object-contain"
      />
      {showCanvas ? (
        <div className="absolute inset-0">
          <GuitarCanvas
            signal={signal}
            route={route}
            position={position}
            litFret={litFret}
            active={documentVisible && onScreen}
            onContextLost={handleContextLost}
          />
        </div>
      ) : null}
    </div>
  );
}
