"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { site } from "@/config/site";
import type { Translations } from "@/i18n/translations";
import { usePlayback } from "./PlaybackProvider";
import type { PlaybackStatus } from "./playback";

type PlayButtonProps = {
  labels: Pick<
    Translations["home"]["journey"],
    "play" | "pause" | "trackIdle" | "trackLoading" | "trackPlaying" | "trackError"
  >;
  track?: string;
  /** "zine": round red button (label visually hidden) with `children` beside it. */
  variant?: "default" | "zine";
  children?: ReactNode;
};

const STATUS_LINE = {
  paused: "trackIdle",
  loading: "trackLoading",
  playing: "trackPlaying",
  error: "trackError",
} as const satisfies Record<PlaybackStatus, keyof PlayButtonProps["labels"]>;

export function PlayButton({
  labels,
  track = site.featuredTrack.title,
  variant = "default",
  children,
}: PlayButtonProps) {
  const signal = usePlayback();
  const playing = useSyncExternalStore(
    signal.subscribe,
    () => signal.playing,
    () => false,
  );
  const status = useSyncExternalStore(
    signal.subscribe,
    () => signal.status,
    () => "paused" as const,
  );

  const zine = variant === "zine";
  const icon = (
    <svg aria-hidden viewBox="0 0 16 16" className={`fill-current ${zine ? "size-7" : "size-4"}`}>
      {playing ? (
        <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />
      ) : (
        <path d="M4.5 2.3v11.4a.5.5 0 0 0 .76.43l9.1-5.7a.5.5 0 0 0 0-.86l-9.1-5.7a.5.5 0 0 0-.76.43z" />
      )}
    </svg>
  );
  const label = playing ? labels.pause : labels.play;
  const button = (
    <button
      id="featured-track-play"
      type="button"
      aria-pressed={playing}
      aria-busy={status === "loading"}
      onClick={() => signal.toggle()}
      className={
        zine
          ? "inline-flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-red bg-red text-paper transition-colors hover:border-red-deep hover:bg-red-deep motion-reduce:transition-none sm:size-20 [&>svg]:translate-x-px"
          : "btn-primary btn-primary-lg"
      }
    >
      {icon}
      {zine ? <span className="sr-only">{label}</span> : label}
    </button>
  );

  return (
    <div className={`flex flex-col items-start gap-3 ${zine ? "w-full" : ""}`}>
      {zine ? (
        <div className="flex w-full items-center gap-4 sm:gap-5">
          {button}
          {children}
        </div>
      ) : (
        button
      )}
      <p
        aria-live="polite"
        className={`text-base ${status === "error" ? "text-highlight" : "text-text-muted"}`}
      >
        {labels[STATUS_LINE[status]].replace("{track}", track)}
      </p>
    </div>
  );
}
