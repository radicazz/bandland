"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Container } from "@/components/Container";
import { usePlayback } from "@/components/guitar/PlaybackProvider";
import { site } from "@/config/site";
import type { Translations } from "@/i18n/translations";
import { formatTime } from "./formatTime";
import { Waveform } from "./Waveform";

const ICON_BUTTON =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text";

const SEEK_KEY_SECONDS = 5;
const SEEK_KEYS: Partial<Record<string, 1 | -1>> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
};

function percent(value: number, max: number): string {
  if (!(max > 0)) return "0%";
  return `${Math.min(100, Math.max(0, (value / max) * 100))}%`;
}

/**
 * The site-wide player: a fixed bar along the bottom once Play has been pressed
 * anywhere. Volume and mute come from storage on the client, so nothing renders
 * until playback has started (SSR and the first client render stay identical).
 */
export function PlayerBar({ labels }: { labels: Translations["player"] }) {
  const pathname = usePathname();
  const signal = usePlayback();
  const subscribe = signal.subscribe;
  const started = useSyncExternalStore(
    subscribe,
    () => signal.started,
    () => false,
  );
  const playing = useSyncExternalStore(
    subscribe,
    () => signal.playing,
    () => false,
  );
  const muted = useSyncExternalStore(
    subscribe,
    () => signal.muted,
    () => false,
  );
  const volume = useSyncExternalStore(
    subscribe,
    () => signal.volume,
    () => 0,
  );
  const currentTime = useSyncExternalStore(
    subscribe,
    () => signal.currentTime,
    () => 0,
  );
  // Unknown (NaN) or streaming (Infinity) durations read as 0, which also keeps
  // the snapshot comparable (React compares server snapshots with !==).
  const total = useSyncExternalStore(
    subscribe,
    () => (Number.isFinite(signal.duration) ? signal.duration : 0),
    () => 0,
  );

  // Closing hides the bar until the track is played again.
  const [dismissed, setDismissed] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(playing);
  if (playing !== wasPlaying) {
    setWasPlaying(playing);
    if (playing) setDismissed(false);
  }

  const visible = started && !dismissed && !pathname?.startsWith("/admin");
  const barRef = useRef<HTMLDivElement>(null);

  // The bar is hidden on /admin, so playback must not carry on there unseen.
  const onAdmin = Boolean(pathname?.startsWith("/admin"));
  useEffect(() => {
    if (onAdmin && signal.playing) signal.toggle();
  }, [onAdmin, signal]);

  // Reserve the bar's height under the footer so it never covers the page end.
  useEffect(() => {
    const bar = barRef.current;
    if (!visible || !bar) return;
    const body = document.body;
    const apply = () => body.style.setProperty("--player-clear", `${bar.offsetHeight}px`);
    apply();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(apply);
    observer?.observe(bar);
    return () => {
      observer?.disconnect();
      body.style.removeProperty("--player-clear");
    };
  }, [visible]);

  if (!visible) return null;

  const known = total > 0;
  const position = labels.position
    .replace("{current}", formatTime(currentTime))
    .replace("{total}", formatTime(total));
  const shownVolume = muted ? 0 : Math.round(volume * 100);

  const close = () => {
    if (signal.playing) signal.toggle();
    setDismissed(true);
    (document.getElementById("featured-track-play") ?? document.getElementById("content"))?.focus();
  };

  return (
    <div
      ref={barRef}
      role="region"
      aria-label={labels.region}
      className="player-bar fixed inset-x-0 bottom-0 z-20 rounded-none border-t border-border"
    >
      <Container className="flex flex-wrap items-center gap-x-2 pb-2 pt-1 lg:flex-nowrap lg:gap-x-3 lg:py-2.5">
        <button
          type="button"
          aria-label={playing ? labels.pause : labels.play}
          onClick={() => signal.toggle()}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-text text-bg transition-colors hover:bg-text-muted"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-current">
            {playing ? (
              <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />
            ) : (
              <path d="M5 2.3v11.4a.5.5 0 0 0 .76.43l9.1-5.7a.5.5 0 0 0 0-.86l-9.1-5.7A.5.5 0 0 0 5 2.3z" />
            )}
          </svg>
        </button>

        <p className="min-w-0 flex-1 truncate pl-1 text-sm font-medium text-text lg:max-w-52 lg:flex-[0_1_13rem]">
          {site.featuredTrack.title}
        </p>

        <div className="hidden w-16 shrink-0 sm:block lg:w-28">
          <Waveform signal={signal} active={playing} />
        </div>

        {/* Phones: a thin full-width row above the controls. */}
        <div className="order-first flex w-full items-center lg:order-none lg:w-auto lg:min-w-32 lg:flex-1">
          <input
            type="range"
            min={0}
            max={total}
            step={0.1}
            value={Math.min(currentTime, total)}
            disabled={!known}
            aria-label={labels.seek}
            aria-valuetext={position}
            onChange={(event) => signal.seek(Number(event.currentTarget.value))}
            onKeyDown={(event) => {
              // The fine step suits dragging; arrow keys jump a useful distance.
              if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
              const direction = SEEK_KEYS[event.key];
              if (direction === undefined) return;
              event.preventDefault();
              signal.seek(currentTime + direction * SEEK_KEY_SECONDS);
            }}
            className="player-range w-full"
            style={{ "--fill": percent(currentTime, total) } as React.CSSProperties}
          />
        </div>

        <p
          aria-hidden="true"
          className="hidden shrink-0 text-xs tabular-nums text-text-dim sm:block"
        >
          {formatTime(currentTime)}
          <span className="px-1">/</span>
          {formatTime(total)}
        </p>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label={muted ? labels.unmute : labels.mute}
            aria-pressed={muted}
            onClick={() => signal.toggleMute()}
            className={ICON_BUTTON}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-5 fill-none stroke-current"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.5 7.5h2.75L10 4.5v11l-3.75-3H3.5z" className="fill-current" />
              {muted ? (
                <path d="m13 7.5 5 5m0-5-5 5" />
              ) : (
                <path d="M13 7.25a3.75 3.75 0 0 1 0 5.5M15.25 5a7 7 0 0 1 0 10" />
              )}
            </svg>
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={shownVolume}
            aria-label={labels.volume}
            onChange={(event) => signal.setVolume(Number(event.currentTarget.value) / 100)}
            className="player-range hidden w-24 sm:block"
            style={{ "--fill": `${shownVolume}%` } as React.CSSProperties}
          />
        </div>

        <button type="button" aria-label={labels.close} onClick={close} className={ICON_BUTTON}>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4 fill-none stroke-current"
            strokeWidth={1.5}
            strokeLinecap="round"
          >
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      </Container>
    </div>
  );
}
