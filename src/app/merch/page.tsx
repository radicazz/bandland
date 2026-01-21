import type { Metadata } from "next";

import { Container } from "@/components/Container";
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
        <h1 className="mt-4 text-4xl font-brand uppercase tracking-[0.22em] text-highlight sm:text-5xl">
          {labels.merch.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">
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
                className="rounded-2xl border border-border/70 bg-surface/60 p-6 transition-colors hover:border-highlight/60"
              >
                <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                  {item.imageUrl ? (
                    <div className="overflow-hidden rounded-xl border border-border/70 bg-bg/50">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-28 w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-text">{item.name}</p>
                      <p className="text-sm tabular-nums text-text-dim">{item.price}</p>
                    </div>
                    {item.description ? (
                      <p className="mt-2 text-sm text-text-muted">{item.description}</p>
                    ) : null}
                    <a
                      className="btn-primary mt-4"
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
