import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { site } from "@/config/site";
import { getTranslationsFromCookies } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { labels } = await getTranslationsFromCookies();
  return {
    title: labels.gallery.label,
  };
}

export default async function GalleryPage() {
  const { labels } = await getTranslationsFromCookies();
  const instagramUrl =
    site.socials.find((social) => social.label === "Instagram")?.href ??
    "https://www.instagram.com/";

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-16 h-[320px] w-[320px] rounded-full bg-highlight/15 blur-3xl" />
        <div className="absolute inset-0 bg-surface/35" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <Container className="relative py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.4em] text-text-dim">{labels.gallery.label}</p>
        <h1 className="mt-4 text-4xl font-brand uppercase tracking-[0.22em] text-highlight sm:text-5xl">
          {labels.gallery.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">
          {labels.gallery.intro}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {["01", "02", "03"].map((label) => (
            <div
              key={label}
              className="flex aspect-square items-center justify-center rounded-2xl border border-border/70 bg-surface/60 text-xs uppercase tracking-[0.4em] text-text-dim"
            >
              {label}
            </div>
          ))}
        </div>

        <a
          className="btn-primary mt-8"
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
        >
          {labels.gallery.follow}
        </a>
      </Container>
    </section>
  );
}
