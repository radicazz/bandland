import { readdir } from "node:fs/promises";
import path from "node:path";
import Image from "next/image";

import { Container } from "@/components/Container";
import { HomeCarousel } from "@/components/HomeCarousel";
import { site } from "@/config/site";

const slideshowDir = path.join(process.cwd(), "public", "slideshow");
const slideIntervalSeconds = 6;

async function getSlides() {
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
}

export default async function Home() {
  const slides = await getSlides();
  const slideCount = Math.max(slides.length, 1);
  const totalDurationSeconds = slideCount * slideIntervalSeconds;
  const fadeInPct = (10 / slideCount).toFixed(4);
  const holdPct = (70 / slideCount).toFixed(4);
  const fadeOutPct = (100 / slideCount).toFixed(4);

  return (
    <section className="relative min-h-[100svh] -mt-16 -mb-16 overflow-hidden pt-16 pb-16">
      <style>{`
        @keyframes hero-fade {
          0% { opacity: 0; }
          ${fadeInPct}% { opacity: 1; }
          ${holdPct}% { opacity: 1; }
          ${fadeOutPct}% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
      <div aria-hidden className="absolute inset-0">
        {slides.map((src, index) => (
          <div
            key={src}
            className="absolute inset-0 hero-slide"
            style={{
              animationDelay: `${index * slideIntervalSeconds}s`,
              animationDuration: `${totalDurationSeconds}s`,
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

      <Container className="relative flex min-h-[100svh] items-center justify-center py-12">
        <h1 className="sr-only">{site.name}</h1>
        <HomeCarousel />
      </Container>
    </section>
  );
}
