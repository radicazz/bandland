import Link from "next/link";

import type { Show } from "@/content/schema";
import type { Locale, Translations } from "@/i18n/translations";
import { formatShowDatePretty } from "@/lib/formatters";

type UpcomingShowProps = {
  shows: Show[];
  labels: Translations["home"];
  locale: Locale;
};

function getUpcomingShow(shows: Show[]) {
  const now = Date.now();
  return shows
    .map((show) => ({ show, time: Date.parse(show.date) }))
    .filter((entry) => !Number.isNaN(entry.time) && entry.time >= now)
    .sort((a, b) => a.time - b.time)[0]?.show;
}

export function UpcomingShow({ shows, labels, locale }: UpcomingShowProps) {
  const upcoming = getUpcomingShow(shows);

  return (
    <Link
      href="/shows"
      className="card-interactive relative block overflow-hidden rounded-3xl border border-border/70 bg-surface/50 p-4 sm:p-7"
      aria-label={labels.liveCta}
    >
      <div aria-hidden className="absolute inset-0">
        {upcoming?.imageUrl ? (
          <img
            src={upcoming.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-bg/70" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <article className="relative">
        <p className="text-xs uppercase tracking-[0.4em] text-text-dim">
          {labels.liveLabel}
        </p>
        <h2 className="mt-4 text-2xl font-brand uppercase tracking-[0.16em] text-highlight">
          {upcoming?.venue ?? labels.liveTitle}
        </h2>
        {upcoming ? (
          <div className="mt-3 text-sm text-text-muted">
            <p>{upcoming.city}</p>
            <p className="mt-2 tabular-nums text-text">
              {formatShowDatePretty(upcoming.date, locale)}
            </p>
            {upcoming.price ? (
              <p className="mt-2 tabular-nums text-text">{upcoming.price}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-text-muted">
            {labels.liveDescription}
          </p>
        )}
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-text-dim">
          {labels.liveCta}
        </p>
      </article>
    </Link>
  );
}
