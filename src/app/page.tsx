import { readdir } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import Image from "next/image";

import { Container } from "@/components/Container";
import { HomeCarousel } from "@/components/HomeCarousel";
import { site } from "@/config/site";
import { getTranslationsFromCookies } from "@/i18n/server";

const slideshowDir = path.join(process.cwd(), "public", "slideshow");
const slideIntervalSeconds = 6;

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
  const { labels } = await getTranslationsFromCookies();
  const slides = await getSlides();
  const slideCount = Math.max(slides.length, 1);
  const totalDurationSeconds = slideCount * slideIntervalSeconds;
  
  // Determine which animation to use based on slide count
  const getAnimationName = (slideCount: number) => {
    if (slideCount === 1) return 'hero-fade-1';
    if (slideCount === 2) return 'hero-fade-2';
    return 'hero-fade-3';
  };
  
  const animationName = getAnimationName(slideCount);

  return (
    <section className="relative min-h-[100svh] -mt-16 overflow-hidden pt-16 pb-16">
      <div aria-hidden className="absolute inset-0">
        {slides.map((src, index) => (
          <div
            key={src}
            className="absolute inset-0 hero-slide"
            style={{
              animationName,
              animationDelay: `${index * slideIntervalSeconds}s`,
              animationDuration: `${totalDurationSeconds}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-bg/50" />
        <div className="absolute inset-0 bg-highlight/20 mix-blend-screen" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <Container className="relative flex min-h-[100svh] items-start justify-center py-16">
        <h1 className="sr-only">{site.name}</h1>
        <HomeCarousel labels={labels.home} />
      </Container>
    </section>
  );
}