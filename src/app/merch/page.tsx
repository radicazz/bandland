import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ContentImage } from "@/components/ContentImage";
import { getMerchItems } from "@/content/merch";
import { getTranslationsFromCookies } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { labels } = await getTranslationsFromCookies();
  return {
    title: labels.merch.title,
  };
}

export default async function MerchPage() {
  const { labels } = await getTranslationsFromCookies();
  const merchItems = await getMerchItems();
  return (
    <section className="page-glow relative overflow-hidden border-b border-border/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-8 h-[320px] w-[320px] rounded-full bg-highlight/15 blur-3xl" />
        <div className="absolute inset-0 bg-surface/35" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <Container className="relative py-16 sm:py-20">
        <p className="section-kicker">{labels.merch.label}</p>
        <h1 className="display-title mt-7 text-6xl sm:text-7xl lg:text-8xl">
          {labels.merch.title}
        </h1>
        <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-text-muted">
          {labels.merch.introPrefix}
          {labels.merch.introSuffix}
        </p>

        {merchItems.length === 0 ? (
          <div className="punk-panel mt-10 p-6 text-sm text-text-muted">{labels.merch.empty}</div>
        ) : (
          <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {merchItems.map((item) => (
              <li key={item.id} className="card-interactive punk-panel p-4 sm:p-6">
                <div
                  className={`grid gap-4 md:items-start lg:block ${
                    item.imageId || item.imageUrl ? "md:grid-cols-[140px_minmax(0,1fr)]" : ""
                  }`}
                >
                  {item.imageId || item.imageUrl ? (
                    <div className="overflow-hidden border border-border bg-bg/50 lg:mb-5">
                      <ContentImage
                        src={item.imageUrl}
                        imageId={item.imageId}
                        alt={item.name}
                        className="h-28 w-full object-cover lg:h-36"
                        fallbackClassName="flex h-28 w-full items-center justify-center bg-surface/50 lg:h-36"
                        fallbackLabel={item.name}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                      <h2 className="break-words text-lg font-brand uppercase tracking-[0.08em] text-text">
                        {item.name}
                      </h2>
                      <p className="break-words font-mono text-sm tabular-nums text-highlight sm:text-right">
                        {item.price}
                      </p>
                    </div>
                    {item.description ? (
                      <p className="mt-3 break-words text-sm leading-6 text-text-muted">
                        {item.description}
                      </p>
                    ) : null}
                    <a
                      className="btn-primary mt-4 w-full sm:w-auto"
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {labels.merch.view}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
