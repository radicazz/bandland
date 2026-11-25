import type { Metadata } from "next";

import { EmptyNotice, PageIntro, PageSection } from "@/components/PageSection";
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
        venueAs="h3"
      />
    </li>
  );
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="headline flex items-center gap-4 text-3xl after:h-0.5 after:flex-1 after:bg-text sm:text-4xl"
      >
        {heading}
      </h2>
      <ul className="mt-6 grid gap-6">{visible.map(renderShow)}</ul>
      {hidden.length > 0 ? (
        <details className="group mt-6">
          <summary className="btn-zine w-full cursor-pointer list-none sm:w-auto [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">
              {labels.showOlder.replace("{count}", String(hidden.length))}
            </span>
            <span className="hidden group-open:inline">{labels.hideOlder}</span>
          </summary>
          <ul className="mt-6 grid gap-6">{hidden.map(renderShow)}</ul>
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
        title={labels.shows.title}
        description={labels.shows.introPrefix + labels.shows.introSuffix}
        photo="/photos/02-guitarist-wide.webp"
      />
      {hasSplitPricing ? (
        <div className="mt-10 grid gap-3 border-2 border-dashed border-text p-5 text-base text-text-muted sm:max-w-2xl">
          <p className="kicker">{labels.shows.ticketPriceGuideTitle}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <span className="text-text" aria-hidden="true">
                <OnlinePriceIcon />
              </span>
              <span>{labels.shows.ticketPriceGuideOnline}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-text" aria-hidden="true">
                <DoorPriceIcon />
              </span>
              <span>{labels.shows.ticketPriceGuideDoor}</span>
            </span>
          </div>
          <p className="text-sm text-text-dim">{labels.shows.ticketPriceGuideFallbackNote}</p>
        </div>
      ) : null}

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyNotice message={labels.shows.empty} photo="/photos/03-drummer-wide.webp" />
      ) : (
        <div className="mt-14 grid gap-16">
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
