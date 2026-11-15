"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
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
      const context = probe.getContext("webgl2") ?? probe.getContext("webgl");
      webglSupport = Boolean(context);
      // Release the probe context right away instead of waiting for GC.
      context?.getExtension?.("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

/**
 * Renderer errors rethrown by <Canvas> and failed chunk loads land here; the
 * stage then drops back to the poster for the rest of the page's life.
 */
class CanvasBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(): void {
    this.props.onError();
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
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
  const [canvasFailed, setCanvasFailed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Reduced motion pins the camera to the hero pose, so scroll tracking is idle too.
  const showCanvas = webgl && !contextLost && !canvasFailed;
  const position = useScrollProgress(route, showCanvas && !reducedMotion);

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
  const handleCanvasError = useCallback(() => setCanvasFailed(true), []);

  // Reduced motion keeps the canvas but pins it to the hero pose (see Guitar.tsx).
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
        <div className="absolute inset-0" data-motion={reducedMotion ? "reduced" : "full"}>
          <CanvasBoundary onError={handleCanvasError}>
            <GuitarCanvas
              signal={signal}
              route={route}
              position={position}
              litFret={litFret}
              active={documentVisible && onScreen}
              reducedMotion={reducedMotion}
              onContextLost={handleContextLost}
            />
          </CanvasBoundary>
        </div>
      ) : null}
    </div>
  );
}
