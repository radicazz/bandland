"use client";

import { useSyncExternalStore } from "react";
import { PlayButton } from "@/components/guitar/PlayButton";
import { usePlayback } from "@/components/guitar/PlaybackProvider";
import { Waveform } from "@/components/player/Waveform";
import type { Translations } from "@/i18n/translations";

/**
 * Hero play control: the round red Play button with the live waveform beside it,
 * then a thin rule running out like a tape leader. The waveform reads the same
 * signal as the site-wide player bar, so both stay in step.
 */
export function HeroPlayer({ labels }: { labels: Translations["home"]["journey"] }) {
  const signal = usePlayback();
  const playing = useSyncExternalStore(
    signal.subscribe,
    () => signal.playing,
    () => false,
  );

  return (
    <PlayButton labels={labels} variant="zine">
      <div aria-hidden="true" className="flex min-w-0 flex-1 items-center">
        <div className="w-40 shrink-0 sm:w-56">
          <Waveform signal={signal} active={playing} />
        </div>
        <span className="h-0.5 min-w-6 flex-1 bg-ink" />
      </div>
    </PlayButton>
  );
}
