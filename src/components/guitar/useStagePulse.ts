"use client";

import { useEffect, type RefObject } from "react";
import type { PlaybackSignal } from "./playback";

/**
 * Writes `--pulse` (the playback envelope, 0..1) onto the stage element. A rAF
 * loop runs only while playing and motion is allowed; otherwise `--pulse` is 0
 * and nothing is scheduled.
 */
export function useStagePulse(
  ref: RefObject<HTMLElement | null>,
  signal: Pick<PlaybackSignal, "playing" | "level" | "subscribe">,
  reducedMotion: boolean,
): void {
  useEffect(() => {
    let frame = 0;
    const write = (value: string) => ref.current?.style.setProperty("--pulse", value);
    const tick = () => {
      write(signal.level.toFixed(3));
      frame = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      frame = 0;
      write("0");
    };
    const sync = () => {
      if (signal.playing && !reducedMotion) {
        if (frame === 0) frame = window.requestAnimationFrame(tick);
      } else {
        stop();
      }
    };
    sync();
    const unsubscribe = signal.subscribe(sync);
    return () => {
      unsubscribe();
      stop();
    };
  }, [ref, signal, reducedMotion]);
}
