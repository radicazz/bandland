import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { getShows } from "@/content/shows";
import { getTranslationsFromCookies } from "@/i18n/server";
import { formatShowDatePretty } from "@/lib/formatters";

export async function generateMetadata(): Promise<Metadata> {
  const { labels } = await getTranslationsFromCookies();
  return {
    title: labels.shows.title,
  };
}

export default async function ShowsPage() {
  const { labels, locale } = await getTranslationsFromCookies();
  const shows = await getShows();
  const sortedShows = [...shows].sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return 0;
    }
    return aTime - bTime;
  });

  const formatShowDate = (value: string) => formatShowDatePretty(value, locale);
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-highlight/20 blur-3xl" />
        <div className="absolute inset-0 bg-surface/40" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <Container className="relative py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.4em] text-text-dim">{labels.shows.label}</p>
        <h1 className="mt-4 text-4xl font-brand uppercase tracking-[0.22em] text-highlight sm:text-5xl">
          {labels.shows.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">
          {labels.shows.introPrefix}
          <span className="font-mono text-text">content/shows.json</span>
          {labels.shows.introSuffix}
        </p>

        {sortedShows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border/70 bg-surface/60 p-6 text-sm text-text-muted">
            {labels.shows.empty}
          </div>
        ) : (
          <ul className="mt-10 grid gap-4">
            {sortedShows.map((show) => (
              <li
                key={show.id}
                className="rounded-2xl border border-border/70 bg-surface/60 p-6 transition-colors hover:border-highlight/60"
              >
                <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-start">
                  {show.imageUrl ? (
                    <div className="overflow-hidden rounded-xl border border-border/70 bg-bg/50">
                      <img
                        src={show.imageUrl}
                        alt={`${show.venue} show`}
                        className="h-32 w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  <div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text">{show.venue}</p>
                        <p className="text-sm text-text-muted">{show.city}</p>
                      </div>
                      <p className="text-sm tabular-nums text-text-dim">
                        {formatShowDate(show.date)}
                      </p>
                    </div>
                    {show.price ? (
                      <p className="mt-2 text-sm tabular-nums text-text">{show.price}</p>
                    ) : null}
                    {show.ticketUrl ? (
                      <a
                        className="btn-primary mt-4"
                        href={show.ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {labels.shows.tickets}
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
