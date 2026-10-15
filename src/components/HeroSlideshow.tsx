"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Translations } from "@/i18n/translations";

type HeroSlideshowProps = {
  slides: string[];
  intervalSeconds?: number;
  labels: Translations["home"]["slideshow"];
};

export function HeroSlideshow({ slides, intervalSeconds = 6, labels }: HeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const hasSlides = slides.length > 0;
  const shouldRotate = slides.length > 1 && !reduceMotion && !isPaused;
  const visibleIndex = hasSlides && !reduceMotion ? activeIndex % slides.length : 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = (event: MediaQueryList | MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };

    updateMotionPreference(mediaQuery);
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (!hasSlides || !shouldRotate) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, intervalSeconds * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasSlides, intervalSeconds, shouldRotate, slides.length]);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div aria-hidden className="absolute inset-0">
        {slides.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out motion-reduce:transition-none ${
              index === visibleIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-bg/60" />
        <div className="absolute inset-0 bg-highlight/10 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/20 via-transparent to-bg" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>
      {slides.length > 1 && !reduceMotion ? (
        <div className="absolute inset-x-0 top-20 z-10 mx-auto flex max-w-6xl justify-end px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setIsPaused((paused) => !paused)}
            className="pointer-events-auto min-h-11 border border-border bg-bg/90 px-3 text-xs text-text-muted transition-colors hover:border-highlight hover:text-highlight"
          >
            {isPaused ? labels.resume : labels.pause}
          </button>
        </div>
      ) : null}
    </div>
  );
}
