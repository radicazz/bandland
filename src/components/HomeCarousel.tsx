"use client";

import { useEffect, useMemo, useState } from "react";

const slideIntervalMs = 8000;

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
  const prefersReducedMotion = usePrefersReducedMotion();

  const total = cards.length;
  const nextIndex = () => setIndex((current) => (current + 1) % total);
  const prevIndex = () => setIndex((current) => (current - 1 + total) % total);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, slideIntervalMs);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, total]);

  const current = useMemo(() => cards[index], [index]);

  return (
    <div className="w-full">
      <div className="flex min-h-[280px] items-center justify-center gap-4 sm:min-h-[320px]">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-surface/50 text-text transition-colors hover:border-highlight/60 hover:text-highlight focus-visible:text-highlight"
          aria-label="Previous card"
          onClick={prevIndex}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="relative flex w-full max-w-2xl items-center justify-center overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {cards.map((card) => (
              <div key={card.title} className="w-full flex-shrink-0 px-2">
                <article className="rounded-3xl border border-border/70 bg-surface/60 p-8 text-left sm:p-10">
                  <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Feature</p>
                  <h2 className="mt-4 text-3xl font-brand uppercase tracking-[0.18em] text-highlight sm:text-4xl">
                    {card.title}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-text-muted">{card.description}</p>
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

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-surface/50 text-text transition-colors hover:border-highlight/60 hover:text-highlight focus-visible:text-highlight"
          aria-label="Next card"
          onClick={nextIndex}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
