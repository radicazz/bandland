import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { proceduralAnchors } from "@/components/guitar/guitarModel";
import { buildRoute, type StopId } from "@/components/guitar/journey";
import { PlayButton } from "@/components/guitar/PlayButton";
import { Reveal } from "@/components/Reveal";
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
const NECK_ROWS_ID = "journey-neck-rows";

// The stage is a full-screen backdrop, so only the sticky header needs clearing.
const SCROLL_CLEAR = "scroll-mt-20";
const INTERACTIVE_SCROLL_CLEAR =
  "[&_a]:scroll-mt-20 [&_button]:scroll-mt-20 [&_iframe]:scroll-mt-20";

const stopAnchor = (stop: StopId) => `stop-${stop}`;
const stopNumber = (index: number) => String(index + 1).padStart(2, "0");

type HomeJourneyProps = {
  labels: Translations;
  locale: Locale;
  settings: SiteSettings;
};

function Stop({
  id,
  labelledBy,
  className = "justify-center py-16",
  children,
}: {
  id: StopId;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={stopAnchor(id)}
      data-stop={id}
      aria-labelledby={labelledBy}
      className={`relative flex min-h-svh flex-col ${SCROLL_CLEAR} ${className}`}
    >
      {children}
    </section>
  );
}

/** Stop number + fret-wire rule + label, e.g. "02 ── Newest release". */
function Kicker({ number, children }: { number: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-sm font-semibold tabular-nums">
      <span className="text-highlight">{number}</span>
      <span aria-hidden className="h-px w-8 bg-border" />
      <span className="text-text-dim">{children}</span>
    </p>
  );
}

const STOP_TITLE = "display-title mt-3 text-4xl sm:text-5xl lg:text-6xl";

