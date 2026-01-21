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
    <div className="flex w-full flex-col items-center gap-5 px-2 sm:gap-12 sm:px-6">
      <section className="w-full max-w-6xl">
        <article className="card-interactive rounded-3xl border border-border/70 bg-surface/60 p-4 text-left sm:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.4em] text-text-dim">{labels.pinned}</p>
          <h2 className="mt-4 wrap-break-word text-3xl font-brand uppercase tracking-[0.16em] text-highlight sm:text-4xl lg:text-5xl">
            {latestRelease.title}
          </h2>
          <p className="mt-4 wrap-break-word text-base leading-7 text-text-muted">
            {latestRelease.description}
          </p>
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
