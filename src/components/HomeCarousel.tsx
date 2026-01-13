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
    embedUrl:
      "https://open.spotify.com/embed/track/4vV3oxYqzSUBXBODbrKAmO?utm_source=generator&theme=0",
  };

  return (
    <div className="flex w-full flex-col items-center gap-12 px-4 sm:px-6">
      <section className="w-full max-w-6xl">
        <article className="rounded-3xl border border-border/70 bg-surface/60 p-6 text-left sm:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.4em] text-text-dim">{labels.pinned}</p>
          <h2 className="mt-4 break-words text-3xl font-brand uppercase tracking-[0.16em] text-highlight sm:text-4xl lg:text-5xl">
            {latestRelease.title}
          </h2>
          <p className="mt-4 break-words text-base leading-7 text-text-muted">
            {latestRelease.description}
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-surface/70">
            <iframe
              title={`${latestRelease.title} — Spotify player`}
              src={latestRelease.embedUrl}
              width="100%"
              height="152"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="eager"
              className="block w-full"
            />
          </div>
        </article>
      </section>

      <section className="w-full max-w-6xl">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-border/70 bg-surface/50 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.4em] text-text-dim">
              {labels.storeLabel}
            </p>
            <h2 className="mt-4 text-2xl font-brand uppercase tracking-[0.16em] text-highlight">
              {labels.storeTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              {labels.storeDescription}
            </p>
            <a
              className="btn-primary mt-5"
              href="/merch"
            >
              {labels.storeCta}
            </a>
          </article>

          <article className="rounded-3xl border border-border/70 bg-surface/50 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.4em] text-text-dim">{labels.liveLabel}</p>
            <h2 className="mt-4 text-2xl font-brand uppercase tracking-[0.16em] text-highlight">
              {labels.liveTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              {labels.liveDescription}
            </p>
            <a
              className="btn-primary mt-5"
              href="/shows"
            >
              {labels.liveCta}
            </a>
          </article>
        </div>
      </section>
    </div>
  );
}
