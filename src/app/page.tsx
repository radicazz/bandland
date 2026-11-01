import Link from "next/link";

import { Container } from "@/components/Container";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { HomeFeatures } from "@/components/HomeFeatures";
import { site } from "@/config/site";
import { slideshowImages } from "@/config/slideshow";
import { getTranslationsFromCookies } from "@/i18n/server";

export default async function Home() {
  const { labels, locale } = await getTranslationsFromCookies();

  return (
    <>
      <section className="relative -mt-16 flex min-h-[78svh] items-end overflow-hidden border-b border-border pt-16 sm:min-h-[70svh]">
        <HeroSlideshow slides={[...slideshowImages]} labels={labels.home.slideshow} />

        <Container className="relative pb-10 pt-32 sm:pb-14 lg:pb-20">
          <h1 className="font-brand text-[clamp(4rem,19vw,9.5rem)] leading-[0.9] text-text">
            {site.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-text sm:text-xl">
            {labels.meta.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={site.latestRelease.href}
              target="_blank"
              rel="noreferrer"
              className="btn-primary btn-primary-lg"
            >
              {labels.home.latestReleaseCta}
              <span aria-hidden>↗</span>
            </a>
            <Link href="/shows" className="btn-secondary btn-primary-lg">
              {labels.home.allShowsCta}
            </Link>
          </div>
        </Container>
      </section>

      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <HomeFeatures labels={labels} locale={locale} />
        </Container>
      </section>
    </>
  );
}
