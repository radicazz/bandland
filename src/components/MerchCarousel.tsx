"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { MerchItem } from "@/content/schema";
import type { Translations } from "@/i18n/translations";

const cycleMs = 5000;

type MerchCarouselProps = {
  items: MerchItem[];
  labels: Translations["home"];
};

export function MerchCarousel({ items, labels }: MerchCarouselProps) {
  const itemsWithImages = useMemo(
    () => items.filter((item) => Boolean(item.imageUrl)),
    [items],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setReduceMotion(event.matches);
    };
    update(mediaQuery);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
    } else {
      mediaQuery.addListener(update);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", update);
      } else {
        mediaQuery.removeListener(update);
      }
    };
  }, []);

  useEffect(() => {
    if (itemsWithImages.length < 2 || reduceMotion) {
      return;
    }
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % itemsWithImages.length);
    }, cycleMs);
    return () => window.clearInterval(interval);
  }, [itemsWithImages.length, reduceMotion]);

  useEffect(() => {
    if (activeIndex >= itemsWithImages.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, itemsWithImages.length]);

  const activeItem = itemsWithImages[activeIndex];
  const showImages = itemsWithImages.length > 0;

  return (
    <Link
      href="/merch"
      className="card-interactive relative block overflow-hidden rounded-3xl border border-border/70 bg-surface/50 p-4 sm:p-7"
      aria-label={labels.storeCta}
    >
      {showImages ? (
        <div aria-hidden className="absolute inset-0">
          {itemsWithImages.map((item, index) => (
            <img
              key={item.id}
              src={item.imageUrl ?? ""}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                index === activeIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-bg/70" />
          <div className="absolute inset-0 hero-grain" />
        </div>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-bg/40" />
      )}

      <article className="relative">
        <p className="text-xs uppercase tracking-[0.4em] text-text-dim">
          {labels.storeLabel}
        </p>
        <h2 className="mt-4 text-2xl font-brand uppercase tracking-[0.16em] text-highlight">
          {activeItem?.name ?? labels.storeTitle}
        </h2>
        {activeItem?.price ? (
          <p className="mt-3 text-sm tabular-nums text-text">{activeItem.price}</p>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-text-muted">
          {activeItem?.description ?? labels.storeDescription}
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-text-dim">
          {labels.storeCta}
        </p>
      </article>
    </Link>
  );
}
