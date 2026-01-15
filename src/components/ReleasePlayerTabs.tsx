"use client";

import { useEffect, useId, useState } from "react";

import type { Translations } from "@/i18n/translations";

type PlayerKey = "spotify" | "apple";

type ReleasePlayerTabsProps = {
  title: string;
  spotifyUrl: string;
  appleUrl: string;
  labels: Pick<
    Translations["home"],
    "playerTabsLabel" | "playerSpotifyLabel" | "playerAppleLabel"
  >;
};

export function ReleasePlayerTabs({
  title,
  spotifyUrl,
  appleUrl,
  labels,
}: ReleasePlayerTabsProps) {
  const [active, setActive] = useState<PlayerKey>("spotify");
  const [prefetchInactive, setPrefetchInactive] = useState(false);
  const baseId = useId();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setPrefetchInactive(true), 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const tabs = [
    {
      key: "spotify" as const,
      label: labels.playerSpotifyLabel,
      src: spotifyUrl,
      height: 152,
      allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
    },
    {
      key: "apple" as const,
      label: labels.playerAppleLabel,
      src: appleUrl,
      height: 150,
      allow: "autoplay *; encrypted-media *; fullscreen *; clipboard-write",
      sandbox:
        "allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation",
    },
  ];

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label={labels.playerTabsLabel}
        className="flex w-full flex-wrap gap-2 rounded-full border border-border/70 bg-surface/60 p-1"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const tabId = `${baseId}-${tab.key}-tab`;
          const panelId = `${baseId}-${tab.key}-panel`;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={isActive}
              aria-controls={panelId}
              onClick={() => setActive(tab.key)}
              onMouseEnter={() => setPrefetchInactive(true)}
              onFocus={() => setPrefetchInactive(true)}
              className={`flex-1 rounded-full px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] transition-colors ${
                isActive
                  ? "bg-highlight/15 text-highlight"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const tabId = `${baseId}-${tab.key}-tab`;
        const panelId = `${baseId}-${tab.key}-panel`;
        const shouldRenderIframe = isActive || prefetchInactive;

        return (
          <div
            key={tab.key}
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabId}
            hidden={!isActive}
            className="mt-4"
          >
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface/70">
              {shouldRenderIframe ? (
                <iframe
                  title={`${title} — ${tab.label} player`}
                  src={tab.src}
                  width="100%"
                  height={tab.height}
                  allow={tab.allow}
                  sandbox={tab.sandbox}
                  loading="eager"
                  className="block w-full"
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
