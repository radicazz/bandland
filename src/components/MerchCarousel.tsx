"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ContentImage } from "@/components/ContentImage";
import type { MerchItem } from "@/content/schema";
import type { Translations } from "@/i18n/translations";

const cycleMs = 5000;

type MerchCarouselProps = {
  items: MerchItem[];
  labels: Translations["home"];
};

export function MerchCarousel({ items, labels }: MerchCarouselProps) {
  const itemsWithImages = useMemo(() => items.filter((item) => Boolean(item.imageUrl)), [items]);
  const featuredItems = items.length > 0 ? items : [];
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

  const normalizedActiveIndex =
    itemsWithImages.length > 0 ? activeIndex % itemsWithImages.length : 0;
  const activeItem = itemsWithImages[normalizedActiveIndex];
  const featuredItem = activeItem ?? featuredItems[0];
  return (
    <Link
      href="/merch"
      className="card-interactive relative block rounded-3xl border border-border/70 bg-surface/50 p-4 sm:p-7"
      aria-label={labels.storeCta}
    >
      <article className="min-w-0">
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-bg/50">
          {activeItem?.imageUrl ? (
            <ContentImage
              src={activeItem.imageUrl}
              alt=""
              className="h-36 w-full object-cover sm:h-40"
              fallbackClassName="flex h-36 w-full items-center justify-center bg-surface/50 sm:h-40"
              fallbackLabel={labels.storeLabel}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-28 items-center justify-center bg-surface/50 text-xs uppercase tracking-[0.3em] text-text-dim sm:h-32">
              {labels.storeLabel}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/30 to-transparent" />
        </div>
        {itemsWithImages.length > 1 ? (
          <div className="mt-3 flex items-center gap-2" aria-hidden="true">
            {itemsWithImages.map((item, index) => (
              <span
                key={item.id}
                className={`h-1.5 rounded-full transition-all ${
                  index === normalizedActiveIndex
                    ? "w-6 bg-highlight/80"
                    : "w-2 bg-border/80"
                }`}
              />
            ))}
          </div>
        ) : null}
        <p className="mt-4 text-xs uppercase tracking-[0.4em] text-text-dim">{labels.storeLabel}</p>
        <h2 className="mt-4 break-words text-2xl font-brand uppercase tracking-[0.12em] text-highlight sm:tracking-[0.16em]">
          {featuredItem?.name ?? labels.storeTitle}
        </h2>
        {featuredItem?.price ? (
          <p className="mt-3 break-words text-sm tabular-nums text-text">{featuredItem.price}</p>
        ) : null}
        <p className="mt-3 break-words text-sm leading-6 text-text-muted">
          {featuredItem?.description ?? labels.storeDescription}
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-text-dim">{labels.storeCta}</p>
      </article>
    </Link>
  );
}
