"use client";

import { useState } from "react";
import { usePlayback } from "@/components/guitar/PlaybackProvider";

function focusPlayer(frame: HTMLIFrameElement | null) {
  frame?.focus();
}

export function ReleasePlayer({
  src,
  title,
  loadLabel,
}: {
  src: string;
  title: string;
  loadLabel: string;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const playback = usePlayback();
  return (
    <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface p-2">
      {loadedSrc === src ? (
        <iframe
          ref={focusPlayer}
          title={title}
          src={src}
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="block w-full rounded-control"
        />
      ) : (
        <div className="flex min-h-[152px] items-center justify-center">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (playback.playing) playback.toggle();
              setLoadedSrc(src);
            }}
          >
            {loadLabel}
          </button>
        </div>
      )}
    </div>
  );
}
