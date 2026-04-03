"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type HeroSlideshowProps = {
  slides: string[];
  intervalSeconds?: number;
};

export function HeroSlideshow({
  slides,
  intervalSeconds = 6,
}: HeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const hasSlides = slides.length > 0;
  const shouldRotate = slides.length > 1 && !reduceMotion;
  const visibleIndex = hasSlides && shouldRotate ? activeIndex % slides.length : 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = (event: MediaQueryList | MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };

    updateMotionPreference(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateMotionPreference);
    } else {
      mediaQuery.addListener(updateMotionPreference);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateMotionPreference);
      } else {
        mediaQuery.removeListener(updateMotionPreference);
      }
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
      <div className="absolute inset-0 bg-bg/50" />
      <div className="absolute inset-0 bg-highlight/20 mix-blend-screen" />
      <div className="absolute inset-0 hero-vignette" />
      <div className="absolute inset-0 hero-grain" />
    </div>
  );
}
