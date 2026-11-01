import Link from "next/link";

import type { SiteSettings, WidgetId, WidgetSetting } from "@/content/schema";
import { getShows } from "@/content/shows";
import { getDefaultSettings } from "@/content/settings-defaults";
import type { Locale, Translations } from "@/i18n/translations";
import { formatShowDatePretty } from "@/lib/formatters";
import { splitShowsByStatus } from "@/lib/shows";

type HomeFeaturesProps = {
  labels: Translations;
  locale: Locale;
  settings?: SiteSettings;
};

export async function HomeFeatures({
  labels,
  locale,
  settings = getDefaultSettings(),
}: HomeFeaturesProps) {
  const widgets = settings.widgets.filter((widget) => widget.enabled);
  const needsShows = widgets.some((widget) => widget.id === "nextShow");
  const nextShow = needsShows ? splitShowsByStatus(await getShows()).upcoming[0] : undefined;

  const renderers: Record<WidgetId, () => React.ReactNode> = {
    nextShow: () => (
      <section className="panel flex h-full flex-col p-6 sm:p-8" aria-labelledby="next-show">
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
    ),
    release: () => (
      <section className="panel h-full p-6 sm:p-8" aria-labelledby="latest-release">
        <p className="section-kicker">{labels.home.releaseLabel}</p>
        <h2 id="latest-release" className="display-title mt-3 text-3xl sm:text-4xl">
          {settings.release.title}
        </h2>
        <p className="mt-2 text-lg text-text-muted">
          {settings.release.description ?? labels.home.latestReleaseDescription}
        </p>
        {settings.release.embedUrl ? (
          <div className="mt-6 overflow-hidden rounded-xl bg-bg">
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
        ) : (
          <a
            href={settings.release.href}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-6"
          >
            {labels.home.latestReleaseCta}
            <span aria-hidden>↗</span>
          </a>
        )}
      </section>
    ),
    merch: () => (
      <nav aria-label={labels.nav.explore} className="h-full">
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
    ),
  };

  const widthClass = (width: WidgetSetting["width"]) => (width === "full" ? "lg:col-span-2" : "");

  if (widgets.length === 0) return null;

  return (
    <div className="grid w-full gap-6 lg:grid-cols-2">
      {widgets.map((widget) => (
        <div key={widget.id} className={`min-w-0 ${widthClass(widget.width)}`}>
          {renderers[widget.id]()}
        </div>
      ))}
    </div>
  );
}
