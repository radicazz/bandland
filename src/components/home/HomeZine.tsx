import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { MerchCard } from "@/components/MerchCard";
import { site } from "@/config/site";
import { getMerchItems } from "@/content/merch";
import type { MerchItem, Show, SiteSettings } from "@/content/schema";
import { getShows } from "@/content/shows";
import type { Locale, Translations } from "@/i18n/translations";
import { isHttpsUrl } from "@/lib/public-url";
import { getUpcomingShow } from "@/lib/shows";
import { HeroPlayer } from "./HeroPlayer";
import { ReleasePlayer } from "./ReleasePlayer";
import styles from "./home.module.css";

const MERCH_PREVIEW_COUNT = 3;
const SHOW_TIME_ZONE = "Africa/Johannesburg";
const LOCALE_TAGS: Record<Locale, string> = { en: "en-ZA", af: "af-ZA" };
/** Page gutter shared by every block so their edges line up. */
const GUTTER = "px-4 sm:px-8 lg:px-12";
const WIDE = "mx-auto w-full max-w-[100rem]";

type HomeZineProps = {
  labels: Translations;
  locale: Locale;
  settings: SiteSettings;
};

/** The body blocks below the hero; "panels" is the release + show row (with the photos). */
type Block = "panels" | "merch";

/**
 * Admin widget order decides the blocks: release and nextShow share the panel row
 * (placed where the first of them comes, in their own order); merch is its own block.
 * The photo row is band identity rather than a widget, so it stays even when both
 * panel widgets are off (it then sits at the end).
 */
function planBlocks(settings: SiteSettings, hasMerch: boolean) {
  const enabled = settings.widgets.filter((widget) => widget.enabled).map((widget) => widget.id);
  const blocks: Block[] = [];
  for (const id of enabled) {
    if (id === "merch") {
      if (hasMerch) blocks.push("merch");
    } else if (!blocks.includes("panels")) {
      blocks.push("panels");
    }
  }
  if (!blocks.includes("panels")) blocks.push("panels");
  const release = enabled.includes("release");
  const nextShow = enabled.includes("nextShow");
  return {
    blocks,
    release,
    nextShow,
    releaseFirst: !nextShow || enabled.indexOf("release") < enabled.indexOf("nextShow"),
  };
}

