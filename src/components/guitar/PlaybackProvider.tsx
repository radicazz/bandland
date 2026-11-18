"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { site } from "@/config/site";
import {
  createAudioPlayback,
  readStoredVolume,
  type PlaybackSignal,
  type PlaybackStatus,
} from "./playback";

type PlaybackHost = PlaybackSignal & {
  /** Starts a fresh driver; the returned cleanup disposes it. StrictMode-safe. */
  attach(): () => void;
};

type DriverFactory = () => PlaybackSignal;

const playFeaturedTrack: DriverFactory = () => createAudioPlayback({ src: site.featuredTrack.src });

/**
 * A stable facade so consumers keep one object across StrictMode remounts while
 * the underlying driver (its audio element and timers) lives only between
 * attach and detach.
 */
function createPlaybackHost(createDriver: DriverFactory): PlaybackHost {
  const listeners = new Set<() => void>();
  let driver: PlaybackSignal | null = null;

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };

  return {
    get playing() {
      return driver?.playing ?? false;
    },
    get status(): PlaybackStatus {
      return driver?.status ?? "paused";
    },
    get level() {
      return driver?.level ?? 0;
    },
    get volume() {
      return driver?.volume ?? readStoredVolume().volume;
    },
    get muted() {
      return driver?.muted ?? readStoredVolume().muted;
    },
    get currentTime() {
      return driver?.currentTime ?? 0;
    },
    get duration() {
      return driver?.duration ?? Number.NaN;
    },
    get started() {
      return driver?.started ?? false;
    },
    pluck(stringIndex: number) {
      driver?.pluck(stringIndex);
    },
    setVolume(value: number) {
      driver?.setVolume(value);
    },
    toggleMute() {
      driver?.toggleMute();
    },
    seek(seconds: number) {
      driver?.seek(seconds);
    },
    readWaveform(target: Uint8Array) {
      return driver?.readWaveform(target) ?? false;
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
      const current = createDriver();
      driver = current;
      const unsubscribe = current.subscribe(notify);
      notify(); // consumers rendered before attach read the new driver's state
      return () => {
        unsubscribe();
        current.dispose();
        if (driver === current) driver = null;
        notify();
      };
    },
  };
}

const PlaybackContext = createContext<PlaybackSignal | null>(null);

/**
 * Owns the home page's playback. The track keeps playing in a background tab
 * (the canvas stops drawing on its own) and stops when the reader leaves `/`.
 */
export function PlaybackProvider({
  children,
  createDriver = playFeaturedTrack,
}: {
  children: React.ReactNode;
  createDriver?: DriverFactory;
}) {
  const [host] = useState(() => createPlaybackHost(createDriver));

  useEffect(() => host.attach(), [host]);

  return <PlaybackContext.Provider value={host}>{children}</PlaybackContext.Provider>;
}

export function usePlayback(): PlaybackSignal {
  const signal = useContext(PlaybackContext);
  if (!signal) throw new Error("usePlayback must be used inside <PlaybackProvider>");
  return signal;
}
