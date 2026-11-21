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
  type CSSProperties,
  type ReactNode,
} from "react";
import { LIGHT_POSES, type LightPose, type StopId } from "./journey";
import { usePlayback } from "./PlaybackProvider";
import { useStagePulse } from "./useStagePulse";

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
      const context = probe.getContext("webgl2");
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

type StageVariables = CSSProperties & Record<`--${string}`, string>;

/** Light pool position (x relative to the guitar centre, `--stage-x`) and haze offset. */
function stageVariables(light: LightPose, hazeShift: number): StageVariables {
  return {
    "--light-x": `calc(var(--stage-x) + ${light.x}%)`,
    "--light-y": `${light.y}%`,
    "--light-size": `${light.size}%`,
    "--haze-shift": String(hazeShift),
  };
}

const noopSubscribe = () => () => {};
const serverTrue = () => true;
const serverFalse = () => false;

export function GuitarStage({
  route,
  position,
  litFret,
  light,
  hazeShift,
}: {
  route: readonly StopId[];
  /** Scroll position along `route` in index units (see useScrollProgress). */
  position: number;
  litFret: number;
  /** Light pool for the current scroll position (sampleLight in journey.ts). */
  light: LightPose;
  /** Scroll-driven haze offset; the haze never drifts on its own. */
  hazeShift: number;
}) {
  const signal = usePlayback();
  // Server snapshots pick the poster-only path so hydration always matches.
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, serverTrue);
  const webgl = useSyncExternalStore(
    noopSubscribe,
    reducedMotion ? serverFalse : getWebGLSupport,
    serverFalse,
  );
  const documentVisible = useSyncExternalStore(subscribeVisibility, getDocumentVisible, serverTrue);
  const [onScreen, setOnScreen] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  if (reducedMotion && canvasReady) setCanvasReady(false);
  const playing = useSyncExternalStore(
    signal.subscribe,
    () => signal.playing,
    () => false,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const showCanvas = hasInitialized && webgl && !reducedMotion && !contextLost && !canvasFailed;
  useStagePulse(wrapperRef, signal, reducedMotion || !documentVisible || !onScreen);

  useEffect(() => {
    if (hasInitialized || reducedMotion || !webgl || !onScreen || !documentVisible) return;
    const timer = window.setTimeout(() => setHasInitialized(true), 0);
    return () => window.clearTimeout(timer);
  }, [hasInitialized, reducedMotion, webgl, onScreen, documentVisible]);

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

  const handleContextLost = useCallback(() => {
    setCanvasReady(false);
    setContextLost(true);
  }, []);
  const handleCanvasError = useCallback(() => {
    setCanvasReady(false);
    setCanvasFailed(true);
  }, []);
  const handleCanvasReady = useCallback(() => setCanvasReady(true), []);
  // The canvas is transparent over the shared backdrop, so the poster steps aside
  // once the first frame is up instead of double-exposing through it.
  const posterHidden = showCanvas && canvasReady;

  // Reduced motion uses the static hero poster.
  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      data-playing={playing ? "" : undefined}
      className="guitar-stage relative h-full w-full overflow-hidden"
      // Reduced motion pins the camera to the hero pose, so the light stays with it.
      style={reducedMotion ? stageVariables(LIGHT_POSES.hero, 0) : stageVariables(light, hazeShift)}
    >
      <div className="guitar-stage-spot pointer-events-none absolute inset-0" />
      <div className="guitar-stage-haze pointer-events-none absolute inset-0" />
      <Image
        src="/guitar-poster.webp"
        alt=""
        fill
        sizes="min(100vw, 38lvh)"
        loading="eager"
        fetchPriority="high"
        // md+: same sideways shift as the canvas (STAGE_SHIFT in journey.ts).
        className={`object-contain transition-opacity duration-300 md:translate-x-[20%] ${posterHidden ? "opacity-0" : "opacity-100"}`}
      />
      {showCanvas ? (
        <div className="absolute inset-0" data-motion="full">
          <CanvasBoundary onError={handleCanvasError}>
            <GuitarCanvas
              signal={signal}
              route={route}
              position={position}
              litFret={litFret}
              active={documentVisible && onScreen}
              reducedMotion={reducedMotion}
              onContextLost={handleContextLost}
              onReady={handleCanvasReady}
            />
          </CanvasBoundary>
        </div>
      ) : null}
      <div className="guitar-stage-vignette pointer-events-none absolute inset-0" />
    </div>
  );
}
