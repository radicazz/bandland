import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { DoorPriceIcon, OnlinePriceIcon, ShowCard } from "@/components/ShowCard";
import { getShows } from "@/content/shows";
import { getTranslationsFromCookies } from "@/i18n/server";
import { splitShowsByStatus } from "@/lib/shows";
import type { Locale, Translations } from "@/i18n/translations";
import type { Show } from "@/content/schema";

function ShowListSection({
  heading,
  headingId,
  shows,
  locale,
  labels,
  isPast = false,
}: {
  heading: string;
  headingId: string;
  shows: Show[];
  locale: Locale;
  labels: Translations["shows"];
  isPast?: boolean;
}) {
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="section-kicker">
        {heading}
      </h2>
      <ul className="mt-4 grid gap-4 sm:gap-5">
        {shows.map((show) => (
          <li key={show.id}>
            <ShowCard show={show} locale={locale} labels={labels} isPast={isPast} />
          </li>
        ))}
      </ul>
    </section>
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
  const { upcoming, past } = splitShowsByStatus(shows);
  const hasSplitPricing = shows.some(
    (show) => Boolean(show.priceOnline) || Boolean(show.priceDoor),
  );

  return (
    <section className="page-glow relative overflow-hidden border-b border-border/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-highlight/20 blur-3xl" />
        <div className="absolute inset-0 bg-surface/40" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <Container className="relative py-16 sm:py-20">
        <p className="section-kicker">{labels.shows.label}</p>
        <h1 className="display-title mt-7 text-6xl sm:text-7xl lg:text-8xl">
          {labels.shows.title}
        </h1>
        <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-text-muted">
          {labels.shows.introPrefix}
          {labels.shows.introSuffix}
        </p>
        {hasSplitPricing ? (
          <div className="mt-7 grid gap-2 border-l-2 border-highlight bg-surface/70 p-4 text-sm text-text-muted sm:max-w-2xl">
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
            <p className="text-xs text-text-dim">{labels.shows.ticketPriceGuideFallbackNote}</p>
          </div>
        ) : null}

        {upcoming.length === 0 && past.length === 0 ? (
          <div className="punk-panel mt-10 p-6 text-sm text-text-muted">{labels.shows.empty}</div>
        ) : (
          <div className="mt-10 grid gap-8">
            {upcoming.length > 0 ? (
              <ShowListSection
                heading={labels.shows.upcomingTitle}
                headingId="upcoming-shows-heading"
                shows={upcoming}
                locale={locale}
                labels={labels.shows}
              />
            ) : null}
            {past.length > 0 ? (
              <ShowListSection
                heading={labels.shows.pastTitle}
                headingId="past-shows-heading"
                shows={past}
                locale={locale}
                labels={labels.shows}
                isPast
              />
            ) : null}
          </div>
        )}
      </Container>
    </section>
  );
}
