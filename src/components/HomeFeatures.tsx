import Link from "next/link";

import { site } from "@/config/site";
import { getShows } from "@/content/shows";
import type { Locale, Translations } from "@/i18n/translations";
import { formatShowDatePretty } from "@/lib/formatters";
import { splitShowsByStatus } from "@/lib/shows";

type HomeFeaturesProps = {
  labels: Translations;
  locale: Locale;
};

export async function HomeFeatures({ labels, locale }: HomeFeaturesProps) {
  const { upcoming } = splitShowsByStatus(await getShows());
  const nextShow = upcoming[0];

  return (
    <div className="grid w-full gap-6 lg:grid-cols-2">
      <section
        className="panel order-first flex flex-col p-6 sm:p-8 lg:order-none"
        aria-labelledby="next-show"
      >
        <p className="section-kicker">{labels.home.nextShowLabel}</p>
        {nextShow ? (
          <>
            <h2 id="next-show" className="display-title mt-3 text-3xl sm:text-4xl">
              {nextShow.venue}
            </h2>
            <p className="mt-2 text-lg text-text-muted">{nextShow.city}</p>
            <p className="mt-6 text-xl font-semibold tabular-nums text-text">
              {formatShowDatePretty(nextShow.date, locale)}
            </p>
            {nextShow.timeFrame ? (
              <p className="mt-1 text-base text-text-muted">{nextShow.timeFrame}</p>
            ) : null}
            <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2">
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
            <h2 id="next-show" className="display-title mt-3 text-3xl sm:text-4xl">
              {labels.home.nextShowFallbackTitle}
            </h2>
            <p className="mt-4 text-lg leading-8 text-text-muted">
              {labels.home.nextShowFallbackDescription}
            </p>
            <Link href="/shows" className="btn-primary mt-8 self-start">
              {labels.home.allShowsCta}
            </Link>
          </>
        )}
      </section>

      <section className="panel p-6 sm:p-8" aria-labelledby="latest-release">
        <p className="section-kicker">{labels.home.releaseLabel}</p>
        <h2 id="latest-release" className="display-title mt-3 text-3xl sm:text-4xl">
          {site.latestRelease.title}
        </h2>
        <p className="mt-2 text-lg text-text-muted">{labels.home.latestReleaseDescription}</p>
        <div className="mt-6 overflow-hidden rounded-xl bg-bg">
          <iframe
            title={`${labels.home.latestReleaseTitle}: ${site.latestRelease.title} — Spotify`}
            src={site.latestRelease.spotifyEmbedUrl}
            width="100%"
            height="152"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block w-full"
          />
        </div>
      </section>

      <nav aria-label={labels.nav.explore} className="lg:col-span-2">
        <Link
          href="/merch"
          className="card-interactive panel flex min-h-16 items-center justify-between gap-4 px-6 py-5 text-xl font-semibold text-text"
        >
          {labels.nav.merch}
          <span aria-hidden className="text-highlight">
            →
          </span>
        </Link>
      </nav>
    </div>
  );
}
