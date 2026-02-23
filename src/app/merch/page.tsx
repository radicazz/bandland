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
    <section className="relative overflow-hidden border-b border-border/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-8 h-[320px] w-[320px] rounded-full bg-highlight/15 blur-3xl" />
        <div className="absolute inset-0 bg-surface/35" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <Container className="relative py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.4em] text-text-dim">{labels.merch.label}</p>
        <h1 className="mt-4 break-words text-4xl font-brand uppercase tracking-[0.14em] text-highlight sm:text-5xl sm:tracking-[0.22em]">
          {labels.merch.title}
        </h1>
        <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-text-muted">
          {labels.merch.introPrefix}
          {labels.merch.introSuffix}
        </p>

        {merchItems.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border/70 bg-surface/60 p-6 text-sm text-text-muted">
            {labels.merch.empty}
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {merchItems.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-border/70 bg-surface/60 p-4 transition-colors hover:border-highlight/60 sm:p-6"
              >
                <div
                  className={`grid gap-4 md:items-start ${
                    item.imageUrl ? "md:grid-cols-[140px_minmax(0,1fr)]" : ""
                  }`}
                >
                  {item.imageUrl ? (
                    <div className="overflow-hidden rounded-xl border border-border/70 bg-bg/50">
                      <ContentImage
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-28 w-full object-cover"
                        fallbackClassName="flex h-28 w-full items-center justify-center bg-surface/50"
                        fallbackLabel={item.name}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                      <p className="break-words text-sm font-semibold text-text">{item.name}</p>
                      <p className="break-words text-sm tabular-nums text-text-dim sm:text-right">
                        {item.price}
                      </p>
                    </div>
                    {item.description ? (
                      <p className="mt-2 break-words text-sm text-text-muted">{item.description}</p>
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
