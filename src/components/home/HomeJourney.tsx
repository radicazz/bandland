import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { buildRoute, type StopId } from "@/components/guitar/journey";
import { PlaybackProvider } from "@/components/guitar/PlaybackProvider";
import { PlayButton } from "@/components/guitar/PlayButton";
import { MerchCard } from "@/components/MerchCard";
import { ShowCard } from "@/components/ShowCard";
import { site } from "@/config/site";
import { getMerchItems } from "@/content/merch";
import type { SiteSettings } from "@/content/schema";
import { getShows } from "@/content/shows";
import type { Locale, Translations } from "@/i18n/translations";
import { splitShowsByStatus } from "@/lib/shows";
import { JourneyStage } from "./JourneyStage";

const MERCH_PREVIEW_COUNT = 3;

type HomeJourneyProps = {
  labels: Translations;
  locale: Locale;
  settings: SiteSettings;
};

function Stop({
  id,
  labelledBy,
  className = "",
  children,
}: {
  id: StopId;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      data-stop={id}
      aria-labelledby={labelledBy}
      className={`flex min-h-[70svh] flex-col justify-center py-16 md:min-h-svh ${className}`}
    >
      {children}
    </section>
  );
}

export async function HomeJourney({ labels, locale, settings }: HomeJourneyProps) {
  const enabled = new Set(
    settings.widgets.filter((widget) => widget.enabled).map((widget) => widget.id),
  );
  const [shows, merch] = await Promise.all([
    enabled.has("nextShow") ? getShows() : Promise.resolve([]),
    enabled.has("merch") ? getMerchItems() : Promise.resolve([]),
  ]);
  const upcoming = splitShowsByStatus(shows).upcoming;
  const merchPreview = merch.slice(0, MERCH_PREVIEW_COUNT);

  // The rendered sections and the camera route come from the same list, so they
  // always agree: a stop with nothing to show is dropped from both.
  const route = buildRoute(settings.widgets).filter(
    (stop) => stop !== "body" || merchPreview.length > 0,
  );
  const journey = labels.home.journey;

  const sections: Record<StopId, () => ReactNode> = {
    hero: () => (
      <Stop id="hero" labelledBy="journey-hero" className="md:pt-32">
        <h1
          id="journey-hero"
          className="font-brand text-[clamp(4rem,19vw,9.5rem)] leading-[0.9] text-text md:text-[clamp(4rem,10vw,8rem)]"
        >
          {site.name}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-text sm:text-xl">
          {settings.hero.tagline ?? labels.meta.description}
        </p>
        <div className="mt-8 flex flex-col items-start gap-3">
          <PlayButton labels={journey} />
          <p className="text-base text-text-muted">{journey.playHint}</p>
        </div>
      </Stop>
    ),
    release: () => (
      <Stop id="release" labelledBy="journey-release">
        <p className="section-kicker">{labels.home.latestReleaseTitle}</p>
        <h2 id="journey-release" className="display-title mt-3 text-3xl sm:text-4xl">
          {settings.release.title}
        </h2>
        <p className="mt-2 text-lg text-text-muted">
          {settings.release.description ?? labels.home.latestReleaseDescription}
        </p>
        {settings.release.embedUrl ? (
          <div className="mt-6 overflow-hidden rounded-card bg-bg">
            <iframe
              title={`${labels.home.latestReleaseTitle}: ${settings.release.title}`}
              src={settings.release.embedUrl}
              width="100%"
              height="152"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="block w-full"
            />
          </div>
        ) : null}
        <a
          href={settings.release.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${labels.home.latestReleaseCta}: ${settings.release.title} (${labels.common.opensInNewTab})`}
          className="btn-primary mt-6 self-start"
        >
          {labels.home.latestReleaseCta}
          <span aria-hidden>↗</span>
        </a>
      </Stop>
    ),
    neck: () =>
      upcoming.length > 0 ? (
        <Stop id="neck" labelledBy="journey-neck">
          <p className="section-kicker">{labels.home.nextShowLabel}</p>
          <h2 id="journey-neck" className="display-title mt-3 text-3xl sm:text-4xl">
            {journey.neckTitle}
          </h2>
          <ol className="mt-8 grid gap-4 border-l border-border pl-4 sm:pl-6">
            {upcoming.map((show, index) => (
              <li key={show.id} data-fret={index}>
                <ShowCard
                  show={show}
                  locale={locale}
                  labels={labels.shows}
                  isNext={index === 0}
                  newTabLabel={labels.common.opensInNewTab}
                />
              </li>
            ))}
          </ol>
          <Link href="/shows" className="btn-secondary mt-8 self-start">
            {labels.home.allShowsCta}
          </Link>
        </Stop>
      ) : (
        <Stop id="neck" labelledBy="journey-neck">
          <p className="section-kicker">{labels.home.nextShowLabel}</p>
          <h2 id="journey-neck" className="display-title mt-3 text-3xl sm:text-4xl">
            {labels.home.nextShowFallbackTitle}
          </h2>
          <p className="mt-4 text-lg leading-8 text-text-muted">
            {labels.home.nextShowFallbackDescription}
          </p>
          <Link href="/shows" className="btn-primary mt-8 self-start">
            {labels.home.allShowsCta}
          </Link>
        </Stop>
      ),
    body: () => (
      <Stop id="body" labelledBy="journey-body">
        <p className="section-kicker">{labels.nav.merch}</p>
        <h2 id="journey-body" className="display-title mt-3 text-3xl sm:text-4xl">
          {journey.bodyTitle}
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          {merchPreview.map((item) => (
            <li key={item.id} className="min-w-0">
              <MerchCard
                item={item}
                labels={labels.merch}
                newTabLabel={labels.common.opensInNewTab}
              />
            </li>
          ))}
        </ul>
        <Link href="/merch" className="btn-secondary mt-8 self-start">
          {labels.nav.merch}
        </Link>
      </Stop>
    ),
    outro: () => (
      <Stop id="outro" labelledBy="journey-outro">
        <h2 id="journey-outro" className="display-title text-3xl sm:text-4xl">
          {journey.outroTitle}
        </h2>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/shows" className="btn-primary">
            {labels.home.allShowsCta}
          </Link>
          <Link href="/merch" className="btn-secondary">
            {labels.nav.merch}
          </Link>
        </div>
      </Stop>
    ),
  };

  return (
    <PlaybackProvider>
      {/* -mt-16 slides the journey under the translucent sticky header, as the old hero did. */}
      <div className="relative mx-auto -mt-16 w-full max-w-6xl md:grid md:grid-cols-2 md:gap-10 md:px-6">
        <div className="sticky top-0 z-10 h-[45svh] md:order-2 md:h-svh">
          <JourneyStage route={route} initialFret={upcoming.length > 0 ? 0 : -1} />
        </div>
        <div className="relative px-4 sm:px-6 md:order-1 md:px-0">
          {route.map((stop) => (
            <Fragment key={stop}>{sections[stop]()}</Fragment>
          ))}
        </div>
      </div>
    </PlaybackProvider>
  );
}
