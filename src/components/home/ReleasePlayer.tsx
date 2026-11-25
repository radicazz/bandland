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
  const autoLoad = new URL(src).hostname === "open.spotify.com";
  return (
    <div className="mt-6 border-2 border-ink bg-ink p-1">
      {autoLoad || loadedSrc === src ? (
        <iframe
          ref={autoLoad ? undefined : focusPlayer}
          title={title}
          src={src}
          height="152"
          loading={autoLoad ? "lazy" : undefined}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="block w-full"
        />
      ) : (
        <div className="flex min-h-[152px] items-center justify-center">
          <button
            type="button"
            className="btn-zine"
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
