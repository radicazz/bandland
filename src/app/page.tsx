import { readdir } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";

import { Container } from "@/components/Container";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { HomeCarousel } from "@/components/HomeCarousel";
import { site } from "@/config/site";
import { getTranslationsFromCookies } from "@/i18n/server";

const slideshowDir = path.join(process.cwd(), "public", "slideshow");

const getSlides = unstable_cache(
  async () => {
    try {
      const entries = await readdir(slideshowDir, { withFileTypes: true });
      return entries
        .filter(
          (entry) =>
            entry.isFile() && /\.(avif|gif|jpe?g|png|webp)$/i.test(entry.name),
        )
        .map((entry) => `/slideshow/${entry.name}`)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } catch {
      return [];
    }
  },
  ["slideshow-images"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["slideshow"],
  },
);

export default async function Home() {
  const { labels, locale } = await getTranslationsFromCookies();
  const slides = await getSlides();

  return (
    <section className="relative min-h-svh -mt-16 overflow-hidden pt-16 sm:min-h-[calc(100svh-4rem)]">
      <HeroSlideshow slides={slides} />

      <Container className="relative flex items-center justify-center py-10 sm:items-start sm:py-14 lg:py-16">
        <h1 className="sr-only">{site.name}</h1>
        <HomeCarousel labels={labels} locale={locale} />
      </Container>
    </section>
  );
}
