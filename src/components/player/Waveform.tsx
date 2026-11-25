"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { PlaybackSignal } from "@/components/player/playback";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SAMPLES = 1024;
const LINE_POINTS = 128;
// Mastered tracks rarely swing past a third of full scale; lift the line to fill the canvas.
const LINE_GAIN = 2.5;
const BARS = 32;
const MAX_DPR = 2;

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const serverTrue = () => true;

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** A fixed, gently tapered bar pattern: the track's shape when nothing is live. */
function drawSilhouette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gap = 2;
  const barWidth = Math.max(1, (width - gap * (BARS - 1)) / BARS);
  for (let i = 0; i < BARS; i += 1) {
    const taper = Math.sin(((i + 0.5) / BARS) * Math.PI);
    const texture = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45 + 1));
    const barHeight = Math.max(2, height * 0.85 * taper * texture);
    const x = i * (barWidth + gap);
    ctx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
  }
}

/** Oscilloscope line, windowed so both ends rest on the centre line. */
function drawLine(ctx: CanvasRenderingContext2D, data: Uint8Array, width: number, height: number) {
  const mid = height / 2;
  const step = Math.floor(data.length / LINE_POINTS);
  ctx.beginPath();
  for (let i = 0; i <= LINE_POINTS; i += 1) {
    const sample = data[Math.min(i * step, data.length - 1)] ?? 128;
    const envelope = Math.sin((i / LINE_POINTS) * Math.PI);
    const x = (i / LINE_POINTS) * width;
    const swing = Math.max(-1, Math.min(1, ((sample - 128) / 128) * LINE_GAIN));
    const y = mid + swing * (mid - 1) * envelope;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/**
 * The player's live waveform. While active (and motion is allowed) it draws the
 * analyser's time-domain line every frame in the accent; otherwise, or without
 * an analyser, it draws a static bar silhouette once.
 */
export function Waveform({ signal, active }: { signal: PlaybackSignal; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, serverTrue);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const data = new Uint8Array(SAMPLES);
    const lineColor = token("--highlight");
    const barColor = token(active ? "--text-muted" : "--text-dim");
    const live = active && !reducedMotion;
    let width = 0;
    let height = 0;
    let frame = 0;
    let looping = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = barColor;
      drawSilhouette(ctx, width, height);
    };

    const tick = () => {
      if (!signal.readWaveform(data)) {
        // No analyser (yet): settle on the silhouette until the signal changes.
        looping = false;
        drawStatic();
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      drawLine(ctx, data, width, height);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (looping) return;
      looping = true;
      tick();
    };

    resize();
    if (live) start();
    else drawStatic();

    // The analyser attaches once the track loads; retry on the next signal change.
    const unsubscribe = live ? signal.subscribe(start) : () => {};
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            resize();
            if (!looping) drawStatic();
          });
    observer?.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
      observer?.disconnect();
    };
  }, [signal, active, reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className="block h-8 w-full" />;
}
