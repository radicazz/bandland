import Link from "next/link";

import { ReleasePlayerTabs } from "@/components/ReleasePlayerTabs";
import { MerchCarousel } from "@/components/MerchCarousel";
import type { Show } from "@/content/schema";
import { getMerchItems } from "@/content/merch";
import { getShows } from "@/content/shows";
import type { Locale, Translations } from "@/i18n/translations";
import { formatShowDatePretty } from "@/lib/formatters";
import { splitShowsByStatus } from "@/lib/shows";

type HomeCarouselProps = {
  labels: Translations;
  locale: Locale;
};

function HomeShowPricing({
  show,
  labels,
}: {
  show: Show;
  labels: Translations["shows"];
}) {
  if (show.priceOnline || show.priceDoor) {
    return (
      <div className="grid gap-2 text-sm">
        {show.priceOnline ? (
          <p className="break-words text-text">
            <span className="text-text-dim">{labels.onlinePriceLabel}:</span>{" "}
            <span className="tabular-nums">{show.priceOnline}</span>
          </p>
        ) : null}
        {show.priceDoor ? (
          <p className="break-words text-text">
            <span className="text-text-dim">{labels.doorPriceLabel}:</span>{" "}
            <span className="tabular-nums">{show.priceDoor}</span>
          </p>
        ) : null}
      </div>
    );
  }

  if (show.price) {
    return <p className="break-words text-sm tabular-nums text-text">{show.price}</p>;
  }

  return null;
}

function hasShowPricing(show: Show) {
  return Boolean(show.price || show.priceOnline || show.priceDoor);
}

function UpcomingShowListItem({
  show,
  homeLabels,
  showLabels,
  locale,
}: {
  show: Show;
  homeLabels: Translations["home"];
  showLabels: Translations["shows"];
  locale: Locale;
}) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-text-dim">
        {formatShowDatePretty(show.date, locale)}
      </p>
      <p className="mt-3 break-words text-base font-semibold text-text">{show.venue}</p>
      <p className="mt-1 break-words text-sm text-text-muted">{show.city}</p>
      {show.timeFrame ? (
        <p className="mt-3 break-words text-sm text-text-muted">
          {homeLabels.timeFrameLabel}: <span className="text-text">{show.timeFrame}</span>
        </p>
      ) : null}
      {hasShowPricing(show) ? (
        <div className="mt-3">
          <HomeShowPricing show={show} labels={showLabels} />
        </div>
      ) : null}
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-highlight">
        {show.ticketUrl ? homeLabels.ticketsCta : homeLabels.allShowsCta}
      </p>
    </>
  );

  if (show.ticketUrl) {
    return (
      <a
        href={show.ticketUrl}
        target="_blank"
        rel="noreferrer"
        className="menu-tile h-full"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href="/shows" className="menu-tile h-full">
      {content}
    </Link>
  );
}

