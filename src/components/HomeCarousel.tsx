"use client";

import { useEffect, useMemo, useState } from "react";

const slideIntervalMs = 20000;

type Card = {
  title: string;
  description: string;
  href?: string;
  cta?: string;
};

const cards: Card[] = [
  {
    title: "Latest release",
    description: "Listen to the newest drop.",
    href: "https://tr.ee/7KaRvTpbLN",
    cta: "Listen",
  },
  {
    title: "Merch",
    description: "Under construction.",
  },
  {
    title: "Shows",
    description: "Under construction.",
  },
];

const tabs = ["Latest", "Merch", "Shows"] as const;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function HomeCarousel() {
  const [index, setIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const total = cards.length;
  const shouldAnimate = !prefersReducedMotion && !hasInteracted;

  useEffect(() => {
    if (prefersReducedMotion || hasInteracted) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, slideIntervalMs);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, hasInteracted, total]);

  const current = useMemo(() => cards[index], [index]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 px-4 sm:px-6">
      <div className="flex min-h-[85svh] w-full items-center justify-center py-12 sm:min-h-[70svh] md:min-h-[75svh]">
        <div className="relative flex w-full max-w-[95vw] items-center justify-center overflow-x-hidden overflow-y-visible sm:max-w-4xl">
          <div
            className={`flex ${
              shouldAnimate
                ? "transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                : "transition-none"
            }`}
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {cards.map((card) => (
              <div key={card.title} className="w-full flex-shrink-0 px-2">
                <article className="min-h-[70svh] rounded-3xl border border-border/70 bg-surface/60 p-6 text-left sm:min-h-0 sm:p-8 lg:p-10">
                  <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Feature</p>
                  <h2 className="mt-4 break-words text-3xl font-brand uppercase tracking-[0.16em] text-highlight sm:text-4xl lg:text-5xl">
                    {card.title}
                  </h2>
                  <p className="mt-4 break-words text-base leading-7 text-text-muted">
                    {card.description}
                  </p>
                  {card.href ? (
                    <a
                      className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-highlight/60 bg-highlight/10 px-6 text-xs font-semibold uppercase tracking-[0.3em] text-highlight transition-colors hover:bg-highlight/20"
                      href={card.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {card.cta ?? "Open"}
                    </a>
                  ) : null}
                </article>
              </div>
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            {current.title}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {tabs.map((tab, tabIndex) => {
          const isActive = tabIndex === index;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setIndex(tabIndex);
                setHasInteracted(true);
              }}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition-colors ${
                isActive
                  ? "border-highlight/70 bg-highlight/20 text-highlight"
                  : "border-border/70 bg-surface/40 text-text-dim hover:border-highlight/50 hover:text-highlight"
              }`}
              aria-current={isActive ? "true" : undefined}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
