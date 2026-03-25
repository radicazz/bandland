import { ReleasePlayerTabs } from "@/components/ReleasePlayerTabs";
import { MerchCarousel } from "@/components/MerchCarousel";
import { UpcomingShow } from "@/components/UpcomingShow";
import { getMerchItems } from "@/content/merch";
import { getShows } from "@/content/shows";
import type { Locale, Translations } from "@/i18n/translations";

type HomeCarouselProps = {
  labels: Translations["home"];
  locale: Locale;
};

export async function HomeCarousel({ labels, locale }: HomeCarouselProps) {
  const latestRelease = {
    title: labels.latestReleaseTitle,
    description: labels.latestReleaseDescription,
    href: "https://tr.ee/7KaRvTpbLN",
    cta: labels.latestReleaseCta,
    spotifyEmbedUrl:
      "https://open.spotify.com/embed/track/1ZqBftZCkFF0YOmYaQ7v2c?utm_source=generator&theme=0",
    appleEmbedUrl:
      "https://embed.music.apple.com/za/album/pappa-soek-n-porsche-single/1866600943?i=1866600944&theme=dark",
  };

  const [merchItems, shows] = await Promise.all([getMerchItems(), getShows()]);

  return (
    <div className="flex w-full flex-col items-center gap-5 px-1 sm:gap-10 sm:px-4 lg:gap-12">
      <section className="w-full max-w-6xl">
        <article className="card-interactive rounded-3xl border border-border/70 bg-surface/60 p-4 text-left sm:p-7 lg:p-10">
          <p className="text-xs uppercase tracking-[0.4em] text-text-dim">{labels.pinned}</p>
          <h2 className="mt-4 break-words text-2xl font-brand uppercase tracking-[0.12em] text-highlight sm:text-4xl sm:tracking-[0.16em] lg:text-5xl">
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
            labels={labels}
          />
        </article>
      </section>

      <section className="w-full max-w-6xl">
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
          <MerchCarousel items={merchItems} labels={labels} />
          <UpcomingShow shows={shows} labels={labels} locale={locale} />
        </div>
      </section>
    </div>
  );
}
