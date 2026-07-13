import Link from "next/link";

import { site } from "@/config/site";
import { getShows } from "@/content/shows";
import type { Locale, Translations } from "@/i18n/translations";
import { formatShowDatePretty } from "@/lib/formatters";
import { splitShowsByStatus } from "@/lib/shows";

type HomeCarouselProps = {
  labels: Translations;
  locale: Locale;
};

export async function HomeCarousel({ labels, locale }: HomeCarouselProps) {
  const { upcoming } = splitShowsByStatus(await getShows());
  const nextShow = upcoming[0];

  return (
    <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
      <section className="punk-panel p-4 sm:p-6 lg:p-7" aria-labelledby="latest-release">
        <p className="section-kicker">{labels.home.releaseLabel}</p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="latest-release" className="display-title text-4xl sm:text-5xl">
              {labels.home.latestReleaseTitle}
            </h2>
            <p className="mt-3 text-sm text-text-muted">{labels.home.latestReleaseDescription}</p>
          </div>
          <a
            href={site.latestRelease.href}
            target="_blank"
            rel="noreferrer"
            className="btn-primary shrink-0"
          >
            {labels.home.latestReleaseCta}
          </a>
        </div>
        <div className="mt-6 overflow-hidden border border-border bg-bg/70">
          <iframe
            title={`${labels.home.latestReleaseTitle} — Spotify player`}
            src={site.latestRelease.spotifyEmbedUrl}
            width="100%"
            height="152"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block w-full"
          />
        </div>
      </section>

      <section className="punk-panel flex flex-col p-4 sm:p-6" aria-labelledby="next-show">
        <p className="section-kicker">{labels.home.nextShowLabel}</p>
        {nextShow ? (
          <>
            <h2 id="next-show" className="display-title mt-6 text-4xl">
              {nextShow.venue}
            </h2>
            <p className="mt-3 text-sm text-text-muted">{nextShow.city}</p>
            <p className="mt-5 border-l border-highlight pl-3 font-mono text-sm tabular-nums text-text">
              {formatShowDatePretty(nextShow.date, locale)}
            </p>
            {nextShow.timeFrame ? (
              <p className="mt-2 text-sm text-text-muted">{nextShow.timeFrame}</p>
            ) : null}
            <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {nextShow.ticketUrl ? (
                <a
                  href={nextShow.ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  {labels.home.ticketsCta}
                </a>
              ) : null}
              <Link href="/shows" className="btn-secondary">
                {labels.home.allShowsCta}
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 id="next-show" className="display-title mt-6 text-4xl">
              {labels.home.nextShowFallbackTitle}
            </h2>
            <p className="mt-4 text-sm leading-6 text-text-muted">
              {labels.home.nextShowFallbackDescription}
            </p>
            <Link href="/shows" className="btn-primary mt-6">
              {labels.home.allShowsCta}
            </Link>
          </>
        )}
      </section>

      <nav className="grid gap-2 sm:grid-cols-2 lg:col-span-2" aria-label={labels.nav.explore}>
        <Link
          href="/shows"
          className="menu-tile py-4 font-bold uppercase tracking-[0.18em] text-text"
        >
          {labels.nav.shows}{" "}
          <span aria-hidden className="float-right text-highlight">
            →
          </span>
        </Link>
        <Link
          href="/merch"
          className="menu-tile py-4 font-bold uppercase tracking-[0.18em] text-text"
        >
          {labels.nav.merch}{" "}
          <span aria-hidden className="float-right text-highlight">
            →
          </span>
        </Link>
      </nav>
    </div>
  );
}
