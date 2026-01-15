import Link from "next/link";

import { ReleasePlayerTabs } from "@/components/ReleasePlayerTabs";
import type { Translations } from "@/i18n/translations";

type HomeCarouselProps = {
  labels: Translations["home"];
};

export function HomeCarousel({ labels }: HomeCarouselProps) {
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
          <Link
            href="/merch"
            className="card-interactive block rounded-3xl border border-border/70 bg-surface/50 p-4 sm:p-7"
            aria-label={labels.storeCta}
          >
            <article>
              <p className="text-xs uppercase tracking-[0.4em] text-text-dim">
                {labels.storeLabel}
              </p>
              <h2 className="mt-4 text-2xl font-brand uppercase tracking-[0.16em] text-highlight">
                {labels.storeTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                {labels.storeDescription}
              </p>
            </article>
          </Link>

          <Link
            href="/shows"
            className="card-interactive block rounded-3xl border border-border/70 bg-surface/50 p-4 sm:p-7"
            aria-label={labels.liveCta}
          >
            <article>
              <p className="text-xs uppercase tracking-[0.4em] text-text-dim">
                {labels.liveLabel}
              </p>
              <h2 className="mt-4 text-2xl font-brand uppercase tracking-[0.16em] text-highlight">
                {labels.liveTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                {labels.liveDescription}
              </p>
            </article>
          </Link>
        </div>
      </section>
    </div>
  );
}
