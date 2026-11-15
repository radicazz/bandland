"use client";

import { useSyncExternalStore } from "react";
import type { Translations } from "@/i18n/translations";
import { usePlayback } from "./PlaybackProvider";

type PlayButtonProps = {
  labels: Pick<Translations["home"]["journey"], "play" | "pause">;
};

export function PlayButton({ labels }: PlayButtonProps) {
  const signal = usePlayback();
  const playing = useSyncExternalStore(
    signal.subscribe,
    () => signal.playing,
    () => false,
  );

  return (
    <button
      type="button"
      aria-pressed={playing}
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
  );
}