export async function HomeCarousel({ labels, locale }: HomeCarouselProps) {
  const homeLabels = labels.home;
  const showLabels = labels.shows;
  const latestRelease = {
    title: homeLabels.latestReleaseTitle,
    description: homeLabels.latestReleaseDescription,
    href: "https://tr.ee/7KaRvTpbLN",
    cta: homeLabels.latestReleaseCta,
    spotifyEmbedUrl:
      "https://open.spotify.com/embed/track/1ZqBftZCkFF0YOmYaQ7v2c?utm_source=generator&theme=0",
    appleEmbedUrl:
      "https://embed.music.apple.com/za/album/pappa-soek-n-porsche-single/1866600943?i=1866600944&theme=dark",
  };

  const [merchItems, shows] = await Promise.all([getMerchItems(), getShows()]);
  const { upcoming } = splitShowsByStatus(shows);
  const featuredShow = upcoming[0];
  const supportingShows = upcoming.slice(1, 4);

  return (
    <div className="flex w-full flex-col items-center gap-5 px-1 sm:gap-8 sm:px-4 lg:gap-10">
      <section className="w-full max-w-6xl">
        <div className={`grid gap-5 ${supportingShows.length > 0 ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)]" : ""}`}>
          <article className="card-interactive rounded-3xl border border-border/70 bg-surface/70 p-5 text-left sm:p-7 lg:p-8">
            <p className="text-xs uppercase tracking-[0.4em] text-text-dim">
              {homeLabels.nextShowLabel}
            </p>
            {featuredShow ? (
              <>
                <h2 className="mt-4 break-words text-3xl font-brand uppercase tracking-[0.12em] text-highlight sm:text-4xl sm:tracking-[0.16em] lg:text-5xl">
                  {featuredShow.venue}
                </h2>
                <p className="mt-3 break-words text-base text-text sm:text-lg">
                  {featuredShow.city}
                </p>
                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-border/70 bg-bg/30 px-4 py-3">
                    <p className="break-words text-sm tabular-nums text-text">
                      {formatShowDatePretty(featuredShow.date, locale)}
                    </p>
                  </div>
                  {featuredShow.timeFrame ? (
                    <div className="rounded-2xl border border-border/70 bg-bg/30 px-4 py-3">
                      <p className="break-words text-sm text-text-muted">
                        {homeLabels.timeFrameLabel}:{" "}
                        <span className="text-text">{featuredShow.timeFrame}</span>
                      </p>
                    </div>
                  ) : null}
                  {hasShowPricing(featuredShow) ? (
                    <div className="rounded-2xl border border-border/70 bg-bg/30 px-4 py-3">
                      <HomeShowPricing show={featuredShow} labels={showLabels} />
                    </div>
                  ) : null}
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {featuredShow.ticketUrl ? (
                    <a
                      href={featuredShow.ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary btn-primary-lg w-full sm:w-auto"
                    >
                      {homeLabels.ticketsCta}
                    </a>
                  ) : null}
                  <Link
                    href="/shows"
                    className={`${featuredShow.ticketUrl ? "btn-secondary" : "btn-primary btn-primary-lg"} w-full sm:w-auto`}
                  >
                    {homeLabels.allShowsCta}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-4 break-words text-3xl font-brand uppercase tracking-[0.12em] text-highlight sm:text-4xl sm:tracking-[0.16em]">
                  {homeLabels.nextShowFallbackTitle}
                </h2>
                <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
                  {homeLabels.nextShowFallbackDescription}
                </p>
                <div className="mt-6">
                  <Link href="/shows" className="btn-primary btn-primary-lg w-full sm:w-auto">
                    {homeLabels.allShowsCta}
                  </Link>
                </div>
              </>
            )}
          </article>

          {supportingShows.length > 0 ? (
            <aside className="card-interactive rounded-3xl border border-border/70 bg-surface/60 p-4 sm:p-6">
              <p className="text-xs uppercase tracking-[0.4em] text-text-dim">
                {homeLabels.upcomingListTitle}
              </p>
              <div className="mt-4 grid gap-3">
                {supportingShows.map((show) => (
                  <UpcomingShowListItem
                    key={show.id}
                    show={show}
                    homeLabels={homeLabels}
                    showLabels={showLabels}
                    locale={locale}
                  />
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="w-full max-w-6xl">
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <article className="card-interactive rounded-3xl border border-border/70 bg-surface/60 p-4 text-left sm:p-7 lg:p-8">
            <p className="text-xs uppercase tracking-[0.4em] text-text-dim">
              {homeLabels.releaseLabel}
            </p>
            <h2 className="mt-4 break-words text-2xl font-brand uppercase tracking-[0.12em] text-highlight sm:text-3xl sm:tracking-[0.16em]">
              {latestRelease.title}
            </h2>
            <p className="mt-4 break-words text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
              {latestRelease.description}
            </p>
            <div className="mt-6">
              <a
                href={latestRelease.href}
                target="_blank"
                rel="noreferrer"
                className="btn-primary btn-primary-lg w-full sm:w-auto"
              >
                {latestRelease.cta}
              </a>
            </div>
            <ReleasePlayerTabs
              title={latestRelease.title}
              spotifyUrl={latestRelease.spotifyEmbedUrl}
              appleUrl={latestRelease.appleEmbedUrl}
              labels={homeLabels}
            />
          </article>
          <MerchCarousel items={merchItems} labels={homeLabels} />
        </div>
      </section>
    </div>
  );
}