export async function HomeJourney({ labels, locale, settings }: HomeJourneyProps) {
  const enabled = new Set(
    settings.widgets.filter((widget) => widget.enabled).map((widget) => widget.id),
  );
  // Storage errors degrade to empty stops rather than failing the whole page.
  const [shows, merch] = await Promise.all([
    enabled.has("nextShow") ? getShows().catch(() => []) : Promise.resolve([]),
    enabled.has("merch") ? getMerchItems().catch(() => []) : Promise.resolve([]),
  ]);
  // One show per fret; the "All shows" link covers the rest.
  const upcoming = splitShowsByStatus(shows).upcoming.slice(0, proceduralAnchors.fretCount);
  const merchPreview = merch.slice(0, MERCH_PREVIEW_COUNT);

  // The rendered sections and the camera route come from the same list, so they
  // always agree: a stop with nothing to show is dropped from both.
  const route = buildRoute(settings.widgets).filter(
    (stop) => stop !== "body" || merchPreview.length > 0,
  );
  const journey = labels.home.journey;
  const number = (stop: StopId) => stopNumber(route.indexOf(stop));

  const sections: Record<StopId, () => ReactNode> = {
    hero: () => (
      <Stop
        id="hero"
        labelledBy="journey-hero"
        // Phones: the guitar fills the screen, so the copy sits at the bottom like a poster.
        className="justify-end pt-24 pb-14 md:justify-center md:py-24"
      >
        <h1
          id="journey-hero"
          className="intro-wordmark -ml-1 font-brand text-[clamp(4.5rem,24vw,9rem)] leading-[0.85] text-text md:text-[clamp(6rem,11vw,11rem)]"
        >
          {site.name}
        </h1>
        <div className="flex flex-col">
          <p className="mt-4 max-w-xl text-lg leading-8 text-text sm:text-xl">
            {settings.hero.tagline ?? labels.meta.description}
          </p>
          {route.includes("release") ? (
            <a
              href={`#${stopAnchor("release")}`}
              className="group mt-6 inline-flex max-w-xl items-center gap-3 self-start text-base text-text-muted"
            >
              <span aria-hidden className="h-px w-8 bg-highlight" />
              <span>
                {labels.home.latestReleaseTitle}:{" "}
                <span className="font-semibold text-text underline decoration-border underline-offset-4 transition-colors group-hover:decoration-highlight">
                  {settings.release.title}
                </span>
              </span>
            </a>
          ) : null}
          <div className="mt-10 flex flex-col items-start gap-2">
            <PlayButton labels={journey} />
            <p className="text-sm text-text-dim">{journey.playHint}</p>
          </div>
        </div>
      </Stop>
    ),
    release: () => (
      <Stop id="release" labelledBy="journey-release">
        <Reveal className="flex flex-col">
          <Kicker number={number("release")}>{labels.home.latestReleaseTitle}</Kicker>
          <h2 id="journey-release" className={STOP_TITLE}>
            {settings.release.title}
          </h2>
          <p className="mt-2 text-lg text-text-muted">
            {settings.release.description ?? labels.home.latestReleaseDescription}
          </p>
          {settings.release.embedUrl ? (
            <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface p-2">
              <iframe
                title={`${labels.home.latestReleaseTitle}: ${settings.release.title}`}
                src={settings.release.embedUrl}
                width="100%"
                height="152"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="block w-full rounded-control"
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
            <span aria-hidden>{"\u2197\uFE0E"}</span>
          </a>
        </Reveal>
      </Stop>
    ),
    neck: () =>
      upcoming.length > 0 ? (
        <Stop id="neck" labelledBy="journey-neck">
          <Reveal className="flex flex-col">
            <Kicker number={number("neck")}>{labels.home.nextShowLabel}</Kicker>
            <h2 id="journey-neck" className={STOP_TITLE}>
              {labels.nav.shows}
            </h2>
            <ol id={NECK_ROWS_ID} className="mt-8 grid gap-4 border-l border-border pl-4 sm:pl-6">
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
          </Reveal>
        </Stop>
      ) : (
        <Stop id="neck" labelledBy="journey-neck">
          <Reveal className="flex flex-col">
            <Kicker number={number("neck")}>{labels.home.nextShowLabel}</Kicker>
            <h2 id="journey-neck" className={STOP_TITLE}>
              {labels.home.nextShowFallbackTitle}
            </h2>
            <p className="mt-4 text-lg leading-8 text-text-muted">
              {labels.home.nextShowFallbackDescription}
            </p>
            <Link href="/shows" className="btn-primary mt-8 self-start">
              {labels.home.allShowsCta}
            </Link>
          </Reveal>
        </Stop>
      ),
    body: () => (
      <Stop id="body" labelledBy="journey-body">
        <Reveal className="flex flex-col">
          <Kicker number={number("body")}>{labels.nav.merch}</Kicker>
          <h2 id="journey-body" className={STOP_TITLE}>
            {labels.nav.merch}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {merchPreview.map((item) => (
              <li key={item.id} className="min-w-0">
                <MerchCard
                  item={item}
                  titleAs="h3"
                  labels={labels.merch}
                  newTabLabel={labels.common.opensInNewTab}
                />
              </li>
            ))}
          </ul>
          <Link href="/merch" className="btn-secondary mt-8 self-start">
            {labels.nav.merch}
          </Link>
        </Reveal>
      </Stop>
    ),
    outro: () => (
      <Stop id="outro" labelledBy="journey-outro">
        <Reveal className="flex flex-col">
          <Kicker number={number("outro")}>{journey.outroKicker}</Kicker>
          <h2 id="journey-outro" className={STOP_TITLE}>
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
        </Reveal>
      </Stop>
    ),
  };

  // Starts under the translucent sticky header so the stage runs edge to edge.
  return (
    <div className="relative -mt-16">
      {/*
        Full-screen backdrop pinned for the whole journey; the negative margin
        lets the sections scroll over it instead of after it. lvh keeps the
        canvas size steady while mobile browser bars slide in and out. Once the
        player bar is up, the stage ends above it so the bar never covers the
        guitar (--player-clear is set by PlayerBar).
      */}
      <div className="pointer-events-none sticky top-0 h-[calc(100lvh-var(--player-clear,0px))] [&_*]:pointer-events-none">
        <JourneyStage route={route} rowsId={NECK_ROWS_ID} rowCount={upcoming.length} />
        {/* Fades from black over the poster (which stays painted underneath) on a session's first load. */}
        <div aria-hidden className="stage-intro" />
      </div>
      <div
        className={`relative mx-auto -mt-[calc(100lvh-var(--player-clear,0px))] w-full max-w-6xl px-4 sm:px-6 ${INTERACTIVE_SCROLL_CLEAR}`}
      >
        <div className="md:w-1/2 md:pr-6 lg:pr-10">
          {route.map((stop) => (
            <Fragment key={stop}>{sections[stop]()}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
