"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setPrefetchInactive(true), 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const tabs = [
    {
      key: "spotify" as const,
      label: labels.playerSpotifyLabel,
      src: spotifyUrl,
      heightClass: "h-[152px]",
      allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
    },
    {
      key: "apple" as const,
      label: labels.playerAppleLabel,
      src: appleUrl,
      heightClass: "h-[175px] sm:h-[175px]",
      allow: "autoplay *; encrypted-media *; fullscreen *; clipboard-write",
      sandbox:
        "allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation",
    },
  ];

  const activeIndex = tabs.findIndex((tab) => tab.key === active);

  const focusTabAtIndex = (index: number) => {
    const target = tabs[index];
    if (!target) {
      return;
    }

    setActive(target.key);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusTabAtIndex((index + 1) % tabs.length);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusTabAtIndex((index - 1 + tabs.length) % tabs.length);
        break;
      case "Home":
        event.preventDefault();
        focusTabAtIndex(0);
        break;
      case "End":
        event.preventDefault();
        focusTabAtIndex(tabs.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label={labels.playerTabsLabel}
        className="flex w-full flex-wrap gap-2 rounded-2xl border border-border/70 bg-surface/60 p-1 sm:rounded-full"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const tabId = `${baseId}-${tab.key}-tab`;
          const panelId = `${baseId}-${tab.key}-panel`;
          const tabIndex = tabs.findIndex((item) => item.key === tab.key);

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              ref={(element) => {
                tabRefs.current[tabIndex] = element;
              }}
              id={tabId}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={activeIndex === tabIndex ? 0 : -1}
              onClick={() => setActive(tab.key)}
              onMouseEnter={() => setPrefetchInactive(true)}
              onFocus={() => setPrefetchInactive(true)}
              onKeyDown={(event) => handleKeyDown(event, tabIndex)}
              className={`min-h-11 min-w-0 flex-1 rounded-xl px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition-colors sm:rounded-full sm:px-4 sm:tracking-[0.35em] ${
                isActive
                  ? "bg-highlight/15 text-highlight"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <span className="block truncate sm:whitespace-nowrap">{tab.label}</span>
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
                  allow={tab.allow}
                  sandbox={tab.sandbox}
                  loading={isActive ? "eager" : "lazy"}
                  referrerPolicy="strict-origin-when-cross-origin"
                  className={`block w-full ${tab.heightClass}`}
                />
              ) : (
                <div className={`${tab.heightClass} w-full animate-pulse bg-surface/40`} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
