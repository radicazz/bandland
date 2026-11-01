import type { Metadata } from "next";

import { PageIntro, PageSection } from "@/components/PageSection";
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
  highlightFirst = false,
  collapseAfter,
  newTabLabel,
}: {
  heading: string;
  headingId: string;
  shows: Show[];
  locale: Locale;
  labels: Translations["shows"];
  isPast?: boolean;
  highlightFirst?: boolean;
  collapseAfter?: number;
  newTabLabel: string;
}) {
  const visible = collapseAfter === undefined ? shows : shows.slice(0, collapseAfter);
  const hidden = collapseAfter === undefined ? [] : shows.slice(collapseAfter);
  const renderShow = (show: Show, index: number) => (
    <li key={show.id}>
      <ShowCard
        show={show}
        locale={locale}
        labels={labels}
        isPast={isPast}
        isNext={highlightFirst && index === 0}
        newTabLabel={newTabLabel}
      />
    </li>
  );
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="section-kicker">
        {heading}
      </h2>
      <ul className="mt-4 grid gap-4 sm:gap-5">{visible.map(renderShow)}</ul>
      {hidden.length > 0 ? (
        <details className="group mt-4">
          <summary className="btn-secondary w-full cursor-pointer list-none sm:w-auto group-open:hidden [&::-webkit-details-marker]:hidden">
            {labels.showOlder.replace("{count}", String(hidden.length))}
          </summary>
          <ul className="grid gap-4 sm:gap-5">{hidden.map(renderShow)}</ul>
        </details>
      ) : null}
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
    <PageSection>
      <PageIntro
        label={labels.shows.label}
        title={labels.shows.title}
        description={labels.shows.introPrefix + labels.shows.introSuffix}
      />
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
              highlightFirst
              newTabLabel={labels.common.opensInNewTab}
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
              collapseAfter={3}
              newTabLabel={labels.common.opensInNewTab}
            />
          ) : null}
        </div>
      )}
    </PageSection>
  );
}
