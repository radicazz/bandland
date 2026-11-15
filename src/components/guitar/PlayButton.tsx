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
      className="border-border bg-surface text-text hover:bg-surface-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors"
    >
      {playing ? labels.pause : labels.play}
    </button>
  );
}
