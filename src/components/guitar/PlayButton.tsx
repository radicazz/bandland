"use client";

import { useSyncExternalStore } from "react";
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
};

const STATUS_LINE = {
  paused: "trackIdle",
  loading: "trackLoading",
  playing: "trackPlaying",
  error: "trackError",
} as const satisfies Record<PlaybackStatus, keyof PlayButtonProps["labels"]>;

export function PlayButton({ labels, track = site.featuredTrack.title }: PlayButtonProps) {
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

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        id="featured-track-play"
        type="button"
        aria-pressed={playing}
        aria-busy={status === "loading"}
        onClick={() => signal.toggle()}
        className="btn-primary btn-primary-lg"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
          {playing ? (
            <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />
          ) : (
            <path d="M4.5 2.3v11.4a.5.5 0 0 0 .76.43l9.1-5.7a.5.5 0 0 0 0-.86l-9.1-5.7a.5.5 0 0 0-.76.43z" />
          )}
        </svg>
        {playing ? labels.pause : labels.play}
      </button>
      <p
        aria-live="polite"
        className={`text-base ${status === "error" ? "text-highlight" : "text-text-muted"}`}
      >
        {labels[STATUS_LINE[status]].replace("{track}", track)}
      </p>
    </div>
  );
}
