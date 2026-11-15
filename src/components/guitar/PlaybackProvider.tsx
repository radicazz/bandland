"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createSimulatedPlayback, type PlaybackSignal } from "./playback";

type PlaybackHost = PlaybackSignal & {
  /** Starts a fresh driver; the returned cleanup disposes it. StrictMode-safe. */
  attach(): () => void;
};

/**
 * A stable facade so consumers keep one object across StrictMode remounts while
 * the underlying driver (and its timers) lives only between attach and detach.
 */
function createPlaybackHost(): PlaybackHost {
  const listeners = new Set<() => void>();
  let driver: PlaybackSignal | null = null;

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get playing() {
      return driver?.playing ?? false;
    },
    get level() {
      return driver?.level ?? 0;
    },
    pluck(stringIndex: number) {
      driver?.pluck(stringIndex);
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    toggle() {
      driver?.toggle();
    },
    dispose() {
      driver?.dispose();
      driver = null;
    },
    attach() {
      const current = createSimulatedPlayback();
      driver = current;
      const unsubscribe = current.subscribe(notify);
      return () => {
        unsubscribe();
        current.dispose();
        if (driver === current) driver = null;
      };
    },
  };
}

const PlaybackContext = createContext<PlaybackSignal | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const [host] = useState(createPlaybackHost);

  useEffect(() => {
    const detach = host.attach();
    const onVisibility = () => {
      if (document.hidden && host.playing) host.toggle();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      detach();
    };
  }, [host]);

  return <PlaybackContext.Provider value={host}>{children}</PlaybackContext.Provider>;
}

export function usePlayback(): PlaybackSignal {
  const signal = useContext(PlaybackContext);
  if (!signal) throw new Error("usePlayback must be used inside <PlaybackProvider>");
  return signal;
}
