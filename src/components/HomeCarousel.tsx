import { site } from "@/config/site";

export function HomeCarousel() {
  const latestRelease = {
    title: "Latest release",
    description: "Listen to the newest drop.",
    href: "https://tr.ee/7KaRvTpbLN",
    cta: "Listen",
    embedUrl:
      "https://open.spotify.com/embed/track/4vV3oxYqzSUBXBODbrKAmO?utm_source=generator&theme=0",
  };

  const instagramEmbeds: string[] = [];
  const instagramProfile =
    site.socials.find((social) => social.label === "Instagram")?.href ??
    "https://www.instagram.com/";

  return (
    <div className="flex w-full flex-col items-center gap-12 px-4 sm:px-6">
      <section className="w-full max-w-4xl">
        <article className="rounded-3xl border border-border/70 bg-surface/60 p-6 text-left sm:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Pinned</p>
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
              loading="lazy"
              className="block w-full"
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-highlight/60 bg-highlight/10 px-6 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-highlight transition-colors hover:bg-highlight/20 whitespace-normal"
              href={latestRelease.href}
              target="_blank"
              rel="noreferrer"
            >
              {latestRelease.cta}
            </a>
          </div>
        </article>
      </section>

      <section className="w-full max-w-6xl">
        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-border/70 bg-surface/50 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Store</p>
            <h2 className="mt-4 text-2xl font-brand uppercase tracking-[0.16em] text-highlight">
              Merch
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Limited runs and staples. New drops coming soon.
            </p>
            <a
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full border border-highlight/60 bg-highlight/10 px-5 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-highlight transition-colors hover:bg-highlight/20 whitespace-normal"
              href="/merch"
            >
              Shop merch
            </a>
          </article>

          <article className="rounded-3xl border border-border/70 bg-surface/50 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Live</p>
            <h2 className="mt-4 text-2xl font-brand uppercase tracking-[0.16em] text-highlight">
              Shows
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Upcoming dates, tickets, and venue details.
            </p>
            <a
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full border border-highlight/60 bg-highlight/10 px-5 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-highlight transition-colors hover:bg-highlight/20 whitespace-normal"
              href="/shows"
            >
              View shows
            </a>
          </article>

          <article className="rounded-3xl border border-border/70 bg-surface/50 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Gallery</p>
            <h2 className="mt-4 text-2xl font-brand uppercase tracking-[0.16em] text-highlight">
              Instagram
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Latest Instagram posts from the band.
            </p>
            {instagramEmbeds.length > 0 ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {instagramEmbeds.slice(0, 3).map((embedUrl) => (
                  <div
                    key={embedUrl}
                    className="overflow-hidden rounded-2xl border border-border/70 bg-surface/70"
                  >
                    <iframe
                      title="Instagram post"
                      src={embedUrl}
                      width="100%"
                      height="320"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="block w-full"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-3 gap-3">
                {["One", "Two", "Three"].map((label) => (
                  <div
                    key={label}
                    className="flex aspect-square items-center justify-center rounded-2xl border border-border/70 bg-surface/70 text-[10px] uppercase tracking-[0.32em] text-text-dim"
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
            <a
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full border border-highlight/60 bg-highlight/10 px-5 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-highlight transition-colors hover:bg-highlight/20 whitespace-normal"
              href={instagramProfile}
              target="_blank"
              rel="noreferrer"
            >
              Follow
            </a>
          </article>
        </div>
      </section>
    </div>
  );
}