function formatShowDate(value: string, locale: Locale) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: value, time: "" };
  const tag = LOCALE_TAGS[locale];
  return {
    date: new Intl.DateTimeFormat(tag, {
      timeZone: SHOW_TIME_ZONE,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parsed),
    time: new Intl.DateTimeFormat(tag, {
      timeZone: SHOW_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(parsed),
  };
}

function Hero({ labels, settings }: Pick<HomeZineProps, "labels" | "settings">) {
  const home = labels.home;
  return (
    <section aria-labelledby="home-title" className="relative overflow-x-clip">
      <div
        className={`${WIDE} relative grid lg:min-h-[min(42rem,calc(100svh-7rem))] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]`}
      >
        <div className={`${GUTTER} relative z-10 flex flex-col justify-center pt-8 pb-10 lg:py-14`}>
          <h1
            id="home-title"
            className="wordmark -ml-1 text-[clamp(5.5rem,30vw,10rem)] lg:-ml-2 lg:text-[clamp(11rem,19.5vw,20rem)]"
          >
            {site.name}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-7 font-medium text-text-muted sm:text-xl">
            {settings.hero.tagline ?? labels.meta.description}
          </p>
          <div
            role="group"
            aria-label={home.featuredTrackLabel}
            className="mt-8 w-full max-w-xl lg:mt-10"
          >
            <HeroPlayer labels={home.track} />
          </div>
        </div>

        {/* The collage: a torn red sheet with the hero shot and a second, taped photo. */}
        <div className="relative min-h-[27rem] sm:min-h-[34rem] lg:min-h-0">
          <div
            aria-hidden="true"
            className="panel-red paper-grain torn-diag absolute inset-y-0 -right-2 left-0 lg:-left-[14%]"
          />
          <div
            aria-hidden="true"
            className="paper-grain torn-bottom absolute top-[6%] -right-6 h-16 w-[62%] rotate-[-8deg] [--fill:var(--paper-2)] max-sm:hidden"
          />
          <div className="absolute top-[7%] left-[16%] w-[60%] max-w-80 -rotate-3 sm:left-[22%] sm:w-[46%] lg:top-[8%] lg:left-[10%] lg:w-[44%]">
            <div className={`${styles.tornPhoto} halftone`}>
              <div className="relative aspect-[2/3]">
                <Image
                  src="/photos/02-guitarist-tall.webp"
                  alt={home.photos.guitarist}
                  fill
                  preload
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 60vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div className="photo-frame tilt-right absolute right-[5%] bottom-[9%] w-[40%] max-w-72 max-sm:hidden lg:right-[6%] lg:bottom-[12%] lg:w-[38%]">
            <div className="relative aspect-square">
              <Image
                src="/photos/01-guitar-bass-square.webp"
                alt={home.photos.guitarAndBass}
                fill
                sizes="(min-width: 1024px) 18vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="fret-strip relative z-10" />
    </section>
  );
}

function ReleasePanel({ labels, settings }: Pick<HomeZineProps, "labels" | "settings">) {
  const home = labels.home;
  const { release } = settings;
  return (
    <section
      aria-labelledby="home-release"
      className={`panel-red paper-grain ${styles.tornPanel} grid min-w-0 overflow-x-clip sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]`}
    >
      <div className="flex min-w-0 flex-col p-6 pt-8 sm:p-8 lg:p-10">
        <h2
          id="home-release"
          className="headline text-[clamp(2.75rem,11vw,4.25rem)] lg:text-[clamp(3rem,4vw,5rem)]"
        >
          {release.title}
        </h2>
        <span aria-hidden="true" className="mt-5 block h-0.5 w-3/4 bg-text" />
        <p className="kicker mt-4">{home.releaseKicker}</p>
        <p className="mt-3 text-base text-text-muted">
          {release.description ?? home.latestReleaseDescription}
        </p>
        <a
          href={release.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${home.latestReleaseCta}: ${release.title} (${labels.common.opensInNewTab})`}
          className="btn-zine mt-6 self-start"
        >
          {home.latestReleaseCta}
          <span aria-hidden="true">{"▶︎"}</span>
        </a>
        {release.embedUrl ? (
          <ReleasePlayer
            src={release.embedUrl}
            title={`${home.latestReleaseTitle}: ${release.title}`}
            loadLabel={home.loadReleasePlayer.replace(
              "{provider}",
              new URL(release.embedUrl).hostname === "embed.music.apple.com"
                ? "Apple Music"
                : "Spotify",
            )}
          />
        ) : null}
      </div>
      <div className="relative min-h-56 sm:min-h-0">
        <div
          className={`${styles.tornPhoto} halftone halftone-red absolute inset-3 rotate-2 sm:inset-y-8 sm:right-4 sm:left-0`}
        >
          <Image
            src="/photos/03-drummer-tall.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 90vw"
            className="object-cover object-[50%_15%]"
          />
        </div>
      </div>
    </section>
  );
}

function ShowPanel({
  show,
  labels,
  locale,
}: {
  show: Show | undefined;
  labels: Translations;
  locale: Locale;
}) {
  const home = labels.home;
  const panel = `panel-ink paper-grain ${styles.tornPanel} flex min-w-0 flex-col p-7 sm:p-9`;
  if (!show) {
    return (
      <section aria-labelledby="home-show" className={panel}>
        <p className="kicker">{home.nextShowLabel}</p>
        <h2
          id="home-show"
          className="headline headline-italic mt-4 text-[clamp(2.25rem,9vw,3.5rem)] lg:text-[clamp(2.25rem,3.4vw,3.75rem)]"
        >
          {home.noShowsTitle}
        </h2>
        <span aria-hidden="true" className={`${styles.marker} mt-4`} />
        <p className="mt-5 text-lg leading-7 text-text-muted">{home.noShowsDescription}</p>
        <Link href="/shows" className="btn-zine-red mt-8 self-start sm:mt-auto sm:self-end">
          {home.allShowsCta}
          <span aria-hidden="true">{"▶︎"}</span>
        </Link>
      </section>
    );
  }
  const { date, time } = formatShowDate(show.date, locale);
  const ticketUrl = isHttpsUrl(show.ticketUrl) ? show.ticketUrl : undefined;
  return (
    <section aria-labelledby="home-show" className={panel}>
      <p className="kicker">{home.nextShowLabel}</p>
      <h2
        id="home-show"
        className="headline headline-italic mt-4 text-[clamp(2.75rem,12vw,4.5rem)] lg:text-[clamp(2.75rem,4.4vw,5rem)]"
      >
        {show.venue}
      </h2>
      <span aria-hidden="true" className={`${styles.marker} mt-4`} />
      <p className="mt-5 text-lg font-semibold tabular-nums">
        <time dateTime={show.date}>
          {date}
          {time ? ` · ${time}` : ""}
        </time>
      </p>
      <p className="text-lg text-text-muted">{show.city}</p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-auto sm:justify-end sm:pt-8">
        <Link
          href="/shows"
          className="inline-flex min-h-11 items-center text-base font-semibold underline underline-offset-4"
        >
          {home.allShowsCta}
        </Link>
        {ticketUrl ? (
          <a
            href={ticketUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${home.tickets}: ${show.venue} (${labels.common.opensInNewTab})`}
            className="btn-zine-red"
          >
            {home.tickets}
            <span aria-hidden="true">{"▶︎"}</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}

const GRID_PHOTOS = [
  {
    src: "/photos/03-drummer-wide.webp",
    position: "object-center",
    tilt: "tilt-left",
    alt: "drummer",
  },
  {
    src: "/photos/01-guitar-bass-wide.webp",
    position: "object-[30%_50%]",
    tilt: "tilt-right",
    alt: "guitarAndBass",
  },
  // Detail crops of the hero shots: decorative, so they are not announced twice.
  {
    src: "/photos/02-guitarist-tall.webp",
    position: "object-[50%_82%]",
    tilt: "tilt-right",
    alt: null,
  },
  {
    src: "/photos/01-guitar-bass-tall.webp",
    position: "object-[70%_40%]",
    tilt: "tilt-left",
    alt: null,
  },
] as const;

function PhotoGrid({ labels }: { labels: Translations }) {
  return (
    <ul
      aria-label={labels.home.photosLabel}
      className="grid h-full grid-cols-2 content-center gap-x-4 gap-y-6 px-2 py-4 sm:gap-x-5 lg:gap-y-8"
    >
      {GRID_PHOTOS.map((photo) => (
        <li key={`${photo.src}-${photo.position}`} className={`photo-frame ${photo.tilt}`}>
          <div className="relative aspect-[4/3] lg:aspect-[4/5]">
            <Image
              src={photo.src}
              alt={photo.alt ? labels.home.photos[photo.alt] : ""}
              fill
              sizes="(min-width: 1024px) 12vw, (min-width: 768px) 22vw, 45vw"
              className={`object-cover ${photo.position}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Panels({
  plan,
  show,
  labels,
  locale,
  settings,
}: {
  plan: ReturnType<typeof planBlocks>;
  show: Show | undefined;
} & HomeZineProps) {
  const right = (
    <div
      key="right"
      className={`grid min-w-0 gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] ${
        plan.release ? "" : "lg:col-span-2"
      }`}
    >
      {/* Phones read the show before the photos; md+ puts the photos on the left. */}
      {plan.nextShow ? <ShowPanel show={show} labels={labels} locale={locale} /> : null}
      <div className={`min-w-0 ${plan.nextShow ? "md:order-first" : "md:col-span-2"}`}>
        <PhotoGrid labels={labels} />
      </div>
    </div>
  );
  const left = plan.release ? (
    <ReleasePanel key="release" labels={labels} settings={settings} />
  ) : null;
  return (
    <div className={`${WIDE} grid gap-4 overflow-x-clip p-3 sm:p-4 lg:grid-cols-2`}>
      {plan.releaseFirst ? [left, right] : [right, left]}
    </div>
  );
}

function MerchBlock({ items, labels }: { items: MerchItem[]; labels: Translations }) {
  return (
    <section
      aria-labelledby="home-merch"
      className="panel-paper paper-grain torn-top [--fill:var(--paper-2)]"
    >
      <div className={`${WIDE} ${GUTTER} py-14`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="home-merch" className="headline text-[clamp(2.75rem,8vw,4.5rem)]">
            {labels.home.merchTitle}
          </h2>
          <Link href="/merch" className="btn-zine">
            {labels.home.allMerchCta}
            <span aria-hidden="true">{"▶︎"}</span>
          </Link>
        </div>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
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
      </div>
    </section>
  );
}

function LinksBlock({ labels, settings }: Pick<HomeZineProps, "labels" | "settings">) {
  const socials = settings.socials.filter((social) => isHttpsUrl(social.href));
  if (socials.length === 0) return null;
  return (
    <section aria-labelledby="home-links" className="panel-ink paper-grain torn-top">
      <div
        className={`${WIDE} ${GUTTER} flex flex-col gap-6 pt-14 pb-12 md:flex-row md:items-center`}
      >
        <h2 id="home-links" className="headline headline-italic shrink-0 text-5xl md:mr-6">
          {labels.home.linksTitle}
        </h2>
        <ul className="flex flex-wrap gap-3">
          {socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${social.label} (${labels.common.opensInNewTab})`}
                className="btn-zine"
              >
                {social.label}
                <span aria-hidden="true">{"↗︎"}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export async function HomeZine({ labels, locale, settings }: HomeZineProps) {
  const enabled = new Set(
    settings.widgets.filter((widget) => widget.enabled).map((widget) => widget.id),
  );
  // Storage errors degrade to empty sections rather than failing the whole page.
  const [shows, merch] = await Promise.all([
    enabled.has("nextShow") ? getShows().catch(() => []) : Promise.resolve([]),
    enabled.has("merch") ? getMerchItems().catch(() => []) : Promise.resolve([]),
  ]);
  const nextShow = getUpcomingShow(shows);
  const merchPreview = merch.slice(0, MERCH_PREVIEW_COUNT);
  const plan = planBlocks(settings, merchPreview.length > 0);

  const blocks: Record<Block, () => ReactNode> = {
    panels: () => (
      <Panels
        key="panels"
        plan={plan}
        show={nextShow}
        labels={labels}
        locale={locale}
        settings={settings}
      />
    ),
    merch: () => <MerchBlock key="merch" items={merchPreview} labels={labels} />,
  };

  return (
    <div className="paper-grain overflow-x-clip">
      <Hero labels={labels} settings={settings} />
      <div data-home-blocks={plan.blocks.join(",")}>
        {plan.blocks.map((block) => blocks[block]())}
      </div>
      <LinksBlock labels={labels} settings={settings} />
    </div>
  );
}
