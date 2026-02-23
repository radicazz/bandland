import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ContentImage } from "@/components/ContentImage";
import { getShows } from "@/content/shows";
import { getTranslationsFromCookies } from "@/i18n/server";
import { formatShowDatePretty } from "@/lib/formatters";

function OnlinePriceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4a12 12 0 0 1 0 16" />
      <path d="M12 4a12 12 0 0 0 0 16" />
    </svg>
  );
}

function DoorPriceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 4.5h8a1 1 0 0 1 1 1v13H8a1 1 0 0 1-1-1z" />
      <path d="M10.5 12.5h.01" strokeLinecap="round" />
      <path d="M16 18.5h1.5" strokeLinecap="round" />
    </svg>
  );
}

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
        <h1 className="mt-4 break-words text-4xl font-brand uppercase tracking-[0.14em] text-highlight sm:text-5xl sm:tracking-[0.22em]">
          {labels.shows.title}
        </h1>
        <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-text-muted">
          {labels.shows.introPrefix}
          {labels.shows.introSuffix}
        </p>
        <div className="mt-5 grid gap-2 rounded-2xl border border-border/70 bg-surface/50 p-4 text-sm text-text-muted sm:max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-text-dim">
            {labels.shows.ticketPriceGuideTitle}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <span className="text-highlight" aria-hidden="true">
                <OnlinePriceIcon />
              </span>
              <span>{labels.shows.ticketPriceGuideOnline}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-highlight" aria-hidden="true">
                <DoorPriceIcon />
              </span>
              <span>{labels.shows.ticketPriceGuideDoor}</span>
            </span>
          </div>
          <p className="text-xs text-text-dim">
            {labels.shows.ticketPriceGuideFallbackNote}
          </p>
        </div>

        {sortedShows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border/70 bg-surface/60 p-6 text-sm text-text-muted">
            {labels.shows.empty}
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 sm:gap-5">
            {sortedShows.map((show) => {
              const hasSplitPrices = Boolean(show.priceOnline || show.priceDoor);

              return (
                <li
                  key={show.id}
                  className="rounded-2xl border border-border/70 bg-surface/60 p-4 transition-colors hover:border-highlight/60 sm:p-6"
                >
                  <div
                    className={`grid gap-4 md:items-start ${
                      show.imageUrl ? "md:grid-cols-[160px_minmax(0,1fr)]" : ""
                    }`}
                  >
                    {show.imageUrl ? (
                      <div className="overflow-hidden rounded-xl border border-border/70 bg-bg/50">
                        <ContentImage
                          src={show.imageUrl}
                          alt={`${show.venue} show poster`}
                          className="h-32 w-full object-cover"
                          fallbackClassName="flex h-32 w-full items-center justify-center bg-surface/50"
                          fallbackLabel={show.venue}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-text">{show.venue}</p>
                          <p className="break-words text-sm text-text-muted">{show.city}</p>
                        </div>
                        <p className="break-words text-sm tabular-nums text-text-dim sm:text-right">
                          {formatShowDate(show.date)}
                        </p>
                      </div>
                      {show.timeFrame ? (
                        <p className="mt-2 break-words text-sm text-text-muted">
                          {labels.shows.timeFrameLabel}:{" "}
                          <span className="text-text">{show.timeFrame}</span>
                        </p>
                      ) : null}
                      {hasSplitPrices ? (
                        <div className="mt-2 grid gap-2 text-sm">
                          {show.priceOnline ? (
                            <p className="inline-flex items-start gap-2 break-words text-text">
                              <span className="mt-0.5 text-highlight" aria-hidden="true">
                                <OnlinePriceIcon />
                              </span>
                              <span>
                                <span className="text-text-muted">
                                  {labels.shows.onlinePriceLabel}:
                                </span>{" "}
                                <span className="tabular-nums">{show.priceOnline}</span>
                              </span>
                            </p>
                          ) : null}
                          {show.priceDoor ? (
                            <p className="inline-flex items-start gap-2 break-words text-text">
                              <span className="mt-0.5 text-highlight" aria-hidden="true">
                                <DoorPriceIcon />
                              </span>
                              <span>
                                <span className="text-text-muted">
                                  {labels.shows.doorPriceLabel}:
                                </span>{" "}
                                <span className="tabular-nums">{show.priceDoor}</span>
                              </span>
                            </p>
                          ) : null}
                        </div>
                      ) : show.price ? (
                        <p className="mt-2 break-words text-sm tabular-nums text-text">{show.price}</p>
                      ) : null}
                      {show.ticketUrl ? (
                        <a
                          className="btn-primary mt-4 w-full sm:w-auto"
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
              );
            })}
          </ul>
        )}
      </Container>
    </section>
  );
}
